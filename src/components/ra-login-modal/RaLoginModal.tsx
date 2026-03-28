import { useState } from "react";
import CommonModal from "../common-modal/CommonModal";
import Spinner from "../main-spinner/Spinner";
import { useSession } from "next-auth/react";

export default function RaLoginModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !apiKey) return;
    setIsLoading(true);

    const user = await fetch(
      `/api/getUserProfile?username=${username}&publicKey=${apiKey}`,
    ).then((res) => res.json());

    if (user.message) {
      alert(user.message);
      setUsername("");
      setApiKey("");
      setIsLoading(false);
      return;
    }

    await fetch("/api/updateRaUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raUser: user }),
    });

    await update({ raUser: user });

    setIsLoading(false);
    setUsername("");
    setApiKey("");
    setIsOpen(false);
  };

  return (
    <CommonModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className="text-2xl mb-5">Iniciar sesion en Retroachivements</h2>
      <form className="flex flex-col gap-5" onSubmit={handleLogin}>
        {" "}
        {/* 👈 */}
        <input
          type="text"
          placeholder="Usuario"
          className="rounded-xl bg-bg-main p-3 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="apiKey"
          value={apiKey}
          className="rounded-xl bg-bg-main p-3 w-full"
          onChange={(e) => setApiKey(e.target.value)}
        />
        {!isLoading ? (
          <button
            type="submit"
            className="bg-bg-main p-3 rounded-lg hover:duration-500 hover:transform hover:scale-102 transition duration-500"
          >
            Iniciar sesion
          </button>
        ) : (
          <button
            disabled
            className="bg-bg-main p-3 rounded-lg flex justify-center items-center"
          >
            <Spinner size={12} />
          </button>
        )}
      </form>
    </CommonModal>
  );
}
