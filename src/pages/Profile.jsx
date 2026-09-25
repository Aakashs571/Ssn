import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import {
  AddCourseModal,
  SyncGitHubModal,
  AddCertificationModal,
} from "../components/LearningHistoryModals";
import { useApp } from "../App";

const fields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "college", label: "College", type: "text", required: true },
  { name: "degree", label: "Degree", type: "text", required: true },
  { name: "educationLevel", label: "Education level", type: "select", options: ["High school", "Undergraduate", "Postgraduate"], required: true },
  { name: "currentSkills", label: "Current skills", type: "text", placeholder: "e.g. HTML, CSS, basic JavaScript", required: false },
  { name: "experienceLevel", label: "Experience level", type: "select", options: ["Beginner", "Intermediate", "Advanced"], required: true },
  { name: "learningGoal", label: "Learning goal", type: "text", placeholder: "What do you want to become?", required: true },
];

export default function Profile() {
  const { state, update, logout, addCourse, syncGitHubRepos, addCertification } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(
    state.profile || { name: state.user?.name || "", college: "", degree: "", educationLevel: "", currentSkills: "", experienceLevel: "", learningGoal: "" }
  );
  const [errors, setErrors] = useState({});

  // Modals for Learning History entry
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && !form[f.name]?.trim()) newErrors[f.name] = "This field is required.";
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    update({ profile: form });
    navigate("/careers");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const courses = state.courses || [];
  const projects = state.projects || [];
  const certifications = state.certifications || [];
  const skills = state.skills || [];

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink-900">Student Profile & Privacy</h1>
          <p className="text-ink-600 mt-1">Manage your educational background and transparent learning profile.</p>
        </div>

        {state.user ? (
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-rose-600 self-start sm:self-auto">
            Log out →
          </Button>
        ) : (
          <Button variant="accent" size="sm" onClick={() => navigate("/login")} className="self-start sm:self-auto">
            Log in
          </Button>
        )}
      </div>

      {/* Privacy Notice Banner (Section 23) */}
      <div className="max-w-2xl mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/80 shadow-2xs">
        <div className="flex items-start gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
              Privacy-Friendly Learning Profile
            </h3>
            <p className="text-xs sm:text-sm text-teal-900 mt-1 font-medium">
              "Your information is used to personalize your learning experience."
            </p>
            <p className="text-[11px] text-teal-800/80 mt-1">
              We collect and index only learning signals (skills, courses, projects, assessments, and tasks). No sensitive personal data, tracking cookies, or external email scanning is performed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Left Column: Editable Student Profile Form */}
        <div>
          <Card>
            <h2 className="font-display font-bold text-base text-ink-950 mb-4">
              Personal Information
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-ink-800 uppercase tracking-wider mb-1">
                    {f.label}{f.required && <span className="text-amber-500"> *</span>}
                  </label>
                  {f.type === "select" ? (
                    <select
                      value={form[f.name]}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      className="w-full border border-line rounded-lg px-3.5 py-2 text-sm focus-ring bg-white"
                    >
                      <option value="">Select...</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={form[f.name]}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      className="w-full border border-line rounded-lg px-3.5 py-2 text-sm focus-ring bg-white"
                    />
                  )}
                  {errors[f.name] && <p className="text-xs text-rose-600 mt-1">{errors[f.name]}</p>}
                </div>
              ))}
              <Button type="submit" variant="accent" className="mt-2 self-start font-bold">
                Save Profile & Continue
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Your Learning Profile Summary (Section 23 & Section 3) */}
        <div className="space-y-6">
          {/* Transparent Collection Summary Card */}
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-950 text-base mb-1">
              Your Learning Profile Overview
            </h3>
            <p className="text-xs text-ink-500 mb-4">
              What the adaptive engine currently knows about your learning progress:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line">
                <span className="font-semibold text-ink-800">Target Career Goal:</span>
                <span className="font-bold text-teal-800">{state.selectedCareer || "Full-Stack Developer"}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line">
                <span className="font-semibold text-ink-800">Calibrated Skills Tracked:</span>
                <span className="font-bold text-ink-900">{skills.length} skills</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line">
                <span className="font-semibold text-ink-800">Courses Entered:</span>
                <span className="font-bold text-ink-900">{courses.length} courses</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line">
                <span className="font-semibold text-ink-800">Projects Documented:</span>
                <span className="font-bold text-ink-900">{projects.length} projects</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line">
                <span className="font-semibold text-ink-800">Certifications:</span>
                <span className="font-bold text-ink-900">{certifications.length} credentials</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line">
                <span className="font-semibold text-ink-800">Quiz & Task History:</span>
                <span className="font-bold text-ink-900">
                  {(state.quizResults?.length || 0) + (state.taskResults?.length || 0)} attempts recorded
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/learning-history")}
                className="text-xs font-bold text-teal-700 hover:underline"
              >
                View full chronological history →
              </button>
            </div>
          </Card>

          {/* Quick Learning History Section (Section 3) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display font-bold text-ink-950 text-base">
                  Student Learning History
                </h3>
                <p className="text-xs text-ink-500">Manually add prior learning to credit skills</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setIsCourseModalOpen(true)}>
                + Course (PDF)
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsGitHubModalOpen(true)} className="flex items-center gap-1">
                <span>🐙</span>
                <span>Sync GitHub</span>
              </Button>
              <Button variant="accent" size="sm" onClick={() => setIsCertModalOpen(true)}>
                + Cert
              </Button>
            </div>

            {/* Quick list of recent courses/projects */}
            <div className="space-y-2">
              {courses.slice(0, 2).map((c) => (
                <div key={c.id} className="p-2.5 rounded-lg bg-paper/60 border border-line flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink-900">{c.courseName}</span>
                    <span className="text-[11px] text-ink-500 block">{c.platform} • {c.skill}</span>
                  </div>
                  <span className="font-semibold text-teal-700 text-[11px]">✓ Verified PDF</span>
                </div>
              ))}
              {projects.slice(0, 1).map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg bg-paper/60 border border-line flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink-900">{p.projectName}</span>
                    <span className="text-[11px] text-ink-500 block">{p.skills?.join(", ")}</span>
                  </div>
                  <span className="font-semibold text-teal-700 text-[11px]">GitHub Verified</span>
                </div>
              ))}
              {courses.length === 0 && projects.length === 0 && (
                <p className="text-xs text-ink-500 italic py-2">
                  No courses or GitHub projects linked yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onAdd={addCourse}
      />
      <SyncGitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onSync={syncGitHubRepos}
      />
      <AddCertificationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onAdd={addCertification}
      />
    </Layout>
  );
}
