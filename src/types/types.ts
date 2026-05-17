export type Theme =
  | 'dark'
  | 'light'
  | 'blue'
  | 'purple'
  | 'green'
  | 'red';

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
  AchievementsPublished?: number;
  GameID?: number;
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

export type SubsetGame = {
  ID: number
  Title: string
  ImageIcon: string
  NumAchievements: number
}

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
  Subsets?: SubsetGame[];

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
  GameID?: number;
};

export type WantToPlayUser = {
  Count: number;
  Total: number;
  Results: WantToPlayGame[];
};

export type RecentlyPlayedGame = {
  GameID: number;
  Title: string;
  ImageIcon: string;
  ConsoleName: string;
  LastPlayed: string; // "2024-01-15 20:30:00"
  NumPossibleAchievements: number;
  PossibleScore: number;
  NumAchieved: number;
  ScoreAchieved: number;
  NumAchievedHardcore: number;
  ScoreAchievedHardcore: number;
}

export type RetroAchievementsGameCompleted = {
  GameID: number;
  Title: string;
  ImageIcon: string;
  ConsoleID: number;
  ConsoleName: string;
  MaxPossible: number;
  NumAwarded: number;
  PctWon: string;
  HardcoreMode: string;
  ID?: string;
  GameTitle?: string;
};

export type UserRankAndScore = {
  Score: number
  SoftcoreScore: number
  Rank: number
}

export type UserAward = {
  AwardedAt: string
  AwardType: 'Game Beaten' | 'Mastery/Completion' | string
  AwardData: number
  AwardDataExtra: number
  Title: string
  ConsoleName: string
  ImageIcon: string
}

export type UserAwards = {
  TotalAwardsCount: number
  MasteryAwardsCount: number
  CompletionAwardsCount: number
  BeatenHardcoreAwardsCount: number
  BeatenSoftcoreAwardsCount: number
  EventAwardsCount: number
  VisibleUserAwards: UserAward[]
}

export type RecentAchievement = {
  Date: string; // "2024-01-15 20:30:00"
  HardcoreMode: string;
  AchievementID: number;
  Title: string;
  Description: string;
  BadgeName: string;
  Points: number;
  TrueRatio?: number;
  GameID: number;
  GameTitle: string;
  GameIcon?: string;
  ConsoleName: string;
};

export type TopTenUser = {
  1: string  // username
  2: string  // total points
  3: string  // total true points
}

export type PopularGame = {
  ID: number
  Title: string
  ImageIcon: string
  ConsoleID: number
  ConsoleName: string
  NumAchievements: number
  Points: number
}

export type GameGroupItem = {
  id: number
  game_id: number
  title: string
  image_icon: string | null
  console_name: string | null
  pct_won: string
  num_awarded: number
  max_possible: number
  points_won: number
  max_points: number
  position: number
  added_at: string
}

export type Streak = {
  start: string
  end: string
  days: number
  achievements: RecentAchievement[]
}

export type GameGroup = {
  id: number
  title: string
  description: string | null
  icon: string | null
  is_public: boolean
  position: number
  created_at: string
  updated_at: string
  game_count: number
  total_awarded: number
  total_possible: number
  items?: GameGroupItem[]
}
