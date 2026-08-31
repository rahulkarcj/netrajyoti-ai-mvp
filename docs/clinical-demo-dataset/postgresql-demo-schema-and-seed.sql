-- NetraJyoti clinical knowledge demo schema and seed data.
-- SAFETY STATUS: DEMO_ONLY_NOT_CLINICALLY_APPROVED.
-- Do not use this file for real patient screening without documented clinical review,
-- legal/privacy review, local service validation, and formal release approval.

CREATE TABLE IF NOT EXISTS clinical_source (
  source_id VARCHAR(80) PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  published_year INTEGER,
  source_url TEXT NOT NULL,
  licence_note TEXT NOT NULL,
  accessed_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS clinical_pathway (
  pathway_id VARCHAR(100) PRIMARY KEY,
  title TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  dataset_version VARCHAR(20) NOT NULL,
  scope TEXT NOT NULL,
  created_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS clinical_criterion (
  criterion_id BIGSERIAL PRIMARY KEY,
  pathway_id VARCHAR(100) NOT NULL REFERENCES clinical_pathway(pathway_id),
  criterion_type VARCHAR(50) NOT NULL,
  symptom_code VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS clinical_pathway_source (
  pathway_id VARCHAR(100) NOT NULL REFERENCES clinical_pathway(pathway_id),
  source_id VARCHAR(80) NOT NULL REFERENCES clinical_source(source_id),
  PRIMARY KEY (pathway_id, source_id)
);

CREATE TABLE IF NOT EXISTS clinical_guidance (
  guidance_id BIGSERIAL PRIMARY KEY,
  pathway_id VARCHAR(100) NOT NULL REFERENCES clinical_pathway(pathway_id),
  route VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  guidance_type VARCHAR(50) NOT NULL,
  guidance_text TEXT NOT NULL,
  source_label TEXT NOT NULL,
  status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS clinical_required_action (
  action_id BIGSERIAL PRIMARY KEY,
  pathway_id VARCHAR(100) NOT NULL REFERENCES clinical_pathway(pathway_id),
  route VARCHAR(50) NOT NULL,
  action_order SMALLINT NOT NULL,
  action_text TEXT NOT NULL
);

INSERT INTO clinical_source (source_id, title, publisher, published_year, source_url, licence_note, accessed_on) VALUES
('WHO-VESIH-2024', 'Vision and eye screening implementation handbook', 'World Health Organization', 2024, 'https://www.who.int/publications/b/70764', 'CC BY-NC-SA 3.0 IGO shown on WHO publication page; verify attribution and reuse conditions.', DATE '2026-08-26'),
('WHO-PECI-2022', 'Package of eye care interventions', 'World Health Organization', 2022, 'https://www.who.int/publications/i/item/9789240048959', 'Reference-only demo source; verify applicable rights before reproducing substantive content.', DATE '2026-08-26'),
('INDIA-NPCBVI-DGHS', 'National Programme for Control of Blindness and Visual Impairment - Ophthalmology Division', 'DGHS, Ministry of Health and Family Welfare, Government of India', NULL, 'https://dghs.mohfw.gov.in/opthalmology-division.php', 'Reference-only demo source; validate current local operating guidance and rights.', DATE '2026-08-26')
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO clinical_pathway (pathway_id, title, status, dataset_version, scope, created_on) VALUES
('demo-urgent-warning-signs-v1', 'Urgent warning-sign pathway', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED', '1.0', 'Demonstrates urgent routing for configured warning-sign answers.', DATE '2026-08-26'),
('demo-routine-vision-check-v1', 'Routine vision-check pathway', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED', '1.0', 'Demonstrates routine routing only when configured warning signs are absent.', DATE '2026-08-26'),
('demo-redness-or-discharge-escalation-v1', 'Redness, irritation, or discharge escalation pathway', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED', '1.0', 'Conservative human-escalation demonstration pathway.', DATE '2026-08-26'),
('demo-unclear-input-escalation-v1', 'Unclear or unsupported-input escalation pathway', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED', '1.0', 'Safe default for unclear, conflicting, unsupported, or other input.', DATE '2026-08-26')
ON CONFLICT (pathway_id) DO NOTHING;

INSERT INTO clinical_pathway_source (pathway_id, source_id) VALUES
('demo-urgent-warning-signs-v1', 'WHO-VESIH-2024'),
('demo-urgent-warning-signs-v1', 'WHO-PECI-2022'),
('demo-routine-vision-check-v1', 'WHO-VESIH-2024'),
('demo-routine-vision-check-v1', 'WHO-PECI-2022'),
('demo-redness-or-discharge-escalation-v1', 'WHO-VESIH-2024'),
('demo-redness-or-discharge-escalation-v1', 'WHO-PECI-2022'),
('demo-unclear-input-escalation-v1', 'WHO-VESIH-2024'),
('demo-unclear-input-escalation-v1', 'INDIA-NPCBVI-DGHS')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_criterion (pathway_id, criterion_type, symptom_code) VALUES
('demo-urgent-warning-signs-v1', 'URGENT_IF_ANY', 'SUDDEN_VISION_CHANGE'),
('demo-urgent-warning-signs-v1', 'URGENT_IF_ANY', 'SEVERE_PAIN'),
('demo-urgent-warning-signs-v1', 'URGENT_IF_ANY', 'INJURY_OR_CHEMICAL'),
('demo-urgent-warning-signs-v1', 'ESCALATE_IF_ANY', 'INPUT_UNCLEAR'),
('demo-urgent-warning-signs-v1', 'ESCALATE_IF_ANY', 'CONFLICTING_RESPONSES'),
('demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'BLURRY_VISION'),
('demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'READING_OR_DISTANCE_DIFFICULTY'),
('demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'EYE_CHECK_OR_GLASSES'),
('demo-redness-or-discharge-escalation-v1', 'ESCALATE_IF_ANY', 'REDNESS_OR_DISCHARGE'),
('demo-unclear-input-escalation-v1', 'ESCALATE_IF_ANY', 'INPUT_UNCLEAR'),
('demo-unclear-input-escalation-v1', 'ESCALATE_IF_ANY', 'CONFLICTING_RESPONSES'),
('demo-unclear-input-escalation-v1', 'ESCALATE_IF_ANY', 'NO_APPROVED_PATHWAY_MATCHED'),
('demo-unclear-input-escalation-v1', 'ESCALATE_IF_ANY', 'OTHER');

INSERT INTO clinical_required_action (pathway_id, route, action_order, action_text) VALUES
('demo-urgent-warning-signs-v1', 'URGENT', 1, 'Seek in-person urgent eye-care assessment without delay.'),
('demo-urgent-warning-signs-v1', 'URGENT', 2, 'Do not wait for an AI explanation before following the urgent route.'),
('demo-routine-vision-check-v1', 'ROUTINE', 1, 'Plan an in-person eye examination through an appropriate vision centre or eye clinic.'),
('demo-routine-vision-check-v1', 'ROUTINE', 2, 'Confirm service availability before travel.'),
('demo-redness-or-discharge-escalation-v1', 'HUMAN_SUPPORT', 1, 'Speak with an ASHA worker, PHC, vision centre, eye clinic, or qualified eye-care professional for next-step guidance.'),
('demo-unclear-input-escalation-v1', 'HUMAN_SUPPORT', 1, 'Do not guess the condition. Seek support from a health worker or eye-care service.');

INSERT INTO clinical_guidance (pathway_id, route, language, guidance_type, guidance_text, source_label, status) VALUES
('demo-urgent-warning-signs-v1', 'URGENT', 'bn', 'PATIENT_NEXT_STEPS', 'এই ডেমো স্ক্রিনিংয়ে জরুরি সতর্ক-লক্ষণ চিহ্নিত হয়েছে। দেরি না করে সরাসরি চোখের জরুরি চিকিৎসাসেবা নিন। সম্ভব হলে পরিবারের একজন বিশ্বস্ত সদস্যকে সঙ্গে নিন।', 'Demo pathway derived for demonstration from cited screening and intervention references.', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED'),
('demo-routine-vision-check-v1', 'ROUTINE', 'bn', 'PATIENT_NEXT_STEPS', 'এই ডেমো স্ক্রিনিংয়ে জরুরি সতর্ক-লক্ষণ পাওয়া যায়নি। চোখ পরীক্ষা করানোর জন্য ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন। যাওয়ার আগে পরিষেবার সময় নিশ্চিত করুন।', 'Demo pathway derived for demonstration from cited screening and intervention references.', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED'),
('demo-redness-or-discharge-escalation-v1', 'HUMAN_SUPPORT', 'bn', 'PATIENT_NEXT_STEPS', 'এই উপসর্গের জন্য আরও তথ্য ও একজন স্বাস্থ্যকর্মীর সহায়তা প্রয়োজন হতে পারে। নিকটবর্তী PHC, ভিশন সেন্টার, চোখের ক্লিনিক বা ASHA কর্মীর সঙ্গে কথা বলুন।', 'Demo pathway derived for demonstration from cited screening and intervention references.', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED'),
('demo-unclear-input-escalation-v1', 'HUMAN_SUPPORT', 'bn', 'PATIENT_NEXT_STEPS', 'এই তথ্যের ভিত্তিতে নিরাপদভাবে পরবর্তী পদক্ষেপ নির্ধারণ করা যাচ্ছে না। একজন স্বাস্থ্যকর্মী, PHC, ভিশন সেন্টার বা চোখের ক্লিনিকের সহায়তা নিন।', 'Demo pathway derived for demonstration from cited screening and intervention references.', 'DEMO_ONLY_NOT_CLINICALLY_APPROVED');
