import { useState } from "react";

const PLATFORM_PRESETS = [
  { id: "freeCodeCamp", label: "freeCodeCamp", icon: "🌐" },
  { id: "Coursera", label: "Coursera", icon: "🎓" },
  { id: "Udemy", label: "Udemy", icon: "💻" },
  { id: "YouTube", label: "YouTube / Tutorial", icon: "📺" },
  { id: "University", label: "College / University", icon: "🏫" },
  { id: "Other", label: "Bootcamp / Other", icon: "🚀" },
];

const PROFICIENCY_PRESETS = [
  { label: "Completed Core Fundamentals", score: 70, tag: "Working Knowledge", desc: "Understand the basics and can follow along." },
  { label: "Completed Full Course & Projects", score: 85, tag: "Proficient", desc: "Built projects and understand key concepts well." },
  { label: "Mastered or Certified", score: 95, tag: "Advanced", desc: "Hold an official certificate or extensive hands-on experience." },
];

export default function AddOutsideCourseModal({
  isOpen,
  onClose,
  availableSkills = [],
  preselectedSkillId = "",
  onSubmit,
}) {
  const [skillId, setSkillId] = useState(preselectedSkillId || availableSkills[0]?.skillId || availableSkills[0]?.id || "html");
  const [courseTitle, setCourseTitle] = useState("");
  const [platform, setPlatform] = useState("Coursera");
  const [score, setScore] = useState(85);
  const [certificateUrl, setCertificateUrl] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      setError("Please enter the course name or title.");
      return;
    }
    setError("");

    const targetSkill = availableSkills.find((s) => (s.skillId || s.id) === skillId);
    const skillName = targetSkill?.name || skillId.toUpperCase();

    onSubmit({
      skillId,
      skillName,
      courseTitle: courseTitle.trim(),
      platform,
      score: Number(score),
      certificateUrl: certificateUrl.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs">
      <div className="bg-white border border-line rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-50 via-white to-amber-50/40 p-6 border-b border-line flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎓</span>
              <h3 className="font-display font-black text-xl text-ink-950">
                Credit Outside Course
              </h3>
            </div>
            <p className="text-xs text-ink-600">
              Already learned a skill on Coursera, Udemy, YouTube, or college? Credit it here so your roadmap adjusts automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-900 hover:bg-line/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* 1. Skill Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Which skill did you learn? *
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm font-medium focus-ring bg-white text-ink-900"
            >
              {availableSkills.map((s) => (
                <option key={s.skillId || s.id} value={s.skillId || s.id}>
                  {s.name} ({s.category || "Skill"})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Course Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Course / Program Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Python for Everybody, Responsive Web Design..."
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus-ring text-ink-900 placeholder:text-ink-400"
            />
          </div>

          {/* 3. Platform Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Platform / Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    platform === p.id
                      ? "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                      : "bg-paper/50 border-line text-ink-700 hover:bg-white"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Proficiency Score Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                Your Completion Level & Score
              </label>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Credited Score: {score}%
              </span>
            </div>

            <div className="space-y-2">
              {PROFICIENCY_PRESETS.map((preset) => (
                <div
                  key={preset.score}
                  onClick={() => setScore(preset.score)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    score === preset.score
                      ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-300"
                      : "border-line bg-paper/40 hover:bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-900">{preset.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white text-ink-600 border border-line">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-500 mt-0.5">{preset.desc}</p>
                  </div>
                  <span className="font-display font-extrabold text-xs text-teal-700 shrink-0 ml-2">
                    {preset.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Optional Certificate Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Certificate URL or Notes <span className="text-ink-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. link to verification badge or certificate"
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              className="w-full border border-line rounded-xl px-3 py-2 text-xs focus-ring text-ink-900 placeholder:text-ink-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-display font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all focus-ring"
            >
              ✓ Credit Course to Roadmap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
