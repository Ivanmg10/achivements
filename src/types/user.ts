export interface User {
  id: number;
  username: string;
  password: string;
  raId?: string | null;
  theme: string;
  avatar?: string | null;
}
