// Pre-generated from known schema (magichouse — eoelyqphaixgqlkyoxau).
// Regenerate after applying migration:
//   npx supabase gen types typescript --project-id eoelyqphaixgqlkyoxau --schema public > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          coins: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          coins?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          coins?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'players_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      stickers: {
        Row: {
          id: string
          name: string
          category: 'hat' | 'glasses' | 'bow' | 'toy'
          emoji: string
          price: number
        }
        Insert: {
          id: string
          name: string
          category: 'hat' | 'glasses' | 'bow' | 'toy'
          emoji: string
          price: number
        }
        Update: {
          id?: string
          name?: string
          category?: 'hat' | 'glasses' | 'bow' | 'toy'
          emoji?: string
          price?: number
        }
        Relationships: []
      }
      player_stickers: {
        Row: {
          player_id: string
          sticker_id: string
          purchased_at: string
        }
        Insert: {
          player_id: string
          sticker_id: string
          purchased_at?: string
        }
        Update: {
          player_id?: string
          sticker_id?: string
          purchased_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_stickers_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'player_stickers_sticker_id_fkey'
            columns: ['sticker_id']
            isOneToOne: false
            referencedRelation: 'stickers'
            referencedColumns: ['id']
          }
        ]
      }
      creative_canvas: {
        Row: {
          player_id: string
          canvas_data: Json
          updated_at: string
        }
        Insert: {
          player_id: string
          canvas_data?: Json
          updated_at?: string
        }
        Update: {
          player_id?: string
          canvas_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'creative_canvas_player_id_fkey'
            columns: ['player_id']
            isOneToOne: true
            referencedRelation: 'players'
            referencedColumns: ['id']
          }
        ]
      }
      quiz_history: {
        Row: {
          id: string
          player_id: string
          category:
            | 'shapes'
            | 'colors'
            | 'animals'
            | 'math'
            | 'vietnamese'
            | 'english'
            | 'addition'
            | 'subtraction'
            | 'timesTable'
            | 'grade2Vietnamese'
            | 'grade2English'
          score: number
          total_questions: number
          coins_earned: number
          completed_at: string
        }
        Insert: {
          id?: string
          player_id: string
          category:
            | 'shapes'
            | 'colors'
            | 'animals'
            | 'math'
            | 'vietnamese'
            | 'english'
            | 'addition'
            | 'subtraction'
            | 'timesTable'
            | 'grade2Vietnamese'
            | 'grade2English'
          score: number
          total_questions: number
          coins_earned: number
          completed_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          category?:
            | 'shapes'
            | 'colors'
            | 'animals'
            | 'math'
            | 'vietnamese'
            | 'english'
            | 'addition'
            | 'subtraction'
            | 'timesTable'
            | 'grade2Vietnamese'
            | 'grade2English'
          score?: number
          total_questions?: number
          coins_earned?: number
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_history_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Named row types for use in service modules
export type PlayerRow = Tables<'players'>
export type StickerRow = Tables<'stickers'>
export type PlayerStickerRow = Tables<'player_stickers'>
export type CreativeCanvasRow = Tables<'creative_canvas'>
export type QuizHistoryRow = Tables<'quiz_history'>

// Canvas item shape (element of creative_canvas.canvas_data JSONB array)
export interface CanvasItem {
  id: string
  emoji: string
  x: number
  y: number
  scale: number
  rotation: number
}
