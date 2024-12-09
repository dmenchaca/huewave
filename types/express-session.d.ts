import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: { user: number };
    cookie: {
      maxAge?: number;
    };
    palette?: {
      name: string;
      colors: string[];
      created_at?: string;
      id?: number;
      user_id?: number;
    };
    user?: {
      id: number;
      email: string;
    };
  }
}
