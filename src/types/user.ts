export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  theme: string;
  avatar: string | null;
  admin: boolean;
  rausername: string | null;
  ra_display: string | null;
  location: string | null;
  steamid?: string | null;
  steamusername?: string | null;
  psnaccountid?: string | null;
  psnusername?: string | null;
  /** The linked PSN account was proven theirs (a code in its About Me). */
  psnVerified?: boolean;
  xboxxuid?: string | null;
  xboxgamertag?: string | null;
}
