jest.mock("@/lib/db", () => ({ __esModule: true, default: { query: jest.fn() } }));
jest.mock("bcrypt", () => ({ compare: jest.fn() }));
jest.mock("@/lib/userRecord", () => ({
  ...jest.requireActual("@/lib/userRecord"),
  loadUserSynced: jest.fn(),
  loadUserByUsername: jest.fn(),
}));
jest.mock("@/lib/attemptLimit", () => ({
  ...jest.requireActual("@/lib/attemptLimit"),
  isLimited: jest.fn(),
  recordAttempt: jest.fn(),
}));

import bcrypt from "bcrypt";
import { authHandlerOptions, authOptions, SESSION_REVOKED, TOO_MANY_ATTEMPTS } from "./authOptions";
import { loadUserByUsername, loadUserSynced, passwordVersion } from "@/lib/userRecord";
import { isLimited, recordAttempt } from "@/lib/attemptLimit";

const row = {
  id: 1,
  username: "ivan",
  password: "$2b$10$hash",
  theme: "dark",
  avatar: null,
  raid: "ra-key",
  rausername: "Ivan",
  steamid: "76561198000000000",
  steamusername: "IvanSteam",
  email: "ivan@test.com",
  admin: false,
  raUser: { User: "Ivan" },
  location: "ES",
  favorite_game: null,
  favorite_steam_game: null,
};
const PWV = passwordVersion(row.password);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authorize = (authOptions.providers[0] as any).options.authorize as (c: unknown, r?: unknown) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwt = authOptions.callbacks!.jwt as (p: any) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const session = authOptions.callbacks!.session as (p: any) => Promise<any>;
const req = { headers: { "x-forwarded-for": "9.9.9.9" } };
const SYNCED_AT = 1_000;

/** What loadUserSynced answers: the row, and when it was read. */
function stored(value: unknown, at = SYNCED_AT) {
  (loadUserSynced as jest.Mock).mockResolvedValue({ row: value, at });
}

beforeEach(() => {
  jest.clearAllMocks();
  (loadUserByUsername as jest.Mock).mockResolvedValue(row);
  stored(row);
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  (isLimited as jest.Mock).mockResolvedValue(false);
});

describe("authorize", () => {
  test("returns the user's token fields on the right password", async () => {
    const user = await authorize({ username: "ivan", password: "pass" }, req);
    expect(user).toMatchObject({ id: "1", name: "ivan", raLinked: true, steamid: row.steamid, pwv: PWV });
    expect(typeof user.syncedAt).toBe("number");
    expect(recordAttempt).not.toHaveBeenCalled();
  });

  test("a wrong password is null, and counts against the address and the account", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    expect(await authorize({ username: "Ivan", password: "wrong" }, req)).toBeNull();
    expect(recordAttempt).toHaveBeenCalledWith("login", "9.9.9.9:ivan");
    expect(recordAttempt).toHaveBeenCalledWith("login-ip", "9.9.9.9");
  });

  test("an unknown username still runs a hash comparison, so it takes as long as a wrong password", async () => {
    (loadUserByUsername as jest.Mock).mockResolvedValue(null);
    expect(await authorize({ username: "nobody", password: "x" }, req)).toBeNull();
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(recordAttempt).toHaveBeenCalledWith("login", "9.9.9.9:nobody");
  });

  test("too many failures refuse the attempt before the password is even checked", async () => {
    (isLimited as jest.Mock).mockImplementation(async (scope: string) => scope === "login");
    await expect(authorize({ username: "ivan", password: "pass" }, req)).rejects.toThrow(TOO_MANY_ATTEMPTS);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test("so do too many failures from one address across accounts", async () => {
    (isLimited as jest.Mock).mockImplementation(async (scope: string) => scope === "login-ip");
    await expect(authorize({ username: "someone", password: "pass" }, req)).rejects.toThrow(TOO_MANY_ATTEMPTS);
  });

  test("missing or malformed credentials are null", async () => {
    expect(await authorize(null, req)).toBeNull();
    expect(await authorize({ username: "ivan" }, req)).toBeNull();
    expect(await authorize({ username: ["ivan"], password: "x" }, req)).toBeNull();
    expect(loadUserByUsername).not.toHaveBeenCalled();
  });
});

describe("jwt", () => {
  test("signing in copies the user into the token", async () => {
    const token = await jwt({ token: {}, user: { id: "1", theme: "dark", pwv: PWV } });
    expect(token).toMatchObject({ id: "1", theme: "dark", pwv: PWV });
    expect(loadUserSynced).not.toHaveBeenCalled();
  });

  test("later reads refresh the token from the database", async () => {
    const token = await jwt({ token: { id: "1", pwv: PWV, theme: "light", admin: true } });
    expect(loadUserSynced).toHaveBeenCalledWith("1", { fresh: false, notBefore: 0 });
    expect(token.theme).toBe("dark");
    expect(token.admin).toBe(false);
    expect(token.syncedAt).toBe(SYNCED_AT);
  });

  test("an update from the browser re-reads the row, bypassing the cache", async () => {
    await jwt({ token: { id: "1", pwv: PWV }, trigger: "update", session: {} });
    expect(loadUserSynced).toHaveBeenCalledWith("1", { fresh: true, notBefore: 0 });
  });

  test("a cached row older than the token is not allowed to undo it (another instance saw a newer change)", async () => {
    await jwt({ token: { id: "1", pwv: PWV, syncedAt: 5_000 } });
    expect(loadUserSynced).toHaveBeenCalledWith("1", { fresh: false, notBefore: 5_000 });
  });

  test("whatever an update sends is ignored: a Steam or RA account cannot be claimed from the browser", async () => {
    const token = await jwt({
      token: { id: "1", pwv: PWV },
      trigger: "update",
      session: { steamid: "76561190000000666", rausername: "Someone", raidKey: "stolen", admin: true, name: "admin" },
    });
    expect(token.steamid).toBe(row.steamid);
    expect(token.rausername).toBe("Ivan");
    expect(token.raid).toBe("ra-key");
    expect(token.admin).toBe(false);
    expect(token.name).toBe("ivan");
  });

  test("a changed password ends the session", async () => {
    await expect(jwt({ token: { id: "1", pwv: "an-older-hash" } })).rejects.toThrow(SESSION_REVOKED);
  });

  test("a token from before password fingerprints is not trusted", async () => {
    await expect(jwt({ token: { id: "1" } })).rejects.toThrow(SESSION_REVOKED);
  });

  test("a deleted account ends the session", async () => {
    stored(null);
    await expect(jwt({ token: { id: "1", pwv: PWV } })).rejects.toThrow(SESSION_REVOKED);
  });

  test("a database blip keeps the token as it was rather than signing everyone out", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (loadUserSynced as jest.Mock).mockRejectedValue(new Error("db down"));
    const token = { id: "1", pwv: PWV, theme: "light" };
    await expect(jwt({ token })).resolves.toBe(token);
  });

  test("raLinked needs both the RA username and its key", async () => {
    stored({ ...row, raid: null });
    expect((await jwt({ token: { id: "1", pwv: PWV } })).raLinked).toBe(false);
  });
});

describe("session", () => {
  const token = { id: "1", name: "ivan", theme: "dark", raid: "ra-key", rausername: "Ivan", raLinked: true, email: null, pwv: PWV };

  test("server-side sessions carry the RA key, for the routes that call RA", async () => {
    const s = await session({ session: { user: {} }, token });
    expect(s.user).toMatchObject({ id: "1", raid: "ra-key", raLinked: true });
    expect(s.user.email).toBeUndefined();
    expect(s.user.pwv).toBeUndefined();
  });

  test("the session served to the browser never has the RA key", async () => {
    const s = await authHandlerOptions.callbacks!.session!({ session: { user: {} }, token } as never);
    expect(s.user).not.toHaveProperty("raid");
    expect(s.user).toMatchObject({ id: "1", rausername: "Ivan", raLinked: true });
  });

  test("with no token the session is left alone", async () => {
    const original = { user: { name: "unchanged" } };
    expect((await session({ session: original, token: null })).user.name).toBe("unchanged");
  });
});

describe("logger", () => {
  test("a revoked session is not logged as an error; anything else is", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    authOptions.logger!.error!("JWT_SESSION_ERROR", new Error(SESSION_REVOKED));
    expect(spy).not.toHaveBeenCalled();
    authOptions.logger!.error!("JWT_SESSION_ERROR", new Error("bad"));
    expect(spy).toHaveBeenCalled();
  });
});
