"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { type Language } from "@/data/translations"
import { type Difficulty, randomDifficulty, calculateSessionCoins } from "@/lib/coin-rewards"
import { useSubjectQuestions } from "@/lib/hooks/use-subject-questions"
import { pickSessionQuestions } from "@/lib/quiz-session"
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

// Quiz categories whose questions live in the database (fetched via useSubjectQuestions).
// The remaining practices (math, addition, subtraction, timesTable) are generated in-code.
const CONTENT_SUBJECT_KEYS = [
  "shapes", "colors", "animals", "vietnamese", "english",
  "grade2Vietnamese", "grade2English",
] as const

function isContentSubject(id: string | null): boolean {
  return id != null && (CONTENT_SUBJECT_KEYS as readonly string[]).includes(id)
}

export function LearningZone({ name, onBack, onQuizComplete, showFireworks, onFireworksComplete }: LearningZoneProps) {
  const { t, language } = useLanguage()
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("preschool")
  const mathQuestions = useMemo(() => Array.from({ length: 5 }, generateMathQuestion), [])
  const additionQuestions = useMemo(() => Array.from({ length: 10 }, generateAdditionQuestion), [])
  const subtractionQuestions = useMemo(() => Array.from({ length: 10 }, generateSubtractionQuestion), [])
  const timesTableQuestions = useMemo(() => Array.from({ length: 10 }, () => generateTimesTableQuestion(language)), [language])

  // DB-backed content subjects.
  const activeIsContent = isContentSubject(activeQuiz)
  const content = useSubjectQuestions(activeIsContent ? activeQuiz : null)

  // The 10-question session is FROZEN the first time content loads for a given quiz.
  // Later hook activity (e.g. a re-fetch triggered by a UI-language toggle re-keying the
  // cache) never re-picks the questions — only the modal chrome re-localizes.
  const [session, setSession] = useState<{ key: string | null; questions: typeof mathQuestions }>({
    key: null,
    questions: [],
  })
  useEffect(() => {
    if (!activeIsContent) {
      setSession((prev) => (prev.key === null ? prev : { key: null, questions: [] }))
      return
    }
    if (content.phase === "ready" && content.data) {
      const data = content.data
      setSession((prev) =>
        prev.key === activeQuiz
          ? prev
          : {
              key: activeQuiz,
              questions: pickSessionQuestions(
                data.questions,
                data.questionsPerSession,
              ) as typeof mathQuestions,
            },
      )
    } else {
      // still loading / errored for a NEW quiz — drop any stale frozen session
      setSession((prev) => (prev.key === activeQuiz ? prev : { key: null, questions: [] }))
    }
  }, [activeIsContent, activeQuiz, content.phase, content.data])

  const sessionQuestions = session.key === activeQuiz ? session.questions : []
  const hasFrozenSession = sessionQuestions.length > 0

  // Quiz data for the in-code generated math practices. Content subjects
  // (shapes/colors/animals/vietnamese/english/grade2*) come from `content` above.
  const generatedQuizData: Record<string, { title: string; questions: typeof mathQuestions }> = {
    math: { title: t("quizMath", "title"), questions: mathQuestions },
    addition: { title: t("quizAddition", "title"), questions: additionQuestions },
    subtraction: { title: t("quizSubtraction", "title"), questions: subtractionQuestions },
    timesTable: { title: t("quizTimesTable", "title"), questions: timesTableQuestions },
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

  const generated = activeQuiz ? generatedQuizData[activeQuiz] : undefined
  const currentTitle = activeIsContent ? (content.data?.title ?? "") : (generated?.title ?? "")
  const currentQuestions = activeIsContent ? sessionQuestions : (generated?.questions ?? [])
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
      {activeQuiz && currentCategory && (activeIsContent || generated) && (
        <QuizModal
          isOpen={!!activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onComplete={handleQuizCompleteInternal}
          title={currentTitle}
          questions={currentQuestions}
          icon={<currentCategory.icon className="w-6 h-6 text-primary" />}
          isLoading={activeIsContent && content.isLoading && !hasFrozenSession}
          loadError={activeIsContent && content.error === "load" && !hasFrozenSession}
          emptyError={activeIsContent && content.error === "empty" && !hasFrozenSession}
          onRetry={content.retry}
        />
      )}
    </div>
  )
}
