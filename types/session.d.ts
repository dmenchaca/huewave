import 'express-session';

declare module 'express-session' {
  interface SessionData {
    palette?: {
      name: string;
      colors: string[];
    };
  }
}
