import { mockDelay } from "./api";
import {
  initialCourses,
  initialProjects,
  initialCertifications,
  initialActivityTimeline,
} from "../data/learningHistory";

// Service layer for Student Learning History (Courses, Projects, Certifications, Activity Feed).
// Backend ready: each function will connect to /api/learning-history/:studentId endpoints later.

export async function fetchLearningHistory() {
  return mockDelay({
    courses: initialCourses,
    projects: initialProjects,
    certifications: initialCertifications,
  });
}

export async function addCourseRecord(course) {
  const newCourse = {
    id: `course_${Date.now()}`,
    ...course,
    verified: false,
    addedAt: new Date().toISOString(),
  };
  return mockDelay(newCourse);
}

export async function addProjectRecord(project) {
  const newProject = {
    id: `proj_${Date.now()}`,
    ...project,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
  return mockDelay(newProject);
}

export async function addCertificationRecord(cert) {
  const newCert = {
    id: `cert_${Date.now()}`,
    ...cert,
    verified: false,
    addedAt: new Date().toISOString(),
  };
  return mockDelay(newCert);
}

export async function fetchActivityTimeline(filters = {}) {
  let list = [...initialActivityTimeline];
  if (filters.skill && filters.skill !== "all") {
    list = list.filter((item) => item.skillId === filters.skill || item.skill?.toLowerCase() === filters.skill.toLowerCase());
  }
  if (filters.activityType && filters.activityType !== "all") {
    list = list.filter((item) => item.activityType === filters.activityType);
  }
  return mockDelay(list);
}
