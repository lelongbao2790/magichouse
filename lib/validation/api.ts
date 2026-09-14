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
    'grade2Vietnamese', 'grade2English',
  ]),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().positive(),
  coinsEarned: z.number().int().min(0),
})

export const MigrateSchema = z.object({
  coins: z.number().int().min(0),
  ownedStickers: z.array(z.string()),
})

// Subject content — UI locale for the gameplay questions endpoint.
export const LocaleSchema = z.enum(['vi', 'en'])

// My House — room enum, shared across every route that accepts a `room` (BR-1).
// The DB's `rooms` table is the source of truth for row data, but this enum stays
// the single source of truth for "which 4 values are valid" at the API layer.
export const RoomSchema = z.enum(['bedroom', 'kitchen', 'living_room', 'garden'])

export const BuyHouseItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
})

// One placed item within a room's layout (BR-7): x/y clamp to [5, 95] (matches the
// existing Creative Room bound), scale to [0.5, 2.5] (matches handleResizeSticker's
// clamp), rotation just needs to be a finite number (creative-room.tsx never bounds it).
export const PlacedHouseItemSchema = z.object({
  id: z.string().min(1, 'id is required'),
  itemId: z.string().min(1, 'itemId is required'),
  x: z.number().min(5, 'x must be >= 5').max(95, 'x must be <= 95'),
  y: z.number().min(5, 'y must be >= 5').max(95, 'y must be <= 95'),
  scale: z.number().min(0.5, 'scale must be >= 0.5').max(2.5, 'scale must be <= 2.5'),
  rotation: z.number().finite('rotation must be a finite number'),
})

// The layoutData length cap (BR-6) is a raw array-length bound tied to the room's
// active catalog item count, known only at request time (not at module-load time) —
// this factory bakes that count into the schema's `.max()` rather than hardcoding it.
export function createHouseLayoutSchema(maxItems: number) {
  return z.object({
    room: RoomSchema,
    layoutData: z
      .array(PlacedHouseItemSchema)
      .max(maxItems, `layoutData cannot exceed ${maxItems} items`),
  })
}

// Admin content API (U3) — create / update a subject_questions row.
export const OptionsArraySchema = z.array(z.string().min(1)).length(3, 'Must have exactly 3 options')

export const SubjectQuestionCreateSchema = z.object({
  subjectKey: z.string().min(1, 'subjectKey is required'),
  promptVi: z.string().min(1).nullable().optional(),
  promptEn: z.string().min(1).nullable().optional(),
  optionsVi: OptionsArraySchema.nullable().optional(),
  optionsEn: OptionsArraySchema.nullable().optional(),
  correctIndex: z.number().int().min(0).max(2),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export const SubjectQuestionUpdateSchema = SubjectQuestionCreateSchema
  .partial()
  .omit({ subjectKey: true })
  .extend({ id: z.string().uuid('id must be a UUID') })

export type SignupInput = z.infer<typeof SignupSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type AddCoinsInput = z.infer<typeof AddCoinsSchema>
export type BuyStickerInput = z.infer<typeof BuyStickerSchema>
export type CanvasInput = z.infer<typeof CanvasSchema>
export type QuizHistoryInput = z.infer<typeof QuizHistorySchema>
export type MigrateInput = z.infer<typeof MigrateSchema>
export type LocaleInput = z.infer<typeof LocaleSchema>
export type SubjectQuestionCreateInput = z.infer<typeof SubjectQuestionCreateSchema>
export type SubjectQuestionUpdateInput = z.infer<typeof SubjectQuestionUpdateSchema>
export type RoomInput = z.infer<typeof RoomSchema>
export type BuyHouseItemInput = z.infer<typeof BuyHouseItemSchema>
export type PlacedHouseItemInput = z.infer<typeof PlacedHouseItemSchema>
export type HouseLayoutInput = z.infer<ReturnType<typeof createHouseLayoutSchema>>
