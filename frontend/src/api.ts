export type Concern = 'SUDDEN_VISION_CHANGE' | 'SEVERE_PAIN' | 'INJURY_OR_CHEMICAL' | 'REDNESS_OR_DISCHARGE' | 'BLURRY_VISION' | 'READING_OR_DISTANCE_DIFFICULTY' | 'EYE_CHECK_OR_GLASSES' | 'OTHER';
export type HistoryCode = 'PREVIOUS_EYE_SURGERY' | 'PREVIOUS_EYE_INJURY' | 'USES_SPECTACLES' | 'USES_CONTACT_LENSES' | 'KNOWN_EYE_CONDITION' | 'ONGOING_EYE_TREATMENT' | 'NOT_SURE';
export type Outcome = 'URGENT' | 'ROUTINE' | 'HUMAN_SUPPORT';
const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
export async function evaluate(concerns: Concern[], history: HistoryCode[], needsHumanSupport: boolean): Promise<Outcome> {
  const response = await fetch(`${API}/api/v1/routing/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concerns, history, needsHumanSupport }) });
  if (!response.ok) throw new Error('Unable to reach the safety service');
  return (await response.json()).outcome as Outcome;
}

export type ClinicalSource = { id: string; title: string; reviewedOn: string };
export type CaregiverSummary = { summaryBn: string; source: 'OLLAMA_RAG_VALIDATED' | 'SAFE_FIXED_FALLBACK'; sources: ClinicalSource[] };
export async function routeExplanation(outcome: Outcome, concerns: Concern[], history: HistoryCode[]): Promise<CaregiverSummary> {
  const response = await fetch(`${API}/api/v1/ai/route-explanation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome, concerns, history })
  });
  if (!response.ok) throw new Error('Unable to create route explanation');
  return response.json() as Promise<CaregiverSummary>;
}
