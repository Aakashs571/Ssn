import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import TaskCard from "../components/TaskCard";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import { getTaskForSkill } from "../data/tasks";
import { evaluateTask } from "../services/taskService";
import { useApp } from "../App";

export default function RealWorldTask() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, update } = useApp();
  const skillId = params.get("skill") || "react";
  const skill = state.skills?.find((s) => s.id === skillId) || { id: "react", name: "React", currentScore: 45, requiredScore: 80 };
  const task = getTaskForSkill(skillId);

  const [submission, setSubmission] = useState(task?.starterCode || "");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setEvaluating(true);
    const res = await evaluateTask(skillId, skill.currentScore, submission);
    const updatedSkills = (state.skills || []).map((s) =>
      s.id === skillId
        ? {
            ...s,
            currentScore: res.newScore,
            history: [...(s.history || []), { source: "task", score: res.newScore, date: new Date().toISOString() }],
          }
        : s
    );

    // Record activity in learning history timeline
    const newActivity = {
      id: `act_${Date.now()}`,
      type: "Practical Task",
      activityType: "practical_task",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: new Date().toISOString().split("T")[0],
      skill: skill.name,
      skillId,
      score: res.taskScore,
      note: `${task.title} evaluated (${res.taskScore}%)`,
      badge: "Practical Proof",
    };

    update({
      skills: updatedSkills,
      taskResults: [...(state.taskResults || []), res],
      activityTimeline: [newActivity, ...(state.activityTimeline || [])],
    });

    setResult(res);
    setEvaluating(false);
  };

  // Section 14: After evaluation display
  if (result) {
    return (
      <Layout>
        <BackButton to="/dashboard" label="Dashboard" />
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="p-6 text-center border-teal-300 shadow-sm">
            <div className="w-16 h-16 mx-auto bg-teal-100 text-teal-800 rounded-full flex items-center justify-center text-3xl mb-3">
              🎉
            </div>

            <p className="text-xs uppercase font-extrabold tracking-wider text-teal-700">
              Practical Task Evaluation Complete
            </p>
            <p className="font-display font-extrabold text-5xl text-ink-950 mt-1">
              Task Score: {result.taskScore}%
            </p>
            <p className="text-xs text-ink-500 mt-1">
              {result.evaluatedBy}
            </p>

            {/* Section 14: Skill Update 45% -> 61% */}
            <div className="my-6 p-4 rounded-xl bg-paper/80 border border-line text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-ink-700">
                  Skill Update: {skill.name}
                </span>
                <span className="text-xs font-bold text-teal-700">
                  +{result.newScore - result.oldScore}% Gain!
                </span>
              </div>

              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center">
                  <span className="text-[11px] text-ink-500 font-semibold block">Before</span>
                  <span className="font-display font-bold text-xl text-ink-600">
                    {result.oldScore}%
                  </span>
                </div>
                <span className="text-teal-600 font-bold text-2xl">→</span>
                <div className="text-center">
                  <span className="text-[11px] text-teal-800 font-semibold block">After</span>
                  <span className="font-display font-extrabold text-2xl text-teal-700">
                    {result.newScore}%
                  </span>
                </div>
              </div>

              <ProgressBar value={result.newScore} max={skill.requiredScore || 80} color="teal" showLabel={false} />
            </div>

            {/* Section 14: Strong vs Needs Improvement Breakdown */}
            <div className="grid sm:grid-cols-2 gap-4 text-left mb-6">
              {/* Strong */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <p className="text-xs font-bold uppercase text-emerald-900 mb-2 flex items-center gap-1.5">
                  <span>✓</span> Strong Concepts
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {result.strong?.map((st, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs font-bold bg-white text-emerald-800 border border-emerald-300"
                    >
                      {st}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  {result.strengths}
                </p>
              </div>

              {/* Needs Improvement */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <p className="text-xs font-bold uppercase text-amber-900 mb-2 flex items-center gap-1.5">
                  <span>⚠️</span> Needs Improvement
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {result.needsImprovement?.map((ni, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs font-bold bg-white text-amber-900 border border-amber-300"
                    >
                      {ni}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  {result.improvements}
                </p>
              </div>
            </div>

            {/* Call to action navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="accent"
                size="lg"
                onClick={() => navigate("/adaptive-roadmap")}
              >
                View Adaptive Roadmap →
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate("/adaptive-roadmap")}
              >
                View Adaptive Roadmap
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BackButton to={skillId ? `/quiz?skill=${skillId}` : "/roadmap"} label="Back to Quiz" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-950">
            Real-World Skill Proof
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            Build and submit practical solutions to establish verifiable skill evidence.
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        <TaskCard task={task} />

        {/* Section 14: Submission Interface */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-bold text-base text-ink-950">
                Code Submission Editor
              </h3>
              <p className="text-xs text-ink-500">
                Write or paste your implementation for automated code review
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmission(task.starterCode || "")}
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Reset Starter Code
            </button>
          </div>

          <textarea
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            rows={12}
            placeholder="Write your code solution here..."
            className="w-full border border-line rounded-xl px-4 py-3 text-xs sm:text-sm font-mono focus-ring bg-slate-900 text-teal-100"
          />

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-ink-500">
              Submitting updates your React score from {skill.currentScore}% towards target {skill.requiredScore}%.
            </span>
            <Button
              variant="accent"
              size="lg"
              disabled={!submission.trim() || evaluating}
              onClick={handleSubmit}
              className="font-bold shadow-xs"
            >
              {evaluating ? "Evaluating Solution with AI..." : "Submit Task for Evaluation →"}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
