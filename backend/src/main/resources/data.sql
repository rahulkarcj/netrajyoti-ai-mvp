-- NetraJyoti source register and demonstration pathways.
-- SAFETY STATUS: DEMO_SIMULATED_NOT_FOR_CLINICAL_USE.
-- These records demonstrate the data model only. The application repository
-- queries status APPROVED exclusively by default. With DEMO_RAG_ENABLED=true,
-- these simulated records demonstrate database-driven Java routing and Ollama
-- context retrieval. They are not clinically approved or production eligible.

insert into clinical_source (source_id, title, publisher, published_year, source_url, licence_note, accessed_on) values
('WHO-VESIH-2024', 'Vision and eye screening implementation handbook', 'World Health Organization', 2024, 'https://www.who.int/publications/b/70764', 'Check applicable WHO attribution and reuse conditions before reproducing content.', current_date),
('WHO-PECI-2022', 'Package of eye care interventions', 'World Health Organization', 2022, 'https://www.who.int/publications/i/item/9789240048959', 'Reference source only; clinical content requires local expert approval.', current_date),
('WHO-EYE-CARE-GUIDE-2022', 'Eye care in health systems: guide for action', 'World Health Organization', 2022, 'https://www.who.int/publications/i/item/9789240050068', 'Reference source only; clinical content requires local expert approval.', current_date),
('INDIA-NPCBVI-DGHS', 'NPCBVI Ophthalmology Division', 'DGHS, Ministry of Health and Family Welfare, Government of India', null, 'https://dghs.mohfw.gov.in/opthalmology-division.php', 'Validate current local operating guidance, service data, and reuse conditions.', current_date)
on conflict (source_id) do nothing;

insert into clinical_pathway (pathway_id, title, status, dataset_version, scope, reviewer_name, approved_on, created_on) values
('draft-demo-urgent-warning-signs-v1', 'Simulated urgent warning-sign pathway — demo only', 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE', 'demo-v1', 'Demonstration only. Not a clinical protocol and not clinically approved.', null, null, current_date),
('draft-demo-routine-vision-check-v1', 'Simulated routine vision-check pathway — demo only', 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE', 'demo-v1', 'Demonstration only. Not a clinical protocol and not clinically approved.', null, null, current_date),
('draft-demo-human-support-v1', 'Simulated human-support pathway — demo only', 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE', 'demo-v1', 'Demonstration only. Not a clinical protocol and not clinically approved.', null, null, current_date)
on conflict (pathway_id) do nothing;

insert into clinical_pathway_source (pathway_id, source_id) values
('draft-demo-urgent-warning-signs-v1', 'WHO-VESIH-2024'),
('draft-demo-urgent-warning-signs-v1', 'WHO-PECI-2022'),
('draft-demo-routine-vision-check-v1', 'WHO-VESIH-2024'),
('draft-demo-routine-vision-check-v1', 'WHO-EYE-CARE-GUIDE-2022'),
('draft-demo-human-support-v1', 'WHO-PECI-2022'),
('draft-demo-human-support-v1', 'INDIA-NPCBVI-DGHS')
on conflict do nothing;

insert into clinical_criterion (pathway_id, criterion_type, input_code) values
('draft-demo-urgent-warning-signs-v1', 'URGENT_IF_ANY', 'SUDDEN_VISION_CHANGE'),
('draft-demo-urgent-warning-signs-v1', 'URGENT_IF_ANY', 'SEVERE_PAIN'),
('draft-demo-urgent-warning-signs-v1', 'URGENT_IF_ANY', 'INJURY_OR_CHEMICAL'),
('draft-demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'REDNESS_OR_DISCHARGE'),
('draft-demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'BLURRY_VISION'),
('draft-demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'READING_OR_DISTANCE_DIFFICULTY'),
('draft-demo-routine-vision-check-v1', 'ROUTINE_IF_ANY', 'EYE_CHECK_OR_GLASSES'),
('draft-demo-human-support-v1', 'ESCALATE_IF_ANY', 'OTHER'),
('draft-demo-human-support-v1', 'ESCALATE_IF_ANY', 'NOT_SURE')
on conflict do nothing;

-- Step 3A is optional background context in this demo. It is passed to the
-- guidance retrieval request but must not silently override the route that
-- Java determined from the current symptoms and explicit support request.
-- This cleanup also removes rules seeded by earlier demo versions.
delete from clinical_criterion
where pathway_id = 'draft-demo-human-support-v1'
  and criterion_type = 'ESCALATE_IF_ANY'
  and input_code in ('PREVIOUS_EYE_SURGERY', 'PREVIOUS_EYE_INJURY', 'ONGOING_EYE_TREATMENT');

insert into clinical_guidance (pathway_id, route, language, guidance_type, guidance_text, status) values
('draft-demo-urgent-warning-signs-v1', 'URGENT', 'bn', 'PATIENT_NEXT_STEPS', 'আপনার দেওয়া তথ্য অনুযায়ী আজই জরুরি চোখের চিকিৎসাসেবা নেওয়া গুরুত্বপূর্ণ। দেরি করবেন না। সম্ভব হলে পরিবারের একজন বিশ্বস্ত সদস্যকে সঙ্গে নিন।', 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE'),
('draft-demo-routine-vision-check-v1', 'ROUTINE', 'bn', 'PATIENT_NEXT_STEPS', 'আপনার নির্বাচিত লক্ষণগুলোর জন্য জরুরি সতর্ক-লক্ষণ না থাকলে আগামী কয়েক দিনের মধ্যে নিকটবর্তী ভিশন সেন্টার বা চোখের ক্লিনিকে চোখ পরীক্ষা করান; যাওয়ার আগে সময় নিশ্চিত করুন।', 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE'),
('draft-demo-human-support-v1', 'HUMAN_SUPPORT', 'bn', 'PATIENT_NEXT_STEPS', 'এই ডেমো তথ্যে আরও সহায়তার প্রয়োজন হলে স্বাস্থ্যকর্মী বা চোখের সেবাকেন্দ্রের সহায়তার পথ দেখানো হয়।', 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE')
on conflict do nothing;

-- Existing local databases may already contain the original draft seed.
-- Upgrade all three local simulated pathways consistently for the capstone
-- demonstration. Production still requires qualified clinical approval.
update clinical_pathway
set status = 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE',
    title = case pathway_id
      when 'draft-demo-urgent-warning-signs-v1' then 'Simulated urgent warning-sign pathway — demo only'
      when 'draft-demo-routine-vision-check-v1' then 'Simulated routine vision-check pathway — demo only'
      when 'draft-demo-human-support-v1' then 'Simulated human-support pathway — demo only'
      else title end,
    dataset_version = 'demo-v1',
    scope = 'Demonstration only. Not a clinical protocol and not clinically approved.',
    reviewer_name = null,
    approved_on = null
where pathway_id in ('draft-demo-urgent-warning-signs-v1', 'draft-demo-routine-vision-check-v1', 'draft-demo-human-support-v1');

update clinical_guidance
set status = 'DEMO_SIMULATED_NOT_FOR_CLINICAL_USE',
    guidance_text = case pathway_id
      when 'draft-demo-urgent-warning-signs-v1' then 'আপনার দেওয়া তথ্য অনুযায়ী আজই জরুরি চোখের চিকিৎসাসেবা নেওয়া গুরুত্বপূর্ণ। দেরি করবেন না। সম্ভব হলে পরিবারের একজন বিশ্বস্ত সদস্যকে সঙ্গে নিন।'
      when 'draft-demo-routine-vision-check-v1' then 'আপনার নির্বাচিত লক্ষণগুলোর জন্য জরুরি সতর্ক-লক্ষণ না থাকলে আগামী কয়েক দিনের মধ্যে নিকটবর্তী ভিশন সেন্টার বা চোখের ক্লিনিকে চোখ পরীক্ষা করান; যাওয়ার আগে সময় নিশ্চিত করুন।'
      when 'draft-demo-human-support-v1' then 'এই ডেমো তথ্যে আরও সহায়তার প্রয়োজন হলে স্বাস্থ্যকর্মী বা চোখের সেবাকেন্দ্রের সহায়তার পথ দেখানো হয়।'
      else guidance_text end
where pathway_id in ('draft-demo-urgent-warning-signs-v1', 'draft-demo-routine-vision-check-v1', 'draft-demo-human-support-v1');
