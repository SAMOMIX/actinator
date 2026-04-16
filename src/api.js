import { recommendActivity } from "./recommendationEngine";
import { CATEGORY_LABELS, enrichQuestion } from "./catalog";
import activities from "./seedActivities";

export async function fetchMeta() {
  return {
    totalActivities: activities.length,
    categories: CATEGORY_LABELS,
  };
}

export async function fetchActivities() {
  return {
    total: activities.length,
    activities,
  };
}

export async function fetchRecommendation(answers = {}) {
  const result = recommendActivity(answers, activities);

  return {
    ...result,
    nextQuestion: enrichQuestion(result.nextQuestion),
  };
}