"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { CoinDisplay } from "./coin-display"
import { ThemeSwitcher } from "./theme-switcher"
import { LanguageSwitcher } from "./language-switcher"
import { QuizModal } from "./quiz-modal"
import { Fireworks } from "./fireworks"
import { 
  Shapes, Palette, PawPrint, Calculator, BookOpen, Languages,
  Baby, GraduationCap, ChevronLeft, Star, BookOpenCheck
} from "lucide-react"

interface LearningZoneProps {
  name: string
  onBack: () => void
  onQuizComplete: () => void
  showFireworks: boolean
  onFireworksComplete: () => void
}

type TabType = "preschool" | "grade1"

export function LearningZone({ name, onBack, onQuizComplete, showFireworks, onFireworksComplete }: LearningZoneProps) {
  const { t } = useLanguage()
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("preschool")

  // Quiz data with translations
  const quizData = {
    shapes: {
      title: t("quizShapes", "title"),
      questions: [
        { question: t("quizShapes", "q1"), options: [t("quizShapes", "q1o1"), t("quizShapes", "q1o2"), t("quizShapes", "q1o3")], correctIndex: 1 },
        { question: t("quizShapes", "q2"), options: [t("quizShapes", "q2o1"), t("quizShapes", "q2o2"), t("quizShapes", "q2o3")], correctIndex: 0 },
        { question: t("quizShapes", "q3"), options: [t("quizShapes", "q3o1"), t("quizShapes", "q3o2"), t("quizShapes", "q3o3")], correctIndex: 1 },
      ]
    },
    colors: {
      title: t("quizColors", "title"),
      questions: [
        { question: t("quizColors", "q1"), options: [t("quizColors", "q1o1"), t("quizColors", "q1o2"), t("quizColors", "q1o3")], correctIndex: 1 },
        { question: t("quizColors", "q2"), options: [t("quizColors", "q2o1"), t("quizColors", "q2o2"), t("quizColors", "q2o3")], correctIndex: 2 },
        { question: t("quizColors", "q3"), options: [t("quizColors", "q3o1"), t("quizColors", "q3o2"), t("quizColors", "q3o3")], correctIndex: 0 },
      ]
    },
    animals: {
      title: t("quizAnimals", "title"),
      questions: [
        { question: t("quizAnimals", "q1"), options: [t("quizAnimals", "q1o1"), t("quizAnimals", "q1o2"), t("quizAnimals", "q1o3")], correctIndex: 1 },
        { question: t("quizAnimals", "q2"), options: [t("quizAnimals", "q2o1"), t("quizAnimals", "q2o2"), t("quizAnimals", "q2o3")], correctIndex: 1 },
        { question: t("quizAnimals", "q3"), options: [t("quizAnimals", "q3o1"), t("quizAnimals", "q3o2"), t("quizAnimals", "q3o3")], correctIndex: 1 },
      ]
    },
    math: {
      title: t("quizMath", "title"),
      questions: [
        { question: t("quizMath", "q1"), options: ["1", "2", "3"], correctIndex: 1 },
        { question: t("quizMath", "q2"), options: ["2", "3", "4"], correctIndex: 1 },
        { question: t("quizMath", "q3"), options: ["4", "5", "6"], correctIndex: 1 },
      ]
    },
    vietnamese: {
      title: t("quizVietnamese", "title"),
      questions: [
        { question: t("quizVietnamese", "q1"), options: ["A", "B", "C"], correctIndex: 0 },
        { question: t("quizVietnamese", "q2"), options: ["N", "M", "L"], correctIndex: 1 },
        { question: t("quizVietnamese", "q3"), options: [t("quizVietnamese", "q3o1"), t("quizVietnamese", "q3o2"), t("quizVietnamese", "q3o3")], correctIndex: 2 },
      ]
    },
    english: {
      title: t("quizEnglish", "title"),
      questions: [
        { question: t("quizEnglish", "q1"), options: [t("quizEnglish", "q1o1"), t("quizEnglish", "q1o2"), t("quizEnglish", "q1o3")], correctIndex: 1 },
        { question: t("quizEnglish", "q2"), options: [t("quizEnglish", "q2o1"), t("quizEnglish", "q2o2"), t("quizEnglish", "q2o3")], correctIndex: 1 },
        { question: t("quizEnglish", "q3"), options: [t("quizEnglish", "q3o1"), t("quizEnglish", "q3o2"), t("quizEnglish", "q3o3")], correctIndex: 2 },
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

  const tabs = [
    { id: "preschool" as const, name: t("dashboard", "preschool"), icon: Baby, categories: preschoolCategories },
    { id: "grade1" as const, name: t("dashboard", "grade1"), icon: GraduationCap, categories: grade1Categories },
  ]

  const handleQuizCompleteInternal = () => {
    setActiveQuiz(null)
    onQuizComplete()
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

  const currentQuizData = activeQuiz ? quizData[activeQuiz as keyof typeof quizData] : null
  const allCategories = [...preschoolCategories, ...grade1Categories]
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTabData?.categories.map(renderCategoryCard)}
            </div>
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
