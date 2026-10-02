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
}
