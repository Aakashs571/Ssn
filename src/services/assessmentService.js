import { assessmentQuestions, questionBank } from "../data/assessmentQuestions";
import { scoreAssessment } from "../utils/skillCalculations";
import { mockDelay } from "./api";

const ATTEMPTS_STORAGE_KEY = "skillpath_question_attempts";

export function getLocalAttemptHistory() {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordLocalAttempt(questionId, isCorrect, skillId, difficulty) {
  try {
    const history = getLocalAttemptHistory();
    const entry = {
      questionId,
      isCorrect,
      skillId,
      difficulty,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...history.filter((h) => h.questionId !== questionId)];
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearLocalAttemptHistory() {
  try {
    localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
  } catch {}
}

// Fetch questions supporting no-repeat filtering and question sets
export async function fetchAssessment(careerId, options = {}) {
  const { excludeAttempted = false, questionSetId = "all" } = options;
  let questions = assessmentQuestions[careerId] || questionBank;

  const history = getLocalAttemptHistory();
  const attemptedIds = new Set(history.map((h) => h.questionId));

  if (excludeAttempted && attemptedIds.size > 0) {
    const unattempted = questions.filter((q) => !attemptedIds.has(q.id));
    // If all questions were attempted, reset or return fresh pool
    if (unattempted.length >= 4) {
      questions = unattempted;
    }
  }

  // Question set segregation demo
  if (questionSetId === "set_alpha") {
    questions = questions.filter((_, idx) => idx % 2 === 0);
  } else if (questionSetId === "set_beta") {
    questions = questions.filter((_, idx) => idx % 2 === 1);
  }

  return mockDelay(questions);
}

// Adaptive Testing: Evaluates the last answer and chooses the next question's difficulty and topic
export async function getAdaptiveNextQuestion(currentQuestion, isCorrect, attemptedIds = []) {
  const currentDiff = currentQuestion?.difficulty || "medium";
  const skillId = currentQuestion?.skillId;

  let targetDifficulty = "medium";
  if (isCorrect) {
    targetDifficulty = currentDiff === "easy" ? "medium" : "hard";
  } else {
    targetDifficulty = currentDiff === "hard" ? "medium" : "easy";
  }

  // Find candidate questions matching the target difficulty
  let candidates = questionBank.filter(
    (q) =>
      q.id !== currentQuestion?.id &&
      !attemptedIds.includes(q.id) &&
      (skillId ? q.skillId === skillId || q.difficulty === targetDifficulty : true)
  );

  if (candidates.length === 0) {
    candidates = questionBank.filter((q) => q.id !== currentQuestion?.id && !attemptedIds.includes(q.id));
  }

  const selected = candidates[0] || questionBank[0];

  return mockDelay({
    nextQuestion: selected,
    previousDifficulty: currentDiff,
    newDifficulty: targetDifficulty,
    adaptationReason: isCorrect
      ? `Promoted to ${targetDifficulty.toUpperCase()} after correct answer.`
      : `Stepped down to ${targetDifficulty.toUpperCase()} to calibrate prerequisite foundations.`,
  });
}

// Submit answers and score
export async function submitAssessment(careerId, answers) {
  const questions = assessmentQuestions[careerId] || questionBank;
  const scores = scoreAssessment(questions, answers);

  // Record attempts for answered questions
  questions.forEach((q) => {
    if (answers[q.id] !== undefined) {
      const isCorrect = answers[q.id] === q.correct;
      recordLocalAttempt(q.id, isCorrect, q.skillId, q.difficulty);
    }
  });

  return mockDelay(scores);
}
