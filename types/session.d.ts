import 'express-session';

declare module 'express-session' {
  interface SessionData {
    palette?: {
      name: string;
      colors: string[];
      created_at?: string;
      id?: number;
      user_id?: number;
    };
    passport?: {
      user?: {
        id: number;
        email: string;
      };
    };
  }
}
