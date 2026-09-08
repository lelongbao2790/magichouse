"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Calculator, BookOpen, Languages, Plus, Minus, X, Star, ChevronLeft } from "lucide-react"

interface Grade2SubjectViewProps {
  onSelectPractice: (practiceId: string) => void
}

export function Grade2SubjectView({ onSelectPractice }: Grade2SubjectViewProps) {
  const { t } = useLanguage()
  const [selectedSubject, setSelectedSubject] = useState<'math' | null>(null)

  const subjectCards = [
    {
      id: 'math' as const,
      name: t("categories", "math"),
      icon: Calculator,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-100",
      testId: "grade2-subject-math",
    },
    {
      id: 'vietnamese' as const,
      name: t("categories", "vietnamese"),
      icon: BookOpen,
      color: "from-purple-400 to-violet-400",
      bgColor: "bg-purple-100",
      testId: "grade2-subject-vietnamese",
    },
    {
      id: 'english' as const,
      name: t("categories", "english"),
      icon: Languages,
      color: "from-red-400 to-pink-400",
      bgColor: "bg-red-100",
      testId: "grade2-subject-english",
    },
  ]

  const practiceCards = [
    {
      id: 'addition',
      name: t("categories", "addition"),
      icon: Plus,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-100",
      testId: "grade2-practice-addition",
    },
    {
      id: 'subtraction',
      name: t("categories", "subtraction"),
      icon: Minus,
      color: "from-orange-400 to-red-500",
      bgColor: "bg-orange-100",
      testId: "grade2-practice-subtraction",
    },
    {
      id: 'timesTable',
      name: t("categories", "timesTable"),
      icon: X,
      color: "from-violet-400 to-purple-500",
      bgColor: "bg-violet-100",
      testId: "grade2-practice-timesTable",
    },
  ]

  if (selectedSubject === 'math') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedSubject(null)}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-secondary transition-colors text-sm font-medium"
            data-testid="grade2-math-back"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("common", "back")}
          </button>
          <h3 className="text-lg font-bold text-card-foreground">{t("categories", "math")}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {practiceCards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                onClick={() => onSelectPractice(card.id)}
                className="group flex flex-col items-center gap-4 p-6 rounded-3xl shadow-xl border-2 border-transparent bg-card hover:border-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                data-testid={card.testId}
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <span className="text-lg font-bold text-card-foreground">{card.name}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-muted-foreground">{t("quiz", "earnCoins")}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjectCards.map((card) => {
        const Icon = card.icon
        const handleClick = () => {
          if (card.id === 'math') {
            setSelectedSubject('math')
          } else if (card.id === 'vietnamese') {
            onSelectPractice('grade2Vietnamese')
          } else {
            onSelectPractice('grade2English')
          }
        }
        return (
          <button
            key={card.id}
            onClick={handleClick}
            className="group flex flex-col items-center gap-4 p-6 rounded-3xl shadow-xl border-2 border-transparent bg-card hover:border-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
            data-testid={card.testId}
          >
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            <span className="text-lg font-bold text-card-foreground">{card.name}</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm text-muted-foreground">{t("quiz", "earnCoins")}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
