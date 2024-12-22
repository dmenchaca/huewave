export interface Color {
  hex: string;
  locked: boolean;
}

export interface SavedPalette {
  id: string;
  name: string;
  colors: Color[];
  user_id: string;
  created_at: string;
  updated_at: string;
}