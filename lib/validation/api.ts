import { z } from 'zod'

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const AddCoinsSchema = z.object({
  amount: z.number().int().positive().max(1000),
})

export const BuyStickerSchema = z.object({
  stickerId: z.string().min(1, 'Sticker ID is required'),
})

export const CanvasItemSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
})

export const CanvasSchema = z.object({
  canvasData: z.array(CanvasItemSchema),
})

export const QuizHistorySchema = z.object({
  category: z.enum([
    'shapes', 'colors', 'animals', 'math', 'vietnamese', 'english',
    'addition', 'subtraction', 'timesTable',
  ]),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().positive(),
  coinsEarned: z.number().int().min(0),
})

export const MigrateSchema = z.object({
  coins: z.number().int().min(0),
  ownedStickers: z.array(z.string()),
})

export type SignupInput = z.infer<typeof SignupSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type AddCoinsInput = z.infer<typeof AddCoinsSchema>
export type BuyStickerInput = z.infer<typeof BuyStickerSchema>
export type CanvasInput = z.infer<typeof CanvasSchema>
export type QuizHistoryInput = z.infer<typeof QuizHistorySchema>
export type MigrateInput = z.infer<typeof MigrateSchema>
