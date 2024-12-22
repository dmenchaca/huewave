export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      palettes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          colors: Json
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          colors: Json
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          colors?: Json
          user_id?: string
        }
      }
    }
  }
}