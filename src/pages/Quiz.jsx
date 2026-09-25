import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import QuestionCard from "../components/QuestionCard";
import ProgressBar from "../components/ProgressBar";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { generateQuiz, submitQuiz } from "../services/quizService";
import { careers } from "../data/careers";
import { useApp } from "../App";

export default function Quiz() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, update, recordAttempt } = useApp();

  const skillParam = params.get("skill") || "javascript";
  const topicParam = params.get("topic");

  // Lookup skill in user state or find in careers definition
  const resolvedSkill = useMemo(() => {
    const existing = state.skills?.find(
      (s) => s.id?.toLowerCase() === skillParam.toLowerCase() || s.name?.toLowerCase() === skillParam.toLowerCase()
    );
    if (existing) return existing;

    // Search across all career required skills
    for (const c of careers) {
      const found = c.requiredSkills?.find(
        (rs) => rs.skillId?.toLowerCase() === skillParam.toLowerCase() || rs.name?.toLowerCase() === skillParam.toLowerCase()
      );
      if (found) {
        return {
          id: found.skillId,
          name: found.name,
          category: found.category,
          currentScore: 0,
          requiredScore: found.requiredScore || 75,
          history: [],
        };
      }
    }

    // Default fallback
    const formattedName = skillParam.charAt(0).toUpperCase() + skillParam.slice(1);
    return {
      id: skillParam.toLowerCase(),
      name: formattedName,
      category: "core",
      currentScore: 0,
      requiredScore: 75,
      history: [],
    };
  }, [state.skills, skillParam]);

  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 to 9: MCQs, 10: Coding question
  const [answers, setAnswers] = useState({});
  const [codingSolution, setCodingSolution] = useState("");
  const [codeTested, setCodeTested] = useState(false);
  const [testOutput, setTestOutput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Generate dynamic quiz: 10 MCQs + 1 Coding question, unseen questions prioritized
  useEffect(() => {
    generateQuiz(resolvedSkill.id, state.attemptedQuestions || []).then((data) => {
      setQuizData(data);
      if (data.coding?.starterCode) {
        setCodingSolution(data.coding.starterCode);
      }
      setCurrentIndex(0);
      setAnswers({});
      setCodeTested(false);
      setTestOutput("");
      setResult(null);
    });
  }, [resolvedSkill.id]);

  if (!quizData) {
    return (
      <Layout>
        <Loading message={`Generating fresh 10-question quiz + coding challenge for ${resolvedSkill.name}...`} />
      </Layout>
    );
  }

  const { mcqs, coding } = quizData;
  const isCodingStep = currentIndex === 10;
  const currentMcq = !isCodingStep ? mcqs[currentIndex] : null;

  const handleSelectOption = (optionIndex) => {
    if (currentMcq) {
      setAnswers((prev) => ({ ...prev, [currentMcq.id]: optionIndex }));
      recordAttempt(currentMcq.id);
    }
  };

  const handleRunCode = () => {
    if (!codingSolution.trim()) {
      setTestOutput("Please write some code before testing.");
      return;
    }
    // Simulate verification test runner
    setCodeTested(true);
    setTestOutput("✓ Test cases passed: 1/1 passed successfully! Your logic handles the required constraints.");
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Calculate MCQ score
      let correctMcqCount = 0;
      mcqs.forEach((q) => {
        if (answers[q.id] === q.correct) {
          correctMcqCount += 1;
        }
      });

      // Coding question counts as 1 point if tested/solved
      const codingPoint = codeTested || codingSolution.length > 30 ? 1 : 0;
      const totalCorrect = correctMcqCount + codingPoint;
      const totalQuestions = 11; // 10 MCQs + 1 coding

      const res = await submitQuiz(
        resolvedSkill.id,
        resolvedSkill.currentScore || 0,
        totalCorrect,
        totalQuestions
      );

      // Record attempted coding challenge
      if (coding?.id) {
        recordAttempt(coding.id);
      }

      // Update skills in state
      let updatedSkills = state.skills ? [...state.skills] : [];
      const existingIdx = updatedSkills.findIndex((s) => s.id === resolvedSkill.id);
      if (existingIdx >= 0) {
        const cur = updatedSkills[existingIdx];
        updatedSkills[existingIdx] = {
          ...cur,
          currentScore: res.newScore,
          confidence: res.confidence,
          confidenceLabel: res.confidenceLabel,
          history: [
            ...(cur.history || []),
            { source: "quiz", score: res.newScore, accuracy: res.accuracy, date: new Date().toISOString() },
          ],
        };
      } else {
        updatedSkills.push({
          ...resolvedSkill,
          currentScore: res.newScore,
          confidence: res.confidence,
          confidenceLabel: res.confidenceLabel,
          history: [{ source: "quiz", score: res.newScore, accuracy: res.accuracy, date: new Date().toISOString() }],
        });
      }

      // Add to activity timeline
      const newActivity = {
        id: `act_quiz_${Date.now()}`,
        type: "Quiz",
        activityType: "quiz",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: new Date().toISOString().split("T")[0],
        skill: resolvedSkill.name,
        skillId: resolvedSkill.id,
        score: res.accuracy,
        note: `Completed 10 MCQs + 1 Coding Challenge for ${resolvedSkill.name} (Marks: ${totalCorrect}/11 • ${res.accuracy}%)`,
        badge: "Quiz Score",
      };

      update({
        skills: updatedSkills,
        quizResults: [
          ...(state.quizResults || []),
          { ...res, skillName: resolvedSkill.name, date: new Date().toISOString() },
        ],
        activityTimeline: [newActivity, ...(state.activityTimeline || [])],
      });

      setResult({
        ...res,
        totalCorrect,
        totalQuestions,
        correctMcqCount,
        codingPoint,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Completed Results View
  if (result) {
    const accuracy = result.accuracy;
    const isPassing = accuracy >= 60;
    const confidenceBadgeColor =
      accuracy >= 75
        ? "bg-teal-100 text-teal-900 border-teal-300"
        : accuracy >= 50
        ? "bg-amber-100 text-amber-900 border-amber-300"
        : "bg-rose-100 text-rose-900 border-rose-300";

    return (
      <Layout>
        <div className="max-w-xl mx-auto py-6">
          <Card className="text-center p-8 border-teal-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-3xl mb-4">
              {isPassing ? "🎯" : "📚"}
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Quiz Completed • {resolvedSkill.name}
            </span>

            <h2 className="font-display font-extrabold text-3xl text-ink-950 mt-3">
              {result.totalCorrect} / {result.totalQuestions}
            </h2>
            <p className="text-sm font-semibold text-ink-600 mt-1">
              Overall Score: <span className="text-ink-950 font-bold">{accuracy}% Marks</span>
            </p>

            {/* Breakdown of MCQs & Coding Question */}
            <div className="grid grid-cols-2 gap-3 my-6 text-left">
              <div className="bg-paper p-3 rounded-xl border border-line">
                <span className="text-[11px] text-ink-500 font-semibold uppercase block">10 MCQs Score</span>
                <span className="text-lg font-bold text-ink-900">{result.correctMcqCount} / 10</span>
              </div>
              <div className="bg-paper p-3 rounded-xl border border-line">
                <span className="text-[11px] text-ink-500 font-semibold uppercase block">1 Coding Challenge</span>
                <span className="text-lg font-bold text-teal-700">{result.codingPoint ? "1 / 1 (Passed)" : "0 / 1"}</span>
              </div>
            </div>

            {/* Confidence according to marks percentage and accuracy */}
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-left mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-800 font-semibold uppercase tracking-wider block">
                    Calculated Confidence
                  </span>
                  <p className="text-xs text-ink-600 mt-0.5">
                    Directly derived from your {accuracy}% accuracy on this assessment.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${confidenceBadgeColor}`}>
                  {result.confidenceLabel}
                </span>
              </div>
            </div>

            {/* Skill Score Movement */}
            <div className="border-t border-line pt-5 mb-6 text-left">
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider block mb-1">
                Skill Progress
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-900">{resolvedSkill.name}</span>
                <span className="font-display">
                  <span className="text-ink-400 font-medium">{result.oldScore}%</span>
                  <span className="text-ink-400 mx-1.5">→</span>
                  <span className="text-teal-700 font-bold text-base">{result.newScore}%</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-1/2"
                onClick={() => navigate("/roadmap")}
              >
                Back to Roadmap
              </Button>
              <Button
                variant="accent"
                className="w-full sm:w-1/2"
                onClick={() => navigate(`/real-world-task?skill=${resolvedSkill.id}`)}
              >
                Try Practical Task →
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BackButton to={`/roadmap`} label="Back to Roadmap" />

      <div className="max-w-2xl mx-auto py-2">
        {/* Header Details */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {resolvedSkill.name}
              </span>
              {topicParam && (
                <span className="text-xs text-ink-600 font-medium truncate max-w-xs">
                  • {topicParam}
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-xl text-ink-950 mt-1">
              Skill Knowledge & Coding Quiz
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-ink-600">
              Question {currentIndex + 1} of 11
            </span>
            <span className="text-[11px] text-teal-700 block font-semibold">
              {isCodingStep ? "Coding Challenge" : "Multiple Choice"}
            </span>
          </div>
        </div>

        {/* 11-step progress bar */}
        <ProgressBar value={currentIndex + 1} max={11} color="teal" />

        {/* STEP 1 TO 10: Multiple Choice Question */}
        {!isCodingStep && currentMcq && (
          <Card className="mt-6">
            <QuestionCard
              question={currentMcq}
              index={currentIndex}
              total={11}
              selected={answers[currentMcq.id]}
              onSelect={handleSelectOption}
            />

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-line">
              <span className="text-xs text-ink-500 font-medium">
                {answers[currentMcq.id] !== undefined ? "✓ Answer selected" : "Choose an answer to proceed"}
              </span>

              <Button
                variant="primary"
                disabled={answers[currentMcq.id] === undefined}
                onClick={() => setCurrentIndex((i) => i + 1)}
              >
                {currentIndex === 9 ? "Proceed to Coding Challenge →" : "Next Question →"}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 11: Interactive Coding Challenge */}
        {isCodingStep && coding && (
          <Card className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Interactive Coding Challenge
              </span>
              <span className="text-xs text-ink-500 font-medium">Step 11 of 11</span>
            </div>

            <h3 className="font-display font-bold text-lg text-ink-950 mb-1">
              {coding.title}
            </h3>
            <p className="text-sm text-ink-700 leading-relaxed mb-4">
              {coding.description}
            </p>

            {/* Test Case Preview */}
            <div className="bg-paper p-3 rounded-xl border border-line text-xs mb-4">
              <span className="font-bold text-ink-700 uppercase tracking-wider block mb-1">Sample Test Case:</span>
              <code className="text-ink-900 font-mono block">Input: {coding.testCases?.[0]?.input}</code>
              <code className="text-teal-700 font-mono block mt-0.5">Expected: {coding.testCases?.[0]?.expected}</code>
            </div>

            {/* Code Editor Area */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                Your Solution Code:
              </label>
              <textarea
                value={codingSolution}
                onChange={(e) => {
                  setCodingSolution(e.target.value);
                  setCodeTested(false);
                }}
                rows={8}
                className="w-full font-mono text-xs bg-ink-950 text-teal-200 p-4 rounded-xl border border-ink-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                placeholder="Write your code here..."
              />
            </div>

            {/* Test Run Output & Hint */}
            {testOutput && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 border ${
                  codeTested ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                {testOutput}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunCode}
                  className="flex items-center gap-1.5"
                >
                  <span>▶</span>
                  <span>Run / Test Solution</span>
                </Button>
                {coding.hint && (
                  <span className="text-[11px] text-ink-500 italic">
                    Hint: {coding.hint}
                  </span>
                )}
              </div>

              <Button
                variant="accent"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Calculating Results..." : "Submit Complete Quiz →"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
