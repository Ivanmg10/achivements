export type Theme = "red" | "blue" | "yellow" | "green" | "dark";

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
  Developer: string;
  Publisher: string;
  Genre: string;
  Released: string; // puedes convertirlo a Date si lo procesas
  ReleasedAtGranularity: "year" | "month" | "day";
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
  type: "progression" | "win_condition" | "missable" | string;
  DateEarnedHardcore: string | null;
  DateEarned: string | null;
};

export type RetroAchievementsGameWithAchievements = {
  ID: number;
  Title: string;
  ConsoleID: number;
  ConsoleName: string;
  ForumTopicID: number;
  Flags: number | null;
  GameTitle: string;
  ImageIcon: string;
  ImageTitle: string;
  ImageIngame: string;
  ImageBoxArt: string;

  Publisher: string;
  Developer: string;
  Genre: string;

  Released: string;
  ReleasedAtGranularity: "year" | "month" | "day";

  IsFinal: boolean; // deprecated pero viene
  RichPresencePatch: string;
  GuideURL: string | null;
  ParentGameID: number | null;

  NumDistinctPlayers: number;
  NumDistinctPlayersCasual: number;
  NumDistinctPlayersHardcore: number;

  NumAchievements: number;
  Achievements: Record<string, RetroAchievement>;

  NumAwardedToUser: number;
  NumAwardedToUserHardcore: number;

  UserCompletion: string;
  UserCompletionHardcore: string;
  UserTotalPlaytime: number;

  HighestAwardKind: "mastered" | "completed" | string;
  HighestAwardDate: string;
};
