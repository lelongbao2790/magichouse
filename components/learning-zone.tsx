"use client"

import { useState, useMemo } from "react"
import { useLanguage } from "@/contexts/language-context"
import { type Language } from "@/data/translations"
import { type Difficulty, randomDifficulty, calculateSessionCoins } from "@/lib/coin-rewards"
import { Grade2SubjectView } from "./grade2-subject-view"
import { CoinDisplay } from "./coin-display"
import { ThemeSwitcher } from "./theme-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { QuizModal } from "./quiz-modal"
import { Fireworks } from "./fireworks"
import {
  Shapes, Palette, PawPrint, Calculator, BookOpen, Languages,
  Baby, GraduationCap, ChevronLeft, Star, BookOpenCheck,
  BookCheck, Plus, Minus, X
} from "lucide-react"

interface LearningZoneProps {
  name: string
  onBack: () => void
  onQuizComplete: (category: string, score: number, totalQuestions: number, coinsEarned: number) => void
  showFireworks: boolean
  onFireworksComplete: () => void
}

type TabType = "preschool" | "grade1" | "grade2"
type QuestionFormat = "symbol" | "word"
type DistractorStrategy = "offset" | "adjacent"
type DistractorContext = "arithmetic" | "multiply"

export function generateDistractors(
  correct: number,
  strategy: DistractorStrategy,
  context: DistractorContext,
  multiplier?: number,
  multiplicand?: number
): number[] {
  const distractors: number[] = []
  const used = new Set<number>([correct])

  const getAdjacentPool = (): number[] => {
    if (context === "multiply" && multiplier !== undefined && multiplicand !== undefined) {
      const pool: number[] = []
      for (const m of [multiplier - 1, multiplier + 1])
        if (m >= 2 && m <= 9) pool.push(m * multiplicand)
      for (const m of [multiplicand - 1, multiplicand + 1])
        if (m >= 1 && m <= 10) pool.push(multiplier * m)
      return pool
    }
    return [correct + 10, correct - 10].filter(v => v >= 0)
  }

  const adjPool = strategy === "adjacent" ? getAdjacentPool() : []
  let adjIdx = 0

  while (distractors.length < 2) {
    let candidate: number
    if (strategy === "adjacent" && adjIdx < adjPool.length) {
      candidate = adjPool[adjIdx++]
    } else {
      const delta = Math.floor(Math.random() * 15) + 1
      candidate = Math.random() > 0.5 ? correct + delta : correct - delta
    }
    if (candidate >= 0 && !used.has(candidate)) {
      used.add(candidate)
      distractors.push(candidate)
    }
  }
  return distractors
}

export function insertAtRandom(
  correct: number,
  distractors: number[]
): { options: string[]; correctIndex: number } {
  const correctIndex = Math.floor(Math.random() * 3)
  const opts = distractors.map(String)
  opts.splice(correctIndex, 0, String(correct))
  return { options: opts, correctIndex }
}

export function generateAdditionQuestion(): { question: string; options: string[]; correctIndex: number; difficulty: Difficulty } {
  const a = Math.floor(Math.random() * 100) + 1
  const b = Math.floor(Math.random() * 100) + 1
  const correct = a + b
  const strategy: DistractorStrategy = Math.random() > 0.5 ? "offset" : "adjacent"
  const distractors = generateDistractors(correct, strategy, "arithmetic")
  const { options, correctIndex } = insertAtRandom(correct, distractors)
  return { question: `${a} + ${b} = ?`, options, correctIndex, difficulty: randomDifficulty() }
}

export function generateSubtractionQuestion(): { question: string; options: string[]; correctIndex: number; difficulty: Difficulty } {
  const a = Math.floor(Math.random() * 100) + 1
  const b = Math.floor(Math.random() * 100) + 1
  const minuend = Math.max(a, b)
  const subtrahend = Math.min(a, b)
  const correct = minuend - subtrahend
  const strategy: DistractorStrategy = Math.random() > 0.5 ? "offset" : "adjacent"
  const distractors = generateDistractors(correct, strategy, "arithmetic")
  const { options, correctIndex } = insertAtRandom(correct, distractors)
  return { question: `${minuend} - ${subtrahend} = ?`, options, correctIndex, difficulty: randomDifficulty() }
}

export function generateTimesTableQuestion(
  language: Language
): { question: string; options: string[]; correctIndex: number; difficulty: Difficulty } {
  const multiplier = Math.floor(Math.random() * 8) + 2
  const multiplicand = Math.floor(Math.random() * 10) + 1
  const correct = multiplier * multiplicand
  const format: QuestionFormat = Math.random() > 0.5 ? "symbol" : "word"
  const question =
    format === "symbol"
      ? `${multiplier} × ${multiplicand} = ?`
      : language === "vi"
        ? `${multiplier} nhân ${multiplicand} bằng mấy?`
        : `${multiplier} times ${multiplicand} equals?`
  const strategy: DistractorStrategy = Math.random() > 0.5 ? "offset" : "adjacent"
  const distractors = generateDistractors(correct, strategy, "multiply", multiplier, multiplicand)
  const { options, correctIndex } = insertAtRandom(correct, distractors)
  return { question, options, correctIndex, difficulty: randomDifficulty() }
}

function generateMathQuestion(): { question: string; options: string[]; correctIndex: number; difficulty: Difficulty } {
  const isAddition = Math.random() > 0.5
  let a: number, b: number, correct: number
  if (isAddition) {
    a = Math.floor(Math.random() * 101)
    b = Math.floor(Math.random() * (101 - a))
    correct = a + b
  } else {
    a = Math.floor(Math.random() * 101)
    b = Math.floor(Math.random() * (a + 1))
    correct = a - b
  }
  const wrongSet = new Set<number>()
  while (wrongSet.size < 2) {
    const delta = Math.floor(Math.random() * 9) + 1
    const candidate = Math.random() > 0.5 ? correct + delta : correct - delta
    if (candidate !== correct && candidate >= 0 && candidate <= 200) {
      wrongSet.add(candidate)
    }
  }
  const [w1, w2] = Array.from(wrongSet)
  const correctPos = Math.floor(Math.random() * 3)
  const options = [String(w1), String(w2)]
  options.splice(correctPos, 0, String(correct))
  return { question: `${a} ${isAddition ? "+" : "-"} ${b} = ?`, options, correctIndex: correctPos, difficulty: randomDifficulty() }
}

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export function LearningZone({ name, onBack, onQuizComplete, showFireworks, onFireworksComplete }: LearningZoneProps) {
  const { t, language } = useLanguage()
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("preschool")
  const mathQuestions = useMemo(() => Array.from({ length: 5 }, generateMathQuestion), [])
  const additionQuestions = useMemo(() => Array.from({ length: 10 }, generateAdditionQuestion), [])
  const subtractionQuestions = useMemo(() => Array.from({ length: 10 }, generateSubtractionQuestion), [])
  const timesTableQuestions = useMemo(() => Array.from({ length: 10 }, () => generateTimesTableQuestion(language)), [language])

  const grade2VietnameseAllQuestions = [
    { question: t("quizVietnameseGrade2", "q1"), options: [t("quizVietnameseGrade2", "q1o1"), t("quizVietnameseGrade2", "q1o2"), t("quizVietnameseGrade2", "q1o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q2"), options: [t("quizVietnameseGrade2", "q2o1"), t("quizVietnameseGrade2", "q2o2"), t("quizVietnameseGrade2", "q2o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q3"), options: [t("quizVietnameseGrade2", "q3o1"), t("quizVietnameseGrade2", "q3o2"), t("quizVietnameseGrade2", "q3o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q4"), options: [t("quizVietnameseGrade2", "q4o1"), t("quizVietnameseGrade2", "q4o2"), t("quizVietnameseGrade2", "q4o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q5"), options: [t("quizVietnameseGrade2", "q5o1"), t("quizVietnameseGrade2", "q5o2"), t("quizVietnameseGrade2", "q5o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q6"), options: [t("quizVietnameseGrade2", "q6o1"), t("quizVietnameseGrade2", "q6o2"), t("quizVietnameseGrade2", "q6o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q7"), options: [t("quizVietnameseGrade2", "q7o1"), t("quizVietnameseGrade2", "q7o2"), t("quizVietnameseGrade2", "q7o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q8"), options: [t("quizVietnameseGrade2", "q8o1"), t("quizVietnameseGrade2", "q8o2"), t("quizVietnameseGrade2", "q8o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q9"), options: [t("quizVietnameseGrade2", "q9o1"), t("quizVietnameseGrade2", "q9o2"), t("quizVietnameseGrade2", "q9o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q10"), options: [t("quizVietnameseGrade2", "q10o1"), t("quizVietnameseGrade2", "q10o2"), t("quizVietnameseGrade2", "q10o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q11"), options: [t("quizVietnameseGrade2", "q11o1"), t("quizVietnameseGrade2", "q11o2"), t("quizVietnameseGrade2", "q11o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q12"), options: [t("quizVietnameseGrade2", "q12o1"), t("quizVietnameseGrade2", "q12o2"), t("quizVietnameseGrade2", "q12o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q13"), options: [t("quizVietnameseGrade2", "q13o1"), t("quizVietnameseGrade2", "q13o2"), t("quizVietnameseGrade2", "q13o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q14"), options: [t("quizVietnameseGrade2", "q14o1"), t("quizVietnameseGrade2", "q14o2"), t("quizVietnameseGrade2", "q14o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizVietnameseGrade2", "q15"), options: [t("quizVietnameseGrade2", "q15o1"), t("quizVietnameseGrade2", "q15o2"), t("quizVietnameseGrade2", "q15o3")], correctIndex: 2, difficulty: randomDifficulty() },
  ]

  const grade2EnglishAllQuestions = [
    { question: t("quizEnglishGrade2", "q1"), options: [t("quizEnglishGrade2", "q1o1"), t("quizEnglishGrade2", "q1o2"), t("quizEnglishGrade2", "q1o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q2"), options: [t("quizEnglishGrade2", "q2o1"), t("quizEnglishGrade2", "q2o2"), t("quizEnglishGrade2", "q2o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q3"), options: [t("quizEnglishGrade2", "q3o1"), t("quizEnglishGrade2", "q3o2"), t("quizEnglishGrade2", "q3o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q4"), options: [t("quizEnglishGrade2", "q4o1"), t("quizEnglishGrade2", "q4o2"), t("quizEnglishGrade2", "q4o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q5"), options: [t("quizEnglishGrade2", "q5o1"), t("quizEnglishGrade2", "q5o2"), t("quizEnglishGrade2", "q5o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q6"), options: [t("quizEnglishGrade2", "q6o1"), t("quizEnglishGrade2", "q6o2"), t("quizEnglishGrade2", "q6o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q7"), options: [t("quizEnglishGrade2", "q7o1"), t("quizEnglishGrade2", "q7o2"), t("quizEnglishGrade2", "q7o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q8"), options: [t("quizEnglishGrade2", "q8o1"), t("quizEnglishGrade2", "q8o2"), t("quizEnglishGrade2", "q8o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q9"), options: [t("quizEnglishGrade2", "q9o1"), t("quizEnglishGrade2", "q9o2"), t("quizEnglishGrade2", "q9o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q10"), options: [t("quizEnglishGrade2", "q10o1"), t("quizEnglishGrade2", "q10o2"), t("quizEnglishGrade2", "q10o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q11"), options: [t("quizEnglishGrade2", "q11o1"), t("quizEnglishGrade2", "q11o2"), t("quizEnglishGrade2", "q11o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q12"), options: [t("quizEnglishGrade2", "q12o1"), t("quizEnglishGrade2", "q12o2"), t("quizEnglishGrade2", "q12o3")], correctIndex: 0, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q13"), options: [t("quizEnglishGrade2", "q13o1"), t("quizEnglishGrade2", "q13o2"), t("quizEnglishGrade2", "q13o3")], correctIndex: 1, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q14"), options: [t("quizEnglishGrade2", "q14o1"), t("quizEnglishGrade2", "q14o2"), t("quizEnglishGrade2", "q14o3")], correctIndex: 2, difficulty: randomDifficulty() },
    { question: t("quizEnglishGrade2", "q15"), options: [t("quizEnglishGrade2", "q15o1"), t("quizEnglishGrade2", "q15o2"), t("quizEnglishGrade2", "q15o3")], correctIndex: 0, difficulty: randomDifficulty() },
  ]

  const grade2VietnamesePool = useMemo(() => shuffleAndTake(grade2VietnameseAllQuestions, 10), [])
  const grade2EnglishPool = useMemo(() => shuffleAndTake(grade2EnglishAllQuestions, 10), [])

  // Quiz data with translations
  const quizData = {
        shapes: {
      title: t("quizShapes", "title"),
      questions: [
        { question: t("quizShapes", "q1"), options: [t("quizShapes", "q1o1"), t("quizShapes", "q1o2"), t("quizShapes", "q1o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q2"), options: [t("quizShapes", "q2o1"), t("quizShapes", "q2o2"), t("quizShapes", "q2o3")], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q3"), options: [t("quizShapes", "q3o1"), t("quizShapes", "q3o2"), t("quizShapes", "q3o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q4"), options: [t("quizShapes", "q4o1"), t("quizShapes", "q4o2"), t("quizShapes", "q4o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q5"), options: [t("quizShapes", "q5o1"), t("quizShapes", "q5o2"), t("quizShapes", "q5o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q6"), options: [t("quizShapes", "q6o1"), t("quizShapes", "q6o2"), t("quizShapes", "q6o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q7"), options: [t("quizShapes", "q7o1"), t("quizShapes", "q7o2"), t("quizShapes", "q7o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q8"), options: [t("quizShapes", "q8o1"), t("quizShapes", "q8o2"), t("quizShapes", "q8o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q9"), options: [t("quizShapes", "q9o1"), t("quizShapes", "q9o2"), t("quizShapes", "q9o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizShapes", "q10"), options: [t("quizShapes", "q10o1"), t("quizShapes", "q10o2"), t("quizShapes", "q10o3")], correctIndex: 2, difficulty: randomDifficulty() },
      ]
    },
    colors: {
      title: t("quizColors", "title"),
      questions: [
        { question: t("quizColors", "q1"), options: [t("quizColors", "q1o1"), t("quizColors", "q1o2"), t("quizColors", "q1o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizColors", "q2"), options: [t("quizColors", "q2o1"), t("quizColors", "q2o2"), t("quizColors", "q2o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizColors", "q3"), options: [t("quizColors", "q3o1"), t("quizColors", "q3o2"), t("quizColors", "q3o3")], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizColors", "q4"), options: [t("quizColors", "q4o1"), t("quizColors", "q4o2"), t("quizColors", "q4o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizColors", "q5"), options: [t("quizColors", "q5o1"), t("quizColors", "q5o2"), t("quizColors", "q5o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizColors", "q6"), options: [t("quizColors", "q6o1"), t("quizColors", "q6o2"), t("quizColors", "q6o3")], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizColors", "q7"), options: [t("quizColors", "q7o1"), t("quizColors", "q7o2"), t("quizColors", "q7o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizColors", "q8"), options: [t("quizColors", "q8o1"), t("quizColors", "q8o2"), t("quizColors", "q8o3")], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizColors", "q9"), options: [t("quizColors", "q9o1"), t("quizColors", "q9o2"), t("quizColors", "q9o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizColors", "q10"), options: [t("quizColors", "q10o1"), t("quizColors", "q10o2"), t("quizColors", "q10o3")], correctIndex: 1, difficulty: randomDifficulty() },
      ]
    },
    animals: {
      title: t("quizAnimals", "title"),
      questions: [
        { question: t("quizAnimals", "q1"), options: [t("quizAnimals", "q1o1"), t("quizAnimals", "q1o2"), t("quizAnimals", "q1o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q2"), options: [t("quizAnimals", "q2o1"), t("quizAnimals", "q2o2"), t("quizAnimals", "q2o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q3"), options: [t("quizAnimals", "q3o1"), t("quizAnimals", "q3o2"), t("quizAnimals", "q3o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q4"), options: [t("quizAnimals", "q4o1"), t("quizAnimals", "q4o2"), t("quizAnimals", "q4o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q5"), options: [t("quizAnimals", "q5o1"), t("quizAnimals", "q5o2"), t("quizAnimals", "q5o3")], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q6"), options: [t("quizAnimals", "q6o1"), t("quizAnimals", "q6o2"), t("quizAnimals", "q6o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q7"), options: [t("quizAnimals", "q7o1"), t("quizAnimals", "q7o2"), t("quizAnimals", "q7o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q8"), options: [t("quizAnimals", "q8o1"), t("quizAnimals", "q8o2"), t("quizAnimals", "q8o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q9"), options: [t("quizAnimals", "q9o1"), t("quizAnimals", "q9o2"), t("quizAnimals", "q9o3")], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizAnimals", "q10"), options: [t("quizAnimals", "q10o1"), t("quizAnimals", "q10o2"), t("quizAnimals", "q10o3")], correctIndex: 0, difficulty: randomDifficulty() },
      ]
    },
        math: {
      title: t("quizMath", "title"),
      questions: mathQuestions,
    },
    vietnamese: {
      title: t("quizVietnamese", "title"),
      questions: [
        { question: t("quizVietnamese", "q1"), options: ["A", "B", "C"], correctIndex: 0, difficulty: randomDifficulty() },
        { question: t("quizVietnamese", "q2"), options: ["N", "M", "L"], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizVietnamese", "q3"), options: [t("quizVietnamese", "q3o1"), t("quizVietnamese", "q3o2"), t("quizVietnamese", "q3o3")], correctIndex: 2, difficulty: randomDifficulty() },
      ]
    },
        addition: {
      title: t("quizAddition", "title"),
      questions: additionQuestions,
    },
    subtraction: {
      title: t("quizSubtraction", "title"),
      questions: subtractionQuestions,
    },
    timesTable: {
      title: t("quizTimesTable", "title"),
      questions: timesTableQuestions,
    },
    grade2Vietnamese: {
      title: t("quizVietnameseGrade2", "title"),
      questions: grade2VietnamesePool,
    },
    grade2English: {
      title: t("quizEnglishGrade2", "title"),
      questions: grade2EnglishPool,
    },
    english: {
      title: t("quizEnglish", "title"),
      questions: [
        { question: t("quizEnglish", "q1"), options: [t("quizEnglish", "q1o1"), t("quizEnglish", "q1o2"), t("quizEnglish", "q1o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q2"), options: [t("quizEnglish", "q2o1"), t("quizEnglish", "q2o2"), t("quizEnglish", "q2o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q3"), options: [t("quizEnglish", "q3o1"), t("quizEnglish", "q3o2"), t("quizEnglish", "q3o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q4"), options: [t("quizEnglish", "q4o1"), t("quizEnglish", "q4o2"), t("quizEnglish", "q4o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q5"), options: [t("quizEnglish", "q5o1"), t("quizEnglish", "q5o2"), t("quizEnglish", "q5o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q6"), options: [t("quizEnglish", "q6o1"), t("quizEnglish", "q6o2"), t("quizEnglish", "q6o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q7"), options: [t("quizEnglish", "q7o1"), t("quizEnglish", "q7o2"), t("quizEnglish", "q7o3")], correctIndex: 2, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q8"), options: [t("quizEnglish", "q8o1"), t("quizEnglish", "q8o2"), t("quizEnglish", "q8o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q9"), options: [t("quizEnglish", "q9o1"), t("quizEnglish", "q9o2"), t("quizEnglish", "q9o3")], correctIndex: 1, difficulty: randomDifficulty() },
        { question: t("quizEnglish", "q10"), options: [t("quizEnglish", "q10o1"), t("quizEnglish", "q10o2"), t("quizEnglish", "q10o3")], correctIndex: 2, difficulty: randomDifficulty() },
      ]
    },
  }

  const preschoolCategories = [
    { id: "shapes", name: t("categories", "shapes"), icon: Shapes, color: "from-blue-400 to-cyan-400", bgColor: "bg-blue-100" },
    { id: "colors", name: t("categories", "colors"), icon: Palette, color: "from-pink-400 to-rose-400", bgColor: "bg-pink-100" },
    { id: "animals", name: t("categories", "animals"), icon: PawPrint, color: "from-amber-400 to-orange-400", bgColor: "bg-amber-100" },
  ]

  const grade1Categories = [
    { id: "math", name: t("categories", "math"), icon: Calculator, color: "from-green-400 to-emerald-400", bgColor: "bg-green-100" },
    { id: "vietnamese", name: t("categories", "vietnamese"), icon: BookOpen, color: "from-purple-400 to-violet-400", bgColor: "bg-purple-100" },
    { id: "english", name: t("categories", "english"), icon: Languages, color: "from-red-400 to-pink-400", bgColor: "bg-red-100" },
  ]

  const grade2Categories = [
    { id: "addition", name: t("categories", "addition"), icon: Plus, color: "from-blue-500 to-indigo-500", bgColor: "bg-blue-100" },
    { id: "subtraction", name: t("categories", "subtraction"), icon: Minus, color: "from-orange-400 to-red-500", bgColor: "bg-orange-100" },
    { id: "timesTable", name: t("categories", "timesTable"), icon: X, color: "from-violet-400 to-purple-500", bgColor: "bg-violet-100" },
  ]

  const tabs = [
    { id: "preschool" as const, name: t("dashboard", "preschool"), icon: Baby, categories: preschoolCategories },
    { id: "grade1" as const, name: t("dashboard", "grade1"), icon: GraduationCap, categories: grade1Categories },
    { id: "grade2" as const, name: t("dashboard", "grade2"), icon: BookCheck, categories: grade2Categories },
  ]

  const handleQuizCompleteInternal = (score: number, totalQuestions: number, difficulties: Difficulty[]) => {
    const coinsEarned = calculateSessionCoins(difficulties)

    fetch('/api/quiz/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: activeQuiz, score, totalQuestions, coinsEarned }),
    }).catch(() => {})

    setActiveQuiz(null)
    onQuizComplete(activeQuiz!, score, totalQuestions, coinsEarned)
  }

  const renderCategoryCard = (category: typeof preschoolCategories[0]) => {
    const Icon = category.icon
    return (
      <button
        key={category.id}
        onClick={() => setActiveQuiz(category.id)}
        className="group flex flex-col items-center gap-4 p-6 rounded-3xl shadow-xl border-2 border-transparent bg-card hover:border-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
        data-testid={`quiz-${category.id}`}
      >
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <span className="text-lg font-bold text-card-foreground">{category.name}</span>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm text-muted-foreground">{t("quiz", "earnCoins")}</span>
        </div>
      </button>
    )
  }

  const grade2VirtualCategories = [
    { id: "grade2Vietnamese", name: t("categories", "vietnamese"), icon: BookOpen, color: "from-purple-400 to-violet-400", bgColor: "bg-purple-100" },
    { id: "grade2English", name: t("categories", "english"), icon: Languages, color: "from-red-400 to-pink-400", bgColor: "bg-red-100" },
  ]

  const currentQuizData = activeQuiz ? quizData[activeQuiz as keyof typeof quizData] : null
  const allCategories = [...preschoolCategories, ...grade1Categories, ...grade2Categories, ...grade2VirtualCategories]
  const currentCategory = allCategories.find(c => c.id === activeQuiz)
  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="min-h-screen bg-background" data-testid="learning-zone">
      {/* Fireworks effect */}
      <Fireworks isActive={showFireworks} onComplete={onFireworksComplete} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b-2 border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-secondary transition-colors"
                data-testid="learning-back"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium text-sm hidden sm:inline">{t("common", "back")}</span>
              </button>
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{t("dashboard", "learningZone")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CoinDisplay />
              <LanguageSwitcher compact />
              <div className="hidden md:block">
                <ThemeSwitcher compact />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Mobile theme switcher */}
        <div className="md:hidden mb-6">
          <ThemeSwitcher />
        </div>

        {/* Learning Zone Section */}
        <section className="bg-card rounded-3xl shadow-2xl border-2 border-primary/10 overflow-hidden" data-testid="learning-content">
          {/* Tabs */}
          <div className="flex border-b-2 border-border" data-testid="learning-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-5 font-bold text-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-inner"
                      : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8" data-testid="tab-content">
            {activeTab === "grade2" ? (
              <Grade2SubjectView onSelectPractice={setActiveQuiz} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTabData?.categories.map(renderCategoryCard)}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Quiz Modal */}
      {currentQuizData && currentCategory && (
        <QuizModal
          isOpen={!!activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onComplete={handleQuizCompleteInternal}
          title={currentQuizData.title}
          questions={currentQuizData.questions}
          icon={<currentCategory.icon className="w-6 h-6 text-primary" />}
        />
      )}
    </div>
  )
}
