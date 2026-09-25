import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import BackButton from "../components/BackButton";
import CareerRoadmapExplorer from "../components/CareerRoadmapExplorer";
import AddOutsideCourseModal from "../components/AddOutsideCourseModal";
import { getCareerById } from "../data/careers";
import { useApp } from "../App";

export default function AdaptiveRoadmap() {
  const { state, update } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCareerId = searchParams.get("career") || state.selectedCareer || "fullstack";
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditSkillId, setCreditSkillId] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const currentCareer = useMemo(() => getCareerById(activeCareerId), [activeCareerId]);

  const handleCareerChange = (careerId) => {
    setSearchParams({ career: careerId });
  };

  const handleSetTargetCareer = (careerId) => {
    update({ selectedCareer: careerId });
  };

  const handleStartAssessment = (careerId) => {
    update({ selectedCareer: careerId });
    navigate("/assessment");
  };

  const handleOpenCreditModal = (skillId = "") => {
    setCreditSkillId(skillId);
    setCreditModalOpen(true);
  };

  const handleCreditCourse = ({ skillId, skillName, courseTitle, platform, score, certificateUrl }) => {
    const newCourse = {
      id: `ext_${Date.now()}`,
      skillId,
      skillName,
      courseTitle,
      platform,
      scoreAwarded: score,
      certificateUrl,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    const existingCourses = state.externalCourses || [];
    const updatedCourses = [newCourse, ...existingCourses];

    let updatedSkills = state.skills ? [...state.skills] : [];
    const existingSkillIndex = updatedSkills.findIndex((s) => s.id === skillId);
    if (existingSkillIndex >= 0) {
      const current = updatedSkills[existingSkillIndex];
      const newScore = Math.max(current.currentScore, score);
      updatedSkills[existingSkillIndex] = {
        ...current,
        currentScore: newScore,
        history: [
          ...(current.history || []),
          { source: "external_course", score: newScore, note: courseTitle, platform, date: new Date().toISOString() },
        ],
      };
    } else {
      updatedSkills.push({
        id: skillId,
        name: skillName,
        category: "specialized",
        currentScore: score,
        requiredScore: 75,
        history: [{ source: "external_course", score, note: courseTitle, platform, date: new Date().toISOString() }],
      });
    }

    update({
      externalCourses: updatedCourses,
      skills: updatedSkills,
    });

    setToastMessage(`✓ Credited outside course "${courseTitle}"!`);
    setTimeout(() => setToastMessage(""), 5000);
  };

  const handleRemoveExternalCourse = (courseId) => {
    const updated = (state.externalCourses || []).filter((c) => c.id !== courseId);
    update({ externalCourses: updated });
  };

  const hasCompletedCourse = Boolean(
    (state.courses && state.courses.some((c) => c.progress === 100 || c.status === "Completed" || c.certificate)) ||
    (state.externalCourses && state.externalCourses.length > 0) ||
    (state.topicsCompleted && state.topicsCompleted.length >= 1)
  );

  return (
    <Layout>
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-teal-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-teal-600 flex items-center gap-3 animate-slideDown">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-teal-300 hover:text-white">✕</button>
        </div>
      )}

      <BackButton to="/roadmap" label="Roadmaps" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-950">
              Adaptive Career Roadmap
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
              ⚡ Live Adaptive Engine
            </span>
          </div>
          <p className="text-ink-600 text-sm mt-1">
            Dynamic learning journey maintaining the exact same structured phases and milestones, but reordered live to close your largest skill gaps first.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreditModal()}
            className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>🎓</span>
            <span>Credit Outside Course</span>
          </button>
          <button
            onClick={() => navigate("/roadmap")}
            className="text-xs font-semibold text-ink-700 bg-paper hover:bg-white border border-line px-3 py-2 rounded-xl transition-all"
          >
            Standard Roadmap
          </button>
        </div>
      </div>

      {/* Adaptive Notice Bar */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">⚡</span>
          <div>
            <span className="font-bold text-amber-950 block">Adaptive Sequencing Active</span>
            <p className="text-amber-900/80 mt-0.5">
              Skills within each phase are dynamically sorted by your gap size. Topics with the largest room for improvement appear first.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="font-bold text-amber-900">Career: {currentCareer?.name || "Full-Stack Developer"}</span>
        </div>
      </div>

      {/* CareerRoadmapExplorer with exact same design & all details, in adaptive mode */}
      <CareerRoadmapExplorer
        activeCareerId={activeCareerId}
        onCareerChange={handleCareerChange}
        userSelectedCareer={state.selectedCareer}
        userSkills={state.skills || []}
        externalCourses={state.externalCourses || []}
        isAdaptive={true}
        hasCompletedCourse={hasCompletedCourse}
        onSetTargetCareer={handleSetTargetCareer}
        onStartAssessment={handleStartAssessment}
        onOpenCreditModal={handleOpenCreditModal}
        onRemoveExternalCourse={handleRemoveExternalCourse}
        onLearn={(skillId) => navigate(`/learning?skill=${skillId}`)}
        onQuiz={(skillId, topic) =>
          navigate(`/quiz?skill=${skillId}${topic ? `&topic=${encodeURIComponent(topic)}` : ""}`)
        }
        onTask={(skillId) => navigate(`/real-world-task?skill=${skillId}`)}
      />

      {/* Outside Course Crediting Modal */}
      <AddOutsideCourseModal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        availableSkills={state.skills?.length ? state.skills : currentCareer?.requiredSkills || []}
        preselectedSkillId={creditSkillId}
        onSubmit={handleCreditCourse}
      />
    </Layout>
  );
}
