import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: {
        id: number;
        email: string;
        timestamp?: number;
      };
    };
    palette?: {
      name: string;
      colors: string[];
      user_id?: number;
      id?: number;
      created_at?: string;
    } | null;
  }
}
