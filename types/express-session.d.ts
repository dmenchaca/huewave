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
    } | null;
  }
}
