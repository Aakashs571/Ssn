import { useState, useMemo } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import EmptyState from "../components/EmptyState";
import {
  AddCourseModal,
  SyncGitHubModal,
  AddCertificationModal,
} from "../components/LearningHistoryModals";
import { useApp } from "../App";

export default function LearningHistory() {
  const { state, addCourse, syncGitHubRepos, addCertification } = useApp();

  // Active Tab: "timeline" | "courses" | "projects" | "certifications"
  const [activeTab, setActiveTab] = useState("timeline");

  // Filters for timeline
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" | "asc"

  // Modal open states
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 5000);
  };

  const handleAddCourse = (course) => {
    addCourse(course);
    showToast(`✓ Added course "${course.courseName}" with verified PDF certificate!`);
  };

  const handleSyncGitHub = (username, repos) => {
    syncGitHubRepos(username, repos);
    showToast(`✓ Synced ${repos.length} repositories from GitHub (@${username})!`);
  };

  const handleAddCert = (cert) => {
    addCertification(cert);
    showToast(`✓ Added verified certification "${cert.certificationName}"!`);
  };

  const courses = state.courses || [];
  const projects = state.projects || [];
  const certifications = state.certifications || [];
  const rawTimeline = state.activityTimeline || [];

  // Filtered & sorted timeline
  const filteredTimeline = useMemo(() => {
    let list = [...rawTimeline];
    if (filterSkill !== "all") {
      list = list.filter((item) => item.skill?.toLowerCase().includes(filterSkill.toLowerCase()));
    }
    if (filterType !== "all") {
      list = list.filter((item) => item.activityType === filterType);
    }
    list.sort((a, b) => {
      const dateA = new Date(a.fullDate || a.date).getTime() || 0;
      const dateB = new Date(b.fullDate || b.date).getTime() || 0;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [rawTimeline, filterSkill, filterType, sortOrder]);

  const activityBadges = {
    assessment: "bg-teal-100 text-teal-800 border-teal-200",
    quiz: "bg-blue-100 text-blue-800 border-blue-200",
    practical_task: "bg-purple-100 text-purple-800 border-purple-200",
    course: "bg-emerald-100 text-emerald-800 border-emerald-200",
    project: "bg-amber-100 text-amber-800 border-amber-200",
    certification: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return (
    <Layout>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-teal-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-teal-700 flex items-center gap-3 animate-slideDown">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-teal-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <BackButton to="/dashboard" label="Dashboard" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-950">
              Learning History
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Verified Evidence
            </span>
          </div>
          <p className="text-ink-600 text-sm mt-1">
            Maintain your coursework, GitHub projects, and PDF certifications. Each completed item increases your progress and skill calibration.
          </p>
        </div>

        {/* Action Buttons to add verified records */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCourseModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <span>+ Course (PDF)</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGitHubModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
          >
            <span>🐙</span>
            <span>Sync GitHub</span>
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsCertModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <span>+ Certification</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-paper p-1 rounded-xl border border-line mb-6 max-w-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
            activeTab === "timeline" ? "bg-white text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-900"
          }`}
        >
          Activity Feed ({rawTimeline.length})
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
            activeTab === "courses" ? "bg-white text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-900"
          }`}
        >
          Courses ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
            activeTab === "projects" ? "bg-white text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-900"
          }`}
        >
          GitHub Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("certifications")}
          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
            activeTab === "certifications" ? "bg-white text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-900"
          }`}
        >
          Certifications ({certifications.length})
        </button>
      </div>

      {/* TAB 1: ACTIVITY TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-line shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-ink-700 uppercase tracking-wider">Filters:</span>

              {/* Skill Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-ink-500">Skill:</span>
                <select
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 font-semibold text-ink-800 focus-ring"
                >
                  <option value="all">All Skills</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="React">React</option>
                  <option value="Node">Node.js</option>
                  <option value="Python">Python</option>
                  <option value="SQL">SQL</option>
                </select>
              </div>

              {/* Activity Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-ink-500">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 font-semibold text-ink-800 focus-ring"
                >
                  <option value="all">All Activities</option>
                  <option value="quiz">Quiz</option>
                  <option value="course">Course</option>
                  <option value="project">Project</option>
                  <option value="certification">Certification</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-ink-500">Sort:</span>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="font-semibold text-ink-800 hover:text-teal-700 underline"
              >
                {sortOrder === "desc" ? "Newest First ↓" : "Oldest First ↑"}
              </button>
            </div>
          </div>

          {/* Timeline Feed */}
          {filteredTimeline.length === 0 ? (
            <EmptyState
              title="No learning activities recorded yet"
              message="Activities will appear here as you take quizzes, complete roadmap courses, and sync GitHub projects."
              action={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsCourseModalOpen(true)}>
                    + Course
                  </Button>
                  <Button variant="accent" size="sm" onClick={() => setIsGitHubModalOpen(true)}>
                    Sync GitHub Repos
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="relative border-l-2 border-line ml-4 pl-6 space-y-6">
              {filteredTimeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                  <div className="bg-white p-4 rounded-xl border border-line shadow-2xs hover:border-teal-300 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            activityBadges[item.activityType] || "bg-paper text-ink-700"
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="font-display font-bold text-sm text-ink-950">
                          {item.skill}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-400 font-mono">
                        {item.date}
                      </span>
                    </div>

                    <p className="text-xs text-ink-700 leading-relaxed">
                      {item.note}
                    </p>

                    {item.score !== undefined && (
                      <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                        <span className="text-ink-500 font-medium">Performance Score</span>
                        <span className="font-bold text-teal-700">{item.score}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSES */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-500 font-semibold uppercase tracking-wider">
              Enrolled & Completed Courses ({courses.length})
            </p>
            <Button variant="accent" size="sm" onClick={() => setIsCourseModalOpen(true)}>
              + Add Course (PDF)
            </Button>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              title="No courses added yet"
              message="Add your coursework along with a PDF certificate to earn skill credits and unlock benchmark assessments."
              action={
                <Button variant="accent" onClick={() => setIsCourseModalOpen(true)}>
                  + Add Completed Course
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="p-5 hover:border-teal-300 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {course.platform}
                      </span>
                      <h3 className="font-display font-bold text-base text-ink-950 mt-1">
                        {course.courseName}
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <span>✓</span>
                      <span>Verified PDF</span>
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-600">
                    <span className="font-medium">Skill: <strong className="text-ink-900">{course.skill}</strong></span>
                    <span>Completed: <strong>{course.completionYear || "Verified"}</strong></span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PORTFOLIO PROJECTS (GitHub Sync Only) */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500 font-semibold uppercase tracking-wider">
                GitHub Repositories & Projects ({projects.length})
              </p>
              {state.githubConnected && (
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                  <span>🐙</span>
                  <span>Connected: @{state.githubUsername}</span>
                </span>
              )}
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <span>🐙</span>
              <span>{state.githubConnected ? "Re-sync GitHub" : "Sync from GitHub"}</span>
            </Button>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects synced yet"
              message="Projects must be imported directly from your GitHub profile to verify your coding repository history."
              action={
                <Button variant="accent" onClick={() => setIsGitHubModalOpen(true)} className="flex items-center gap-1.5">
                  <span>🐙</span>
                  <span>Sync GitHub Profile</span>
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <Card key={proj.id} className="p-5 hover:border-teal-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-display font-bold text-base text-ink-950">
                          {proj.projectName}
                        </h3>
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-teal-700 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <span>🔗</span>
                            <span>{proj.repoUrl.replace("https://github.com/", "")}</span>
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        {proj.projectStatus || "Verified on GitHub"}
                      </span>
                    </div>

                    <p className="text-xs text-ink-600 line-clamp-3 leading-relaxed mb-4">
                      {proj.description}
                    </p>

                    {/* Technologies */}
                    <div className="mb-3">
                      <span className="text-[10px] uppercase font-bold text-ink-400 block mb-1">
                        Technologies
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {proj.technologies?.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-paper border border-line text-ink-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <span>⭐</span>
                      <span>{proj.stars || 0} stars</span>
                    </span>
                    <span>Last updated: {proj.lastUpdated || "Recently"}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATIONS */}
      {activeTab === "certifications" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-500 font-semibold uppercase tracking-wider">
              Verified Certifications ({certifications.length})
            </p>
            <Button variant="accent" size="sm" onClick={() => setIsCertModalOpen(true)}>
              + Add Certification (PDF)
            </Button>
          </div>

          {certifications.length === 0 ? (
            <EmptyState
              title="No certifications added yet"
              message="Upload your accredited certificate in PDF format. We will verify the signature and index your credential."
              action={
                <Button variant="accent" onClick={() => setIsCertModalOpen(true)}>
                  + Add Verified Certificate
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <Card key={cert.id} className="p-5 hover:border-teal-300 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {cert.issuingOrg}
                      </span>
                      <h3 className="font-display font-bold text-base text-ink-950 mt-1">
                        {cert.certificationName}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Verified PDF
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-600">
                    <span>Skill: <strong className="text-ink-900">{cert.skill}</strong></span>
                    <span>Year: <strong>{cert.year}</strong></span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Entry Modals */}
      <AddCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onAdd={handleAddCourse}
      />
      <SyncGitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onSync={handleSyncGitHub}
      />
      <AddCertificationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onAdd={handleAddCert}
      />
    </Layout>
  );
}
