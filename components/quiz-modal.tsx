"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { type Difficulty } from "@/lib/coin-rewards"
import { X, CheckCircle2, XCircle, ArrowRight, Trophy, Loader2, RefreshCw } from "lucide-react"

interface Question {
  question: string
  options: string[]
  correctIndex: number
  difficulty: Difficulty
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (score: number, totalQuestions: number, difficulties: Difficulty[]) => void
  title: string
  questions: Question[]
  icon: React.ReactNode
  /** Content-subject quizzes only: the question set is still loading. */
  isLoading?: boolean
  /** Content-subject quizzes only: the question fetch failed — show Retry. */
  loadError?: boolean
  /** Content-subject quizzes only: the subject has no active questions — Close only. */
  emptyError?: boolean
  onRetry?: () => void
}

export function QuizModal({
  isOpen,
  onClose,
  onComplete,
  title,
  questions,
  icon,
  isLoading = false,
  loadError = false,
  emptyError = false,
  onRetry,
}: QuizModalProps) {
  const { t, language } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [questionDifficulties, setQuestionDifficulties] = useState<Difficulty[]>([])

  if (!isOpen) return null

  const question = questions[currentQuestion]

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return

    setSelectedAnswer(index)
    const correct = index === question.correctIndex
    setIsCorrect(correct)
    setQuestionDifficulties(prev => [...prev, questions[currentQuestion].difficulty])

    if (correct) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    } else {
      setIsFinished(true)
    }
  }

  const handleFinish = () => {
    onComplete(score, questions.length, questionDifficulties)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setIsFinished(false)
    setQuestionDifficulties([])
  }

  const handleClose = () => {
    onClose()
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setIsFinished(false)
    setQuestionDifficulties([])
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" data-testid="quiz-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border-4 border-primary/20 overflow-hidden animate-scale-pop">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-primary/10 border-b-2 border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              {icon}
            </div>
            <h2 className="text-xl font-bold text-card-foreground" data-testid="quiz-title">{title}</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="quiz-close"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loadError ? (
            // Load error — offer Retry
            <div className="flex flex-col items-center gap-5 py-10 text-center" data-testid="quiz-error">
              <XCircle className="w-12 h-12 text-red-500" />
              <p className="text-lg font-semibold text-card-foreground">{t("quiz", "loadError")}</p>
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform"
                data-testid="quiz-retry-button"
              >
                <RefreshCw className="w-5 h-5" />
                {t("quiz", "retry")}
              </button>
            </div>
          ) : emptyError ? (
            // No questions for this subject yet — Close only
            <div className="flex flex-col items-center gap-5 py-10 text-center" data-testid="quiz-empty">
              <Trophy className="w-12 h-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-card-foreground">{t("quiz", "noQuestions")}</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-secondary transition-colors"
                data-testid="quiz-empty-close"
              >
                {t("common", "close")}
              </button>
            </div>
          ) : isLoading || !question ? (
            // Loading the question set
            <div className="flex flex-col items-center gap-4 py-12 text-center" data-testid="quiz-loading">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">{t("quiz", "loading")}</p>
            </div>
          ) : isFinished ? (
            // Results screen
            <div className="flex flex-col items-center gap-6 py-8" data-testid="quiz-results">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-yellow-800" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black text-card-foreground mb-2" data-testid="quiz-completed-text">
                  {t("quiz", "completed")}
                </h3>
                <p className="text-lg text-muted-foreground" data-testid="quiz-score">
                  {t("quiz", "score")} <span className="font-bold text-primary">{score}/{questions.length}</span> {t("quiz", "of")}
                </p>
              </div>
              <button
                onClick={handleFinish}
                className="px-8 py-4 bg-gradient-to-r from-primary to-highlight text-primary-foreground font-bold text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform"
                data-testid="quiz-claim-coins"
              >
                {t("quiz", "claimCoins")}
              </button>
            </div>
          ) : (
            // Question screen
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-highlight transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    data-testid="quiz-progress"
                  />
                </div>
                <span className="text-sm font-semibold text-muted-foreground" data-testid="quiz-progress-text">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>

              {/* Difficulty Badge */}
              {(() => {
                const badge = {
                  easy:   { label: language === "vi" ? "Dễ" : "Easy",   stars: "⭐",     style: "text-green-600 bg-green-50 border-green-200" },
                  medium: { label: language === "vi" ? "Vừa" : "Medium", stars: "⭐⭐",   style: "text-yellow-600 bg-yellow-50 border-yellow-200" },
                  hard:   { label: language === "vi" ? "Khó" : "Hard",   stars: "⭐⭐⭐", style: "text-red-600 bg-red-50 border-red-200" },
                }[question.difficulty]
                return (
                  <div className="flex justify-center mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${badge.style}`}
                      data-testid="quiz-difficulty-badge"
                    >
                      {badge.stars} {badge.label}
                    </span>
                  </div>
                )
              })()}

              {/* Question */}
              <h3 className="text-xl font-bold text-card-foreground mb-6 text-center" data-testid="quiz-question">
                {question.question}
              </h3>

              {/* Options */}
              <div className="grid gap-3" data-testid="quiz-options">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index
                  const isCorrectAnswer = index === question.correctIndex
                  const showResult = selectedAnswer !== null

                  let buttonStyle = "bg-secondary/50 border-secondary hover:bg-secondary"
                  if (showResult) {
                    if (isCorrectAnswer) {
                      buttonStyle = "bg-green-100 border-green-500 text-green-700"
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = "bg-red-100 border-red-500 text-red-700"
                    } else {
                      buttonStyle = "bg-muted/50 border-muted opacity-50"
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 font-semibold text-left transition-all duration-200 ${buttonStyle} ${!showResult && "hover:scale-[1.02]"}`}
                      data-testid={`quiz-option-${index}`}
                    >
                      <span>{option}</span>
                      {showResult && isCorrectAnswer && (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Feedback & Next */}
              {selectedAnswer !== null && (
                <div className="mt-6 flex flex-col items-center gap-4 animate-scale-pop" data-testid="quiz-feedback">
                  <div className={`text-lg font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`} data-testid="quiz-feedback-text">
                    {isCorrect ? t("quiz", "correct") : t("quiz", "incorrect")}
                  </div>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform"
                    data-testid="quiz-next-button"
                  >
                    {currentQuestion < questions.length - 1 ? t("quiz", "nextQuestion") : t("quiz", "viewResults")}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
