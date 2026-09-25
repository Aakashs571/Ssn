// Canonical formulas for SkillPath AI's adaptive loop.
// Every page (SkillGaps, Roadmap, Quiz, RealWorldTask, CareerReadiness,
// AdaptiveRoadmap, Dashboard) reads through these so a score updates
// consistently everywhere it's used.

export const clampScore = (n) => Math.max(0, Math.min(100, Math.round(n)));

export const getGap = (skill) => Math.max(0, skill.requiredScore - skill.currentScore);

// Assessment -> initial skill score.
// score = (sum of difficulty weight of correct answers) / (sum of all weights) * 100
export function scoreAssessment(questions, answers) {
  const bySkill = {};
  questions.forEach((q) => {
    const weight = q.difficulty;
    const isCorrect = answers[q.id] === q.correct;
    if (!bySkill[q.skillId]) bySkill[q.skillId] = { earned: 0, total: 0 };
    bySkill[q.skillId].total += weight;
    if (isCorrect) bySkill[q.skillId].earned += weight;
  });
  const result = {};
  Object.entries(bySkill).forEach(([skillId, { earned, total }]) => {
    result[skillId] = total > 0 ? clampScore((earned / total) * 100) : 0;
  });
  return result;
}

// Quiz result -> updated skill score.
// A quiz can move a skill by at most `sensitivity` of the distance to the new evidence.
const QUIZ_SENSITIVITY = 0.4;
export function applyQuizResult(oldScore, correctCount, totalCount) {
  const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : oldScore;
  const updated = oldScore + (accuracy - oldScore) * QUIZ_SENSITIVITY;
  return clampScore(updated);
}

// Real-world task evaluation -> updated skill score.
// Tasks are stronger evidence than quizzes, so they carry more weight.
const TASK_SENSITIVITY = 0.6;
export function applyTaskResult(oldScore, taskScorePercent) {
  const updated = oldScore + (taskScorePercent - oldScore) * TASK_SENSITIVITY;
  return clampScore(updated);
}

// Roadmap priority from the size of the gap.
export function getPriority(skill) {
  if (skill.currentScore >= skill.requiredScore) return "COMPLETED";
  const gap = getGap(skill);
  if (gap >= 40) return "HIGH";
  if (gap >= 15) return "MEDIUM";
  return "LOW";
}

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2, COMPLETED: 3 };

// Builds an ordered roadmap: completed skills first (as done), then the
// single highest-priority incomplete skill marked CURRENT, then the rest
// as UPCOMING, ordered by priority.
export function buildRoadmap(skills, topics = {}) {
  const enriched = skills.map((s) => ({
    ...s,
    priority: getPriority(s),
    gap: getGap(s),
  }));

  const completed = enriched.filter((s) => s.priority === "COMPLETED");
  const incomplete = enriched
    .filter((s) => s.priority !== "COMPLETED")
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.gap - a.gap);

  return [
    ...completed.map((s) => ({ ...s, status: "COMPLETED" })),
    ...incomplete.map((s, i) => ({ ...s, status: i === 0 ? "CURRENT" : "UPCOMING" })),
  ];
}

// Career readiness: weighted average of (achieved / required), capped at 100%
// per skill so over-performing on one skill can't mask a gap elsewhere.
export function calculateReadiness(skills) {
  if (!skills.length) return 0;
  const totalWeight = skills.length;
  const sum = skills.reduce((acc, s) => {
    const achieved = Math.min(s.currentScore, s.requiredScore) / s.requiredScore;
    return acc + achieved;
  }, 0);
  return clampScore((sum / totalWeight) * 100);
}

// "What If?" simulator: recompute readiness with one skill's score swapped.
export function simulateReadiness(skills, skillId, hypotheticalScore) {
  const modified = skills.map((s) => (s.id === skillId ? { ...s, currentScore: hypotheticalScore } : s));
  return calculateReadiness(modified);
}

export function updateSkillScore(skills, skillId, newScore) {
  return skills.map((s) =>
    s.id === skillId
      ? { ...s, currentScore: clampScore(newScore), history: [...(s.history || []), { source: "update", score: clampScore(newScore) }] }
      : s
  );
}
