"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { X, CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react"

interface Question {
  question: string
  options: string[]
  correctIndex: number
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  title: string
  questions: Question[]
  icon: React.ReactNode
}

export function QuizModal({ isOpen, onClose, onComplete, title, questions, icon }: QuizModalProps) {
  const { t } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  if (!isOpen) return null

  const question = questions[currentQuestion]

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return
    
    setSelectedAnswer(index)
    const correct = index === question.correctIndex
    setIsCorrect(correct)
    
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
    onComplete()
    // Reset state
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setIsFinished(false)
  }

  const handleClose = () => {
    onClose()
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setScore(0)
    setIsFinished(false)
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
          {isFinished ? (
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
