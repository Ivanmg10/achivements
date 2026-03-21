export type Theme = "red" | "blue" | "yellow" | "green" | "dark";

type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

export type RetroAchievementsUserProfile = {
  ID: number;
  User: string;
  ULID: string;
  UserPic: string;
  MemberSince: string; // puedes convertirlo luego a Date si quieres
  Motto: string;
  Permissions: number;
  RichPresenceMsg: string;
  LastGameID: number;
  ContribCount: number;
  ContribYield: number;
  TotalPoints: number;
  TotalSoftcorePoints: number;
  TotalTruePoints: number;
  Untracked: number;
  UserWallActive: number;
};

export type RetroAchievementsGame = {
  Title: string;
  GameTitle: string;
  ConsoleID: number;
  ConsoleName: string;
  Console: string;
  ForumTopicID: number;
  Flags: number;
  GameIcon: string;
  ImageIcon: string;
  ImageTitle: string;
  ImageIngame: string;
  ImageBoxArt: string;
  Developer: string | null;
  Publisher: string | null;
  Genre: string | null;
  Released: string;
  ReleasedAtGranularity: "year" | "month" | "day" | string;
  ID?: string;
};

export type RetroAchievement = {
  ID: number;
  NumAwarded: number;
  NumAwardedHardcore: number;

  Title: string;
  Description: string;

  Points: number;
  TrueRatio: number;

  Author: string;
  AuthorULID: string;

  DateModified: string;
  DateCreated: string;

  BadgeName: string;

  DisplayOrder: number;

  MemAddr: string;

  Type?: string | null;

  DateEarned?: string | null;
  DateEarnedHardcore?: string | null;
};

export type RetroAchievementsGameWithAchievementsBase = {
  ID: number;
  Title: string;

  ConsoleID: number;
  ConsoleName: string;

  ForumTopicID: number;
  Flags: number | null;

  ImageIcon: string;
  ImageTitle: string;
  ImageIngame: string;
  ImageBoxArt: string;

  Publisher: string | null;
  Developer: string | null;
  Genre: string | null;

  Released: string;
  ReleasedAtGranularity: string;

  IsFinal: boolean;
  RichPresencePatch: string;

  ParentGameID: number | null;

  NumDistinctPlayers: number;
  NumDistinctPlayersCasual: number;
  NumDistinctPlayersHardcore: number;

  NumAchievements: number;

  Achievements: Record<string, RetroAchievement | undefined>;

  NumAwardedToUser: number;
  NumAwardedToUserHardcore: number;

  UserCompletion: string;
  UserCompletionHardcore: string;
  UserTotalPlaytime: number;

  GameTitle?: string;
  GuideURL?: string | null;
  HighestAwardKind?: string;
  HighestAwardDate?: string;
};

export type RetroAchievementsGameWithAchievements =
  Nullable<RetroAchievementsGameWithAchievementsBase>;

export type WantToPlayGame = {
  ID: number;
  Title: string;
  ImageIcon: string;
  ConsoleID: number;
  ConsoleName: string;
  PointsTotal: number;
  AchievementsPublished: number;
  GameTitle: string;
};

export type WantToPlayUser = {
  Count: number;
  Total: number;
  Results: WantToPlayGame[];
};
