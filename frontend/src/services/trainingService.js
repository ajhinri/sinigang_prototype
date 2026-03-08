import { getInternProfileKey, getStorageJson, setStorageJson } from './storage'

export async function loadTrainingTemplates() {
  const response = await fetch('/mock/training-templates.json')
  return response.json()
}

function pickTemplateForInterest(templates, interest) {
  return templates.find((template) => template.focusArea === interest)
}

export function buildTrainingPlan(templates, interests) {
  const selectedTemplates = interests
    .map((interest) => pickTemplateForInterest(templates, interest))
    .filter(Boolean)

  const fallbackTemplate = templates[0]
  const baseTemplate = selectedTemplates[0] || fallbackTemplate

  return {
    planId: `${baseTemplate.id}-${Date.now()}`,
    interests,
    primaryTrack: baseTemplate.focusArea,
    week1: baseTemplate.week1,
    week2: baseTemplate.week2,
    generatedAt: new Date().toISOString(),
  }
}

export function savePlanToProfile(userId, plan) {
  const profileKey = getInternProfileKey(userId)
  const profile = getStorageJson(profileKey, null)

  if (!profile) {
    return null
  }

  const nextProfile = {
    ...profile,
    planId: plan.planId,
    primaryTrack: plan.primaryTrack,
    generatedPlan: plan,
    updatedAt: new Date().toISOString(),
  }

  setStorageJson(profileKey, nextProfile)
  return nextProfile
}
