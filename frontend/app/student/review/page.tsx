"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
  BookOpen,
  Sparkles,
  Award,
  Check,
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { useSnackbar } from "@/providers/snackbar-provider";

interface ReviewOption {
  id: string;
  optionText: string;
  orderIndex: number;
}

interface ReviewQuestion {
  id: string;
  conceptId: string;
  conceptTitle: string;
  questionText: string;
  orderIndex: number;
  options: ReviewOption[];
}

interface DueReviewItem {
  id: string;
  userId: string;
  mcqQuestionId: string;
  intervalDays: number;
  correctStreak: number;
  dueDate: string;
  lastReviewedAt: string | null;
  question: ReviewQuestion;
}

interface AnswerResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  newIntervalDays: number;
  nextDueDate: string;
  xpAwarded: number;
}

export default function StudentReviewPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // Active Review State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<AnswerResult | null>(null);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isCompletedSession, setIsCompletedSession] = useState(false);

  // Fetch Due Review Items
  const {
    data: dueItems = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<DueReviewItem[]>({
    queryKey: ["review", "due"],
    queryFn: async () => {
      const res = await apiClient.get<DueReviewItem[]>("/review/due");
      return res.data;
    },
  });

  // Submit Answer Mutation
  const answerMutation = useMutation({
    mutationFn: async ({
      reviewItemId,
      optionId,
    }: {
      reviewItemId: string;
      optionId: string;
    }) => {
      const res = await apiClient.post<AnswerResult>(
        `/review/${reviewItemId}/answer`,
        {
          selectedOptionId: optionId,
        }
      );
      return res.data;
    },
    onSuccess: (result) => {
      setActiveResult(result);
      setReviewedCount((prev) => prev + 1);

      if (result.isCorrect) {
        setTotalXpEarned((prev) => prev + (result.xpAwarded || 2));
        showSuccess("+2 XP Earned! Review correct.");
      }

      // Invalidate gamification and review count so dashboard stays in sync
      queryClient.invalidateQueries({ queryKey: ["gamification", "me"] });
      queryClient.invalidateQueries({ queryKey: ["review", "due-count"] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showError(
        axiosErr.response?.data?.message ||
          "Failed to submit review answer. Please try again."
      );
    },
  });

  const currentItem = dueItems[currentIndex];
  const isAnswered = activeResult !== null;
  const isSubmitting = answerMutation.isPending;

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || !currentItem || isSubmitting || isAnswered) return;
    answerMutation.mutate({
      reviewItemId: currentItem.id,
      optionId: selectedOptionId,
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < dueItems.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setActiveResult(null);
    } else {
      // Finished all due items in the queue
      setIsCompletedSession(true);
      queryClient.invalidateQueries({ queryKey: ["review", "due"] });
    }
  };

  const handleRestartQueue = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setActiveResult(null);
    setIsCompletedSession(false);
    setReviewedCount(0);
    setTotalXpEarned(0);
    refetch();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-40 h-7 bg-border/60 rounded-lg" />
            <div className="w-64 h-4 bg-border/40 rounded" />
          </div>
          <div className="w-24 h-8 bg-border/50 rounded-xl" />
        </div>
        <div className="p-8 rounded-2xl bg-surface border border-border space-y-6">
          <div className="w-3/4 h-6 bg-border/60 rounded" />
          <div className="space-y-3 pt-2">
            <div className="w-full h-12 bg-border/40 rounded-xl" />
            <div className="w-full h-12 bg-border/40 rounded-xl" />
            <div className="w-full h-12 bg-border/40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-tint text-red flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold font-display text-text-primary">
          Unable to Load Reviews
        </h2>
        <p className="text-xs text-text-secondary">
          An error occurred while fetching your spaced repetition review queue.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 3. Completed Session Screen (after answering all items)
  if (isCompletedSession) {
    return (
      <div className="max-w-xl mx-auto py-12 sm:py-16 px-4">
        <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-green-tint text-green flex items-center justify-center mx-auto ring-8 ring-green-tint/50 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
              All Caught Up!
            </h2>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              You completed all {reviewedCount} review{reviewedCount !== 1 ? "s" : ""} scheduled for today. Great job keeping your memory sharp!
            </p>
          </div>

          {totalXpEarned > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-tint text-accent font-bold text-sm">
              <Zap className="w-4 h-4 fill-accent" />
              <span>+{totalXpEarned} Total XP Earned</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/student/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors shadow-sm text-center"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/student/roadmaps"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface border border-border text-text-primary font-semibold text-xs hover:bg-bg transition-colors text-center"
            >
              Explore Roadmaps
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Empty Queue State (no reviews due today)
  if (dueItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 sm:py-16 px-4">
        <div className="p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto">
            <RotateCcw className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-text-primary tracking-tight">
              Nothing Due for Review Today
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto">
              Check back tomorrow! Complete new concepts with quizzes to automatically grow your spaced repetition queue.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/student/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors shadow-sm text-center"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/student/roadmaps"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface border border-border text-text-primary font-semibold text-xs hover:bg-bg transition-colors text-center"
            >
              Study New Concepts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Active Review Queue Interface
  const progressPercent = Math.round(
    ((currentIndex + (isAnswered ? 1 : 0)) / dueItems.length) * 100
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header & Progress */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-text-primary tracking-tight">
                Daily Spaced Review
              </h1>
              <p className="text-xs text-text-secondary">
                Strengthen retention with adaptive interval repetition.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-accent-tint text-accent text-xs font-bold">
              Item {currentIndex + 1} of {dueItems.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Review Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-xs space-y-6 transition-all">
        {/* Concept Pill + Current Interval Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-bg border border-border text-[11px] font-semibold text-text-primary flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>{currentItem.question.conceptTitle}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-text-secondary" />
              <span>Interval: {currentItem.intervalDays}d</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber" />
              <span>Streak: {currentItem.correctStreak}</span>
            </span>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Question
          </p>
          <h2 className="text-base sm:text-lg font-bold text-text-primary leading-relaxed">
            {currentItem.question.questionText}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 pt-1">
          {currentItem.question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption =
              activeResult !== null && activeResult.correctOptionId === option.id;
            const isSelectedIncorrect =
              activeResult !== null &&
              !activeResult.isCorrect &&
              isSelected &&
              !isCorrectOption;

            let optionStyle =
              "border-border bg-bg text-text-primary hover:border-accent/50 hover:bg-surface";

            if (isAnswered) {
              if (isCorrectOption) {
                optionStyle =
                  "border-green bg-green-tint text-green font-semibold ring-1 ring-green";
              } else if (isSelectedIncorrect) {
                optionStyle =
                  "border-red/40 bg-red-tint/60 text-red font-medium opacity-90";
              } else {
                optionStyle = "border-border bg-bg opacity-50";
              }
            } else if (isSelected) {
              optionStyle =
                "border-accent bg-accent-tint text-accent font-semibold ring-1 ring-accent";
            }

            return (
              <label
                key={option.id}
                className={`flex items-center gap-3.5 p-4 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all ${optionStyle} ${
                  isAnswered ? "cursor-default pointer-events-none" : ""
                }`}
              >
                <input
                  type="radio"
                  name={`review-question-${currentItem.id}`}
                  value={option.id}
                  disabled={isAnswered}
                  checked={isSelected || isCorrectOption}
                  onChange={() => setSelectedOptionId(option.id)}
                  className="w-4 h-4 text-accent border-border focus:ring-accent accent-accent flex-shrink-0"
                />
                <span className="flex-1 leading-normal">{option.optionText}</span>
                {isAnswered && isCorrectOption && (
                  <Check className="w-4 h-4 text-green stroke-[3] flex-shrink-0" />
                )}
                {isAnswered && isSelectedIncorrect && (
                  <XCircle className="w-4 h-4 text-red flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>

        {/* Feedback Banner (Visible after submission) */}
        {isAnswered && activeResult && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 ${
              activeResult.isCorrect
                ? "bg-green-tint/50 border-green/30 text-green"
                : "bg-red-tint/50 border-red/30 text-red"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {activeResult.isCorrect ? (
                <div className="w-8 h-8 rounded-xl bg-green text-white flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-red text-white flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold">
                  {activeResult.isCorrect
                    ? "Correct! +2 XP Awarded"
                    : "Incorrect — Keep Practicing!"}
                </p>
                <p className="text-[11px] opacity-90">
                  {activeResult.isCorrect
                    ? `Next review scheduled in ${activeResult.newIntervalDays} day${
                        activeResult.newIntervalDays !== 1 ? "s" : ""
                      }.`
                    : "Interval reset to 1 day. Will reappear tomorrow."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors shadow-xs self-end sm:self-auto cursor-pointer"
            >
              <span>{currentIndex + 1 < dueItems.length ? "Next Item" : "Finish Review"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Action Footer (Before answering) */}
        {!isAnswered && (
          <div className="pt-2 flex items-center justify-end border-t border-border/60">
            <button
              type="button"
              disabled={!selectedOptionId || isSubmitting}
              onClick={handleSubmitAnswer}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
