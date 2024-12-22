export interface PasswordResetState {
  email: string;
  loading: boolean;
  success: boolean;
  error: string | null;
}

export interface NewPasswordState {
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
}