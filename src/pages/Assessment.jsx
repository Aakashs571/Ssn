import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import QuestionCard from "../components/QuestionCard";
import CodeReviewCard from "../components/CodeReviewCard";
import AssessmentTimer from "../components/AssessmentTimer";
import ProgressBar from "../components/ProgressBar";
import { fetchAssessment, submitAssessment } from "../services/assessmentService";
import { getCareerById } from "../data/careers";
import { useApp } from "../App";

export default function Assessment() {
  const { state, update, recordAttempt } = useApp();
  const navigate = useNavigate();

  const [rawQuestions, setRawQuestions] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'code_review' | 'mcq'
  const [questionSet, setQuestionSet] = useState("all"); // 'all' | 'set_alpha' | 'set_beta'
  const noRepeatActive = true; // Hidden no-repeat filter active in background, not visible to student
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeNotice, setTimeNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if student has completed a career course before unlocking assessment
  const hasCompletedCourse = Boolean(
    (state.courses && state.courses.some((c) => c.progress === 100 || c.status === "Completed" || c.certificate)) ||
    (state.externalCourses && state.externalCourses.length > 0) ||
    (state.topicsCompleted && state.topicsCompleted.length >= 1)
  );

  // Adaptive difficulty tracking (Sections 7 & 11)
  const [adaptiveFeedback, setAdaptiveFeedback] = useState("");
  const [currentPerformanceTier, setCurrentPerformanceTier] = useState("Intermediate");

  // Load questions for the selected career with dynamic question set and no-repeat support
  useEffect(() => {
    if (!state.selectedCareer || !hasCompletedCourse) return;
    fetchAssessment(state.selectedCareer, {
      excludeAttempted: noRepeatActive,
      questionSetId: questionSet,
    }).then((data) => {
      setRawQuestions(data);
      setIndex(0);
    });
  }, [state.selectedCareer, questionSet, noRepeatActive, hasCompletedCourse]);

  // Filter questions based on selected mode
  const questions = useMemo(() => {
    if (!rawQuestions) return [];
    if (filterMode === "code_review") {
      return rawQuestions.filter((q) => q.type === "code_review");
    }
    if (filterMode === "mcq") {
      return rawQuestions.filter((q) => q.type !== "code_review");
    }
    return rawQuestions;
  }, [rawQuestions, filterMode]);

  // Reset index if filter changes and index is out of bounds
  useEffect(() => {
    if (index >= questions.length && questions.length > 0) {
      setIndex(0);
    }
  }, [filterMode, questions.length, index]);

  const career = getCareerById(state.selectedCareer);

  if (!state.selectedCareer) {
    return (
      <Layout>
        <EmptyState
          title="Pick a career first"
          message="We need to know your target career before we can build a personalized assessment."
          action={<Button variant="accent" onClick={() => navigate("/careers")}>Choose a career</Button>}
        />
      </Layout>
    );
  }

  // Gatekeeper: Assessment unlocks ONLY when a career course is completed
  if (!hasCompletedCourse) {
    return (
      <Layout>
        <BackButton to="/roadmap" label="Roadmap" />
        <div className="max-w-xl mx-auto py-8">
          <Card className="text-center p-8 border-amber-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mb-4">
              🔒
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Prerequisite Locked
            </span>
            <h2 className="font-display font-black text-2xl text-ink-950 mt-3 mb-2">
              Career Assessment is Locked
            </h2>
            <p className="text-sm text-ink-600 leading-relaxed mb-6">
              To ensure baseline calibration accuracy, SkillPath AI requires completing at least one career course or verified learning topic module before unlocking this benchmark assessment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="accent" onClick={() => navigate("/roadmap")}>
                Start Roadmap Course →
              </Button>
              <Button variant="outline" onClick={() => navigate("/learning-history")}>
                Upload Course Certificate
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!rawQuestions) {
    return (
      <Layout>
        <Loading message={`Preparing dynamic ${career?.name || "career"} assessment questions...`} />
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <EmptyState
          title="No questions in this filter"
          message="Switch to 'All Questions' or disable No-Repeat filter to view available questions."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setFilterMode("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      </Layout>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const isCodeReview = q?.type === "code_review";
  const questionDuration = isCodeReview ? 65 : 45; // 65s for Code Review, 45s for standard MCQ

  // Check attempt status (Section 6)
  const isPreviouslyAttempted = state.attemptedQuestions?.includes(q?.id);
  const difficultyLabel =
    typeof q?.difficulty === "string"
      ? q.difficulty
      : q?.difficulty === 3
      ? "hard"
      : q?.difficulty === 2
      ? "medium"
      : "easy";

  const handleSelect = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
    recordAttempt(q.id);

    // Dynamic adaptive feedback (Section 7 & 11)
    const isCorrect = optionIndex === q.correct;
    if (isCorrect) {
      setCurrentPerformanceTier("Advanced");
      setAdaptiveFeedback("✓ Correct answer! Calibrating to higher difficulty challenge.");
    } else {
      setCurrentPerformanceTier("Developing");
      setAdaptiveFeedback("Insight: Reviewing prerequisite foundational concepts.");
    }
  };

  const handleFinish = async (latestAnswers = answers) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const scores = await submitAssessment(state.selectedCareer, latestAnswers);
      const updatedSkills = (career?.requiredSkills || []).map((rs) => ({
        id: rs.skillId,
        name: rs.name,
        category: rs.category,
        requiredScore: rs.requiredScore,
        currentScore: scores[rs.skillId] ?? 40,
        history: [{ source: "assessment", score: scores[rs.skillId] ?? 40 }],
      }));
      update({ skills: updatedSkills, assessmentAnswers: latestAnswers });
      setFinished(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Called when the countdown timer for the current question reaches 0
  const handleTimeUp = () => {
    setTimeNotice(`Time's up for Question ${index + 1}!`);
    setTimeout(() => setTimeNotice(null), 2000);

    if (isLast) {
      handleFinish(answers);
    } else {
      setIndex((i) => i + 1);
    }
  };

  // Completed State View
  if (finished) {
    const totalAnswered = Object.keys(answers).length;
    const correctCount = questions.filter((item) => answers[item.id] === item.correct).length;
    const prQuestions = questions.filter((item) => item.type === "code_review");
    const prCorrectCount = prQuestions.filter((item) => answers[item.id] === item.correct).length;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="text-center py-10 px-6 border-teal-200">
            <div className="w-16 h-16 mx-auto bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-2xl mb-4">
              🎉
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900">
              Assessment Completed!
            </h2>
            <p className="text-ink-600 mt-2 max-w-md mx-auto">
              We evaluated your skills for <span className="font-semibold text-ink-900">{career?.name}</span> across theoretical knowledge and code reviews.
            </p>

            {/* Score Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 max-w-lg mx-auto">
              <div className="p-3 rounded-xl bg-paper border border-line">
                <p className="text-xs text-ink-500 font-semibold uppercase">Total Score</p>
                <p className="font-display font-bold text-2xl text-teal-700 mt-1">
                  {correctCount} / {questions.length}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <p className="text-xs text-purple-700 font-semibold uppercase">Bugs Spotted</p>
                <p className="font-display font-bold text-2xl text-purple-800 mt-1">
                  {prCorrectCount} / {prQuestions.length}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-paper border border-line col-span-2 sm:col-span-1">
                <p className="text-xs text-ink-500 font-semibold uppercase">Answered</p>
                <p className="font-display font-bold text-2xl text-ink-800 mt-1">
                  {totalAnswered} / {questions.length}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Button variant="accent" size="lg" onClick={() => navigate("/skill-profile")}>
                View visual skill profile →
              </Button>
              <Button variant="outline" onClick={() => navigate("/skill-gaps")}>
                View skill gaps
              </Button>
              <Button variant="ghost" onClick={() => navigate("/adaptive-roadmap")}>
                Adaptive roadmap
              </Button>
            </div>
          </Card>

          {/* Pull Request Bug Review Breakdown */}
          {prQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-ink-900 flex items-center gap-2">
                <span>🔍</span> Code Review & Bug Hunt Explanations
              </h3>

              {prQuestions.map((item, idx) => {
                const isCorrect = answers[item.id] === item.correct;
                const wasAnswered = answers[item.id] !== undefined;

                return (
                  <Card key={item.id} className="p-4 border-line">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-paper border border-line font-bold text-ink-700">
                          {item.pr?.prNumber || `#PR-${idx + 1}`}
                        </span>
                        <h4 className="font-semibold text-ink-900 text-sm">
                          {item.pr?.title}
                        </h4>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                          !wasAnswered
                            ? "bg-amber-100 text-amber-800"
                            : isCorrect
                            ? "bg-teal-100 text-teal-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {!wasAnswered ? "Timed Out" : isCorrect ? "✓ Spotted Bug" : "✕ Missed Bug"}
                      </span>
                    </div>

                    <div className="mt-3 bg-teal-50/60 p-3 rounded-lg border border-teal-200/80 text-xs text-ink-800 leading-relaxed">
                      <span className="font-bold text-teal-800">Senior Dev Analysis: </span>
                      {item.explanation}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const mcqCount = rawQuestions.filter((item) => item.type !== "code_review").length;
  const prCount = rawQuestions.filter((item) => item.type === "code_review").length;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Assessment Header */}
        <BackButton to="/dashboard" label="Dashboard" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Career Diagnostic Assessment
              </span>
              <span className="text-xs px-2 py-0.5 bg-paper rounded border border-line text-ink-600 font-mono">
                {career?.name}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-ink-900 mt-1">
              Adaptive Skill Calibration
            </h1>
          </div>

          {/* Dynamic Question Set Selector */}
          <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
            <span className="text-ink-500 font-semibold">Bank:</span>
            <select
              value={questionSet}
              onChange={(e) => setQuestionSet(e.target.value)}
              className="rounded-lg border border-line bg-paper px-2 py-1 font-semibold text-ink-800 focus-ring"
            >
              <option value="all">Full Question Pool</option>
              <option value="set_alpha">Set Alpha (Core)</option>
              <option value="set_beta">Set Beta (Advanced)</option>
            </select>
          </div>
        </div>

        {/* Adaptive Assessment Info Bar (Sections 7 & 11) */}
        <div className="rounded-xl bg-gradient-to-r from-teal-50 to-amber-50/50 border border-teal-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-900">Current Level: {currentPerformanceTier}</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-teal-200 text-teal-900">
                Adaptive UI Active
              </span>
            </div>
            <p className="text-teal-800/80 mt-0.5">
              Questions adapt to your performance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-teal-800 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-teal-200">
              Calibrated for {career?.name}
            </span>
          </div>
        </div>

        {/* Question Type Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center bg-paper p-1 rounded-xl border border-line text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setFilterMode("all");
                setIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === "all" ? "bg-white text-ink-900 shadow-xs" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              All ({rawQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode("code_review");
                setIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                filterMode === "code_review"
                  ? "bg-purple-100 text-purple-900 shadow-xs font-bold"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <span>🔍</span> Spot the Bug ({prCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode("mcq");
                setIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === "mcq" ? "bg-white text-ink-900 shadow-xs" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              MCQs ({mcqCount})
            </button>
          </div>
        </div>

        {/* Progress & Question Metadata Bar (Sections 5 & 6) */}
        <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
          {/* Metadata Row: ID, Skill, Topic, Difficulty */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-paper border border-line text-ink-700">
                ID: {q.id}
              </span>
              <span className="font-bold text-teal-800">
                {q.skill || q.skillId?.toUpperCase()}
              </span>
              {q.topic && (
                <span className="text-ink-600 font-medium">
                  Topic: <strong className="text-ink-900">{q.topic}</strong>
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  difficultyLabel === "hard"
                    ? "bg-rose-100 text-rose-800"
                    : difficultyLabel === "medium"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                Difficulty: {difficultyLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isPreviouslyAttempted
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {isPreviouslyAttempted ? "Previously Seen" : "Fresh Question"}
              </span>

              {/* Per-Question Countdown Timer */}
              <AssessmentTimer
                key={q.id}
                duration={questionDuration}
                questionKey={q.id}
                isPaused={isPaused}
                onTogglePause={() => setIsPaused((p) => !p)}
                onTimeUp={handleTimeUp}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-ink-500 mb-1">
            <span>Question {index + 1} of {questions.length}</span>
            <span>{Math.round(((index + 1) / questions.length) * 100)}% Completed</span>
          </div>

          <ProgressBar value={index + 1} max={questions.length} showLabel={false} />

          {/* Adaptive Live Feedback */}
          {adaptiveFeedback && (
            <div className="mt-2 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
              <span>{adaptiveFeedback}</span>
              <span className="text-[11px] text-teal-600 font-mono">Dynamic Calibration</span>
            </div>
          )}

          {/* Time Expired Notice */}
          {timeNotice && (
            <div className="mt-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center justify-between animate-fadeIn">
              <span>⏱ {timeNotice}</span>
              <span className="text-[11px] text-rose-500">Auto-advancing to next question</span>
            </div>
          )}
        </div>

        {/* Current Question: Code Review OR Standard MCQ */}
        <Card className="border-line shadow-xs">
          {isCodeReview ? (
            <CodeReviewCard
              question={q}
              index={index}
              total={questions.length}
              selected={answers[q.id]}
              onSelect={handleSelect}
            />
          ) : (
            <QuestionCard
              question={q}
              index={index}
              total={questions.length}
              selected={answers[q.id]}
              onSelect={handleSelect}
            />
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-line">
            <Button
              variant="ghost"
              disabled={index === 0}
              onClick={() => {
                setAdaptiveFeedback("");
                setIndex((i) => Math.max(0, i - 1));
              }}
            >
              ← Previous
            </Button>

            <div className="flex items-center gap-2">
              {!isLast && answers[q.id] === undefined && (
                <button
                  type="button"
                  onClick={() => {
                    setAdaptiveFeedback("");
                    setIndex((i) => i + 1);
                  }}
                  className="text-xs text-ink-500 hover:text-ink-800 font-medium px-3 py-2"
                >
                  Skip for now →
                </button>
              )}

              {isLast ? (
                <Button
                  variant="accent"
                  disabled={submitting}
                  onClick={() => handleFinish(answers)}
                >
                  {submitting ? "Scoring Assessment..." : "Finish Assessment"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    setAdaptiveFeedback("");
                    setIndex((i) => i + 1);
                  }}
                >
                  Next Question →
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
