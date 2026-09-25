import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import EmptyState from "../components/EmptyState";
import { getTopicBySkill } from "../data/learningContent";
import { useApp } from "../App";

function ResourceLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block group px-3.5 py-2.5 rounded-lg border border-line bg-paper hover:border-teal-400 hover:bg-teal-50/50 transition-all text-sm text-ink-800 font-medium"
    >
      {children}
    </a>
  );
}

export default function Learning() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, completeTopicLearning } = useApp();
  const skillId = params.get("skill");
  const topic = getTopicBySkill(skillId);
  const skill = state.skills?.find((s) => s.id === skillId);

  // Skill gap calculation: gap determines adapted references and videos
  const currentScore = skill?.currentScore ?? 0;
  const targetScore = skill?.requiredScore ?? 75;
  const skillGap = Math.max(0, targetScore - currentScore);

  // Determine gap tier: large gap (>= 40), medium gap (15-39), low gap (< 15)
  const gapTier = skillGap >= 40 ? "high" : skillGap >= 15 ? "medium" : "low";

  // Dynamic references and videos changing according to the skill gap
  const adaptedResources = useMemo(() => {
    if (!topic?.resources) return null;

    const baseWeb = topic.resources.websites || [];
    const baseVideos = topic.resources.youtube || [];

    if (gapTier === "high") {
      return {
        tierName: "Foundational & Visual Concepts",
        tierBadge: "bg-amber-100 text-amber-900 border-amber-300",
        guidance: "Since you have a significant skill gap, start with visual diagrams and basic syntax fundamentals before attempting complex architectures.",
        websites: [
          { title: `${topic.title} – Beginner Visual Guide`, url: baseWeb[0]?.url || "https://developer.mozilla.org", description: "Step-by-step beginner breakdown with interactive visual diagrams." },
          { title: "Syntax Cheat Sheet & Interactive Sandbox", url: "https://javascript.info", description: "Quick reference card of all essential keywords, functions, and common patterns." },
          ...(baseWeb.slice(1, 2)),
        ],
        youtube: [
          { title: `${skill?.name || "Foundations"} Explained for Absolute Beginners`, channel: "FreeCodeCamp", url: baseVideos[0]?.url || "https://youtube.com", duration: "15 min" },
          { title: "Visual Walkthrough & Live Coding Sandbox", channel: "Web Dev Simplified", url: baseVideos[1]?.url || "https://youtube.com", duration: "20 min" },
        ],
      };
    } else if (gapTier === "medium") {
      return {
        tierName: "Core Architecture & Design Patterns",
        tierBadge: "bg-teal-100 text-teal-900 border-teal-300",
        guidance: "Your foundation is established. Focus on component lifecycle, error handling boundaries, and real-world implementation patterns.",
        websites: [
          ...(baseWeb.slice(0, 2)),
          { title: "Architectural Best Practices & Style Guide", url: "https://github.com/goldbergyoni/nodebestpractices", description: "Proven engineering patterns and production-ready conventions." },
        ],
        youtube: [
          ...(baseVideos.slice(0, 2)),
        ],
      };
    } else {
      return {
        tierName: "Advanced Optimization & Production Mastery",
        tierBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
        guidance: "You have nearly closed this skill gap. Master performance profiling, memory leak detection, and high-throughput production edge cases.",
        websites: [
          { title: "Performance Profiling & Memory Optimization", url: "https://web.dev", description: "Advanced techniques for reducing bundle size, render lag, and CPU overhead." },
          ...(baseWeb.slice(0, 2)),
        ],
        youtube: [
          { title: "Senior Engineering Code Review & Edge Cases", channel: "Jack Herrington", url: baseVideos[0]?.url || "https://youtube.com", duration: "35 min" },
          ...(baseVideos.slice(1, 2)),
        ],
      };
    }
  }, [topic, gapTier, skill?.name]);

  if (!topic) {
    return (
      <Layout>
        <BackButton to="/roadmap" label="Roadmap" />
        <EmptyState
          title="No lesson selected"
          message="Open a topic from your roadmap to start learning."
          action={<Button variant="accent" onClick={() => navigate("/roadmap")}>Go to roadmap</Button>}
        />
      </Layout>
    );
  }

  const handleStartQuiz = () => {
    // Record topic completion in state, unlocking the Career Assessment
    completeTopicLearning(skillId, topic.title);
    navigate(`/quiz?skill=${skillId}&topic=${encodeURIComponent(topic.title)}`);
  };

  return (
    <Layout>
      <BackButton to="/roadmap" label="Roadmap" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
          {skill?.name || topic.skillId}
        </p>

        {/* Dynamic Skill Gap Indicator */}
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-paper border border-line text-ink-700">
          Current Score: {currentScore}% • Target: {targetScore}% • {skillGap}% Gap
        </span>
      </div>

      <h1 className="font-display font-extrabold text-2xl text-ink-900 mb-6">
        {topic.title}
      </h1>

      <div className="max-w-3xl space-y-6">
        {/* Main Content Card */}
        <Card>
          <p className="text-ink-700 leading-relaxed text-sm sm:text-base">
            {topic.explanation}
          </p>

          <h3 className="font-display font-bold text-ink-900 mt-6 mb-2">
            Learning Objectives
          </h3>
          <ul className="space-y-1.5">
            {topic.objectives.map((o, i) => (
              <li key={i} className="text-sm text-ink-600 flex gap-2">
                <span className="text-teal-500 font-bold">•</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>

          <h3 className="font-display font-bold text-ink-900 mt-6 mb-2">
            Code Example
          </h3>
          <pre className="bg-ink-950 text-teal-100 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">
            <code>{topic.example}</code>
          </pre>

          <h3 className="font-display font-bold text-ink-900 mt-6 mb-2">
            Practice Activity
          </h3>
          <p className="text-sm text-ink-600 leading-relaxed bg-paper/60 p-3 rounded-xl border border-line">
            {topic.practice}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-line">
            <div>
              <span className="text-xs font-bold text-ink-800 block">
                Ready to test what you learned?
              </span>
              <span className="text-[11px] text-ink-500">
                Completing this quiz updates your score and unlocks the benchmark assessment.
              </span>
            </div>
            <Button
              variant="accent"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleStartQuiz}
            >
              Take 10-Question Quiz & Code →
            </Button>
          </div>
        </Card>

        {/* Dynamic Resource Recommendations Adapted to Skill Gap */}
        {adaptedResources && (
          <div className="space-y-5">
            {/* Dynamic Gap Banner */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-teal-950 uppercase tracking-wide">
                    Adaptive Study Plan
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${adaptedResources.tierBadge}`}>
                    {adaptedResources.tierName}
                  </span>
                </div>
                <p className="text-teal-900/80 leading-relaxed">
                  {adaptedResources.guidance}
                </p>
              </div>
              <span className="text-[11px] font-bold text-teal-800 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                Tailored for {skillGap}% Gap
              </span>
            </div>

            {/* Adapted Website Resources */}
            {adaptedResources.websites?.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🌐</span>
                  <h3 className="font-display font-bold text-ink-900">
                    Recommended Reading & Reference
                  </h3>
                </div>
                <div className="space-y-2">
                  {adaptedResources.websites.map((site, i) => (
                    <ResourceLink key={i} href={site.url}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-teal-700 font-semibold group-hover:text-teal-800">
                            {site.title}
                          </span>
                          <p className="text-xs text-ink-500 mt-0.5 font-normal">
                            {site.description}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-ink-400 group-hover:text-teal-600 shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </ResourceLink>
                  ))}
                </div>
              </Card>
            )}

            {/* Adapted YouTube Videos */}
            {adaptedResources.youtube?.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">▶️</span>
                  <h3 className="font-display font-bold text-ink-900">
                    Recommended Video Tutorials
                  </h3>
                </div>
                <div className="space-y-2">
                  {adaptedResources.youtube.map((vid, i) => (
                    <a
                      key={i}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-line bg-paper hover:border-rose-300 hover:bg-rose-50/40 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-rose-600 group-hover:bg-rose-700 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800 group-hover:text-rose-700 transition-colors truncate">
                          {vid.title}
                        </p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {vid.channel} · {vid.duration}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-ink-400 group-hover:text-rose-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
