import type { Session, User } from '@/types/api-models';

// Session-related types
export interface SessionResponse {
  user: User;
  session: Session;
}

// Auth client session data type (returned by authClient.getSession())
export interface AuthClientSessionData {
  data: SessionResponse | null;
}

// Login data types
export interface LoginData {
  email: string;
  password: string;
}
