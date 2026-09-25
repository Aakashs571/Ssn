import { buildRoadmap } from "../utils/skillCalculations";
import { mockDelay } from "./api";

// Mirrors POST /api/roadmap/generate and GET /api/roadmap/:userId
export async function generateRoadmap(skills) {
  return mockDelay(buildRoadmap(skills));
}

// Mirrors POST /api/roadmap/adapt — re-runs the same logic on updated skills.
export async function adaptRoadmap(skills) {
  return mockDelay(buildRoadmap(skills));
}
