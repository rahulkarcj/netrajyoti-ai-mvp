export type Concern = 'SUDDEN_VISION_CHANGE' | 'SEVERE_PAIN' | 'INJURY_OR_CHEMICAL' | 'REDNESS_OR_DISCHARGE' | 'BLURRY_VISION' | 'READING_OR_DISTANCE_DIFFICULTY' | 'EYE_CHECK_OR_GLASSES' | 'OTHER';
export type Outcome = 'URGENT' | 'ROUTINE' | 'HUMAN_SUPPORT';
const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
export async function evaluate(concerns: Concern[], needsHumanSupport: boolean): Promise<Outcome> {
  const response = await fetch(`${API}/api/v1/routing/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concerns, needsHumanSupport }) });
  if (!response.ok) throw new Error('Unable to reach the safety service');
  return (await response.json()).outcome as Outcome;
}

export type CaregiverSummary = { summaryBn: string; source: 'AI_VALIDATED' | 'APPROVED_FALLBACK' };
export async function caregiverSummary(): Promise<CaregiverSummary> {
  const response = await fetch(`${API}/api/v1/ai/caregiver-summary`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: 'ROUTINE' })
  });
  if (!response.ok) throw new Error('Unable to create caregiver summary');
  return response.json() as Promise<CaregiverSummary>;
}
