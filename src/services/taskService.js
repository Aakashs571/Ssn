import { getTaskForSkill } from "../data/tasks";
import { applyTaskResult } from "../utils/skillCalculations";
import { mockDelay } from "./api";

// Mirrors POST /api/task/generate
export async function generateTask(skillId) {
  return mockDelay(getTaskForSkill(skillId));
}

// Mirrors POST /api/task/evaluate. In production this calls an LLM code reviewer / AST analyzer;
// here it returns structured AI feedback matching Section 14 specification.
export async function evaluateTask(skillId, oldScore, submissionText) {
  const current = Number(oldScore) || 45;
  const taskScore = 78; // Exact Section 14 sample score
  const newScore = Math.max(current + 16, applyTaskResult(current, taskScore)); // e.g. 45% -> 61%

  return mockDelay({
    skillId,
    taskScore,
    oldScore: current,
    newScore,
    strong: ["Components", "State"],
    needsImprovement: ["Validation"],
    strengths: "Clean functional component decomposition and reliable useState synchronization.",
    improvements: "Validation logic lacks edge-case coverage for invalid characters and whitespace trimming.",
    evaluatedBy: "SkillPath AI Grader v2.4 (AST & Logic Evaluator)",
    completedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  });
}
