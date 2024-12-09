import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: {
        id: number;
        email: string;
        name?: string;
      };
    };
    cookie?: {
      maxAge?: number;
      originalMaxAge?: number;
      expires?: Date;
      secure?: boolean;
      httpOnly?: boolean;
      path?: string;
      domain?: string;
      sameSite?: boolean | 'lax' | 'strict' | 'none';
    };
    palette?: {
      name: string;
      colors: string[];
      created_at?: string;
      id?: number;
      user_id?: number;
      description?: string;
      is_public?: boolean;
    };
    user?: {
      id: number;
      email: string;
      name?: string;
      created_at?: string;
      updated_at?: string;
    };
  }
}
