import { useMemo, useState } from 'react';
import { caregiverSummary, evaluate } from './api';
import type { CaregiverSummary, Concern, Outcome } from './api';

type Screen = 'welcome' | 'concerns' | 'urgentCheck' | 'decision' | 'urgent' | 'urgentLocation' | 'urgentPermission' | 'urgentArea' | 'urgentFacilities' | 'urgentShare' | 'urgentEnd' | 'routineDetails' | 'routineResult' | 'serviceDirection' | 'aiSupport' | 'human' | 'humanOptions' | 'humanServices';
type Choice = { id: Concern; bn: string; en: string; urgent?: boolean };
type PatientField = 'name' | 'age' | 'address' | 'phone';
type PatientDetails = Record<PatientField, string>;

const choices: Choice[] = [
  { id: 'SUDDEN_VISION_CHANGE', bn: 'হঠাৎ দৃষ্টি কমে গেছে বা দেখতে পাচ্ছেন না', en: 'Sudden loss or change in vision', urgent: true },
  { id: 'SEVERE_PAIN', bn: 'চোখে তীব্র ব্যথা', en: 'Severe eye pain', urgent: true },
  { id: 'INJURY_OR_CHEMICAL', bn: 'চোখে আঘাত লেগেছে বা রাসায়নিক পড়েছে', en: 'Eye injury or chemical exposure', urgent: true },
  { id: 'REDNESS_OR_DISCHARGE', bn: 'চোখ লাল, জ্বালা করছে বা পানি/পুঁজ পড়ছে', en: 'Redness, irritation, or discharge' },
  { id: 'BLURRY_VISION', bn: 'ধীরে ধীরে ঝাপসা দেখছি', en: 'Gradually blurry vision' },
  { id: 'OTHER', bn: 'আমি নিশ্চিত নই / অন্য সমস্যা', en: 'I am not sure / another concern' }
];
const urgentChoices = choices.filter(choice => choice.urgent);
choices.splice(0, choices.length,
  ...choices.filter(choice => !choice.urgent),
  { id: 'READING_OR_DISTANCE_DIFFICULTY', bn: 'পড়তে, দূরের জিনিস দেখতে বা মুখ চিনতে অসুবিধা হচ্ছে', en: 'Difficulty reading, seeing at a distance, or recognising faces' },
  { id: 'EYE_CHECK_OR_GLASSES', bn: 'চশমা লাগবে কি না জানতে বা চোখ পরীক্ষা করাতে চাই', en: 'I need glasses or an eye check-up' }
);
const blurryVision = choices.find(choice => choice.id === 'BLURRY_VISION');
const rednessOrDischarge = choices.find(choice => choice.id === 'REDNESS_OR_DISCHARGE');
const otherProblem = choices.find(choice => choice.id === 'OTHER');
const suddenVisionChange = urgentChoices.find(choice => choice.id === 'SUDDEN_VISION_CHANGE');
const severePain = urgentChoices.find(choice => choice.id === 'SEVERE_PAIN');
const injuryOrChemical = urgentChoices.find(choice => choice.id === 'INJURY_OR_CHEMICAL');
if (blurryVision) { blurryVision.bn = 'ধীরে ধীরে ঝাপসা দেখছেন'; }
if (rednessOrDischarge) { rednessOrDischarge.bn = 'চোখ লাল হচ্ছে, চুলকাচ্ছে, জ্বালা করছে বা জল পড়ছে'; rednessOrDischarge.en = 'Redness, itching, irritation, or watery eyes'; }
if (otherProblem) { otherProblem.bn = 'অন্য কোনো সমস্যা আছে / ঠিক বুঝতে পারছি না'; otherProblem.en = 'Another problem / I am not sure'; }
if (suddenVisionChange) { suddenVisionChange.bn = 'হঠাৎ কম দেখছেন বা দেখতে পাচ্ছেন না'; suddenVisionChange.en = 'Sudden loss of vision or inability to see'; }
if (severePain) { severePain.bn = 'চোখে খুব বেশি ব্যথা হচ্ছে'; }
if (injuryOrChemical) { injuryOrChemical.bn = 'চোখে আঘাত লেগেছে বা কোনো রাসায়নিক জিনিস লেগেছে'; }
const facilities = [
  { name: 'নেত্রজ্যোতি ভিশন সেন্টার', en: 'NetraJyoti Vision Centre', place: 'ব্লক বাজার · Block market' },
  { name: 'জেলা চোখের ক্লিনিক', en: 'District eye clinic', place: 'জেলা সদর · District headquarters' }
];
const localitiesByDistrict: Record<string, { bn: string; en: string }[]> = {
  'North 24 Parganas': [
    { bn: 'বাগুইআটি', en: 'Baguiati' },
    { bn: 'বারাসত', en: 'Barasat' },
    { bn: 'বসিরহাট', en: 'Basirhat' }
  ],
  'South 24 Parganas': [
    { bn: 'বারুইপুর', en: 'Baruipur' },
    { bn: 'সোনারপুর', en: 'Sonarpur' },
    { bn: 'কাকদ্বীপ', en: 'Kakdwip' }
  ],
  Nadia: [
    { bn: 'কৃষ্ণনগর', en: 'Krishnanagar' },
    { bn: 'রানাঘাট', en: 'Ranaghat' },
    { bn: 'কল্যাণী', en: 'Kalyani' }
  ]
};

function speak(text: string) { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } }

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState<Concern[]>([]);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [aiSummary, setAiSummary] = useState<CaregiverSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [careConfirmed, setCareConfirmed] = useState(false);
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({ name: '', age: '', address: '', phone: '' });
  const [includePatientDetails, setIncludePatientDetails] = useState(false);
  const [humanLocationUsed, setHumanLocationUsed] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const selectedChoices = useMemo(() => choices.filter(choice => selected.includes(choice.id)), [selected]);
  const toggle = (id: Concern) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const isUrgent = selected.some(id => urgentChoices.some(choice => choice.id === id));
  const selectedShareSymptoms = [...urgentChoices, ...choices].filter(choice => selected.includes(choice.id));
  const urgentShareText = `NetraJyoti-এর তথ্য অনুযায়ী আজই জরুরি চোখের চিকিৎসাসেবা নেওয়ার পরামর্শ দেওয়া হচ্ছে।\n\nনির্বাচিত সমস্যা ও লক্ষণ / Selected concerns and symptoms:\n${selectedShareSymptoms.map(choice => `• ${choice.bn} / ${choice.en}`).join('\n')}\n\nসম্ভব হলে পরিবারের একজন সদস্য বা পরিচিত কাউকে সঙ্গে নিয়ে নিকটবর্তী চোখের হাসপাতাল বা জরুরি চিকিৎসাসেবায় যান। দেরি করবেন না।\nIf possible, go with a family member or someone you trust to a nearby eye hospital or urgent-care service. Do not delay.`;

  const routineCareMessage = aiSummary?.summaryBn ?? 'কয়েক দিনের মধ্যে চোখ পরীক্ষা করাতে ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন। যাওয়ার আগে পরিষেবার সময় নিশ্চিত করুন।';
  const patientDetailsText = includePatientDetails ? [['নাম / Name', patientDetails.name], ['বয়স / Age', patientDetails.age], ['ঠিকানা / Address', patientDetails.address], ['ফোন / Phone', patientDetails.phone]].filter(([, value]) => value.trim()).map(([label, value]) => `${label}: ${value}`).join('\n') : '';
  const caregiverShareText = `${routineCareMessage}\n\nনির্বাচিত সমস্যা ও লক্ষণ / Selected concerns and symptoms:\n${selectedShareSymptoms.map(choice => `• ${choice.bn} / ${choice.en}`).join('\n')}${patientDetailsText ? `\n\nরোগীর তথ্য / Patient details:\n${patientDetailsText}` : ''}\n\nপরবর্তী করণীয় / Next step: কয়েক দিনের মধ্যে ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন / Plan a visit to a vision centre or eye clinic in the next few days.`;

  function restart() { setScreen('welcome'); setConsent(false); setSelected([]); setNeedsHelp(false); setOutcome(null); setVoiceNote(''); setDistrict(''); setBlock(''); setShowAllFacilities(false); setCareConfirmed(false); setPatientDetails({ name: '', age: '', address: '', phone: '' }); setIncludePatientDetails(false); setSummaryGenerated(false); setHumanLocationUsed(false); setShareStatus(''); }
  async function requestCaregiverSummary() {
    setAiLoading(true);
    try { setAiSummary(await caregiverSummary()); }
    catch { setAiSummary({ summaryBn: 'কয়েক দিনের মধ্যে চোখ পরীক্ষা করাতে ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন। যাওয়ার আগে পরিষেবার সময় নিশ্চিত করুন।', source: 'APPROVED_FALLBACK' }); }
    finally { setAiLoading(false); setSummaryGenerated(true); }
  }
  function captureVoice() {
    type Recognition = { lang: string; interimResults: boolean; start: () => void; onresult: (event: { results: { 0: { 0: { transcript: string } } } }) => void; onerror: () => void };
    type RecognitionWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const RecognitionApi = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
    if (!RecognitionApi) { alert('Voice input is unavailable in this browser. Please type instead.'); return; }
    const recognition = new RecognitionApi(); recognition.lang = 'bn-IN'; recognition.interimResults = false;
    recognition.onresult = event => setVoiceNote(event.results[0][0].transcript);
    recognition.onerror = () => alert('We could not capture voice. Please type instead.'); recognition.start();
  }
  function requestCurrentLocation() {
    if (!navigator.geolocation) { setScreen('urgentArea'); return; }
    navigator.geolocation.getCurrentPosition(() => setScreen('urgentFacilities'), () => setScreen('urgentArea'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }
  function requestHumanLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(() => { setHumanLocationUsed(true); setScreen('humanServices'); }, () => alert('Location could not be used. Please select your district and town or city instead.'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }
  async function copyMessage(text: string) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(field);
        if (!copied) throw new Error('Copy unavailable');
      }
      setShareStatus('বার্তাটি কপি করা হয়েছে। / Message copied.');
    } catch { setShareStatus('বার্তাটি কপি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন। / Could not copy the message. Please try again.'); }
  }
  async function shareMessage(title: string, text: string) {
    if (navigator.share) {
      try { await navigator.share({ title, text }); setShareStatus('শেয়ার করার বিকল্প খোলা হয়েছে। / Sharing options opened.'); return; }
      catch (error) { if ((error as { name?: string }).name === 'AbortError') return; }
    }
    await copyMessage(text);
  }
  function capturePatientField(field: PatientField) {
    type Recognition = { lang: string; interimResults: boolean; start: () => void; onresult: (event: { results: { 0: { 0: { transcript: string } } } }) => void; onerror: () => void };
    type RecognitionWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const RecognitionApi = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
    if (!RecognitionApi) { alert('Voice input is unavailable in this browser. Please type instead.'); return; }
    const recognition = new RecognitionApi(); recognition.lang = 'bn-IN'; recognition.interimResults = false;
    recognition.onresult = event => { setPatientDetails(current => ({ ...current, [field]: event.results[0][0].transcript })); setSummaryGenerated(false); };
    recognition.onerror = () => alert('We could not capture voice. Please type instead.'); recognition.start();
  }
  async function choosePath() {
    setBusy(true);
    try { setOutcome(await evaluate(selected, needsHelp)); }
    catch { setOutcome(isUrgent ? 'URGENT' : needsHelp || selected.includes('OTHER') ? 'HUMAN_SUPPORT' : 'ROUTINE'); }
    finally { setBusy(false); }
  }
  function openOutcome() { if (outcome === 'URGENT') setScreen('urgent'); else if (outcome === 'ROUTINE') setScreen('routineDetails'); else setScreen('human'); }
  const urgentBanner = <div className="result-banner urgent">জরুরি: দেরি না করে চোখের চিকিৎসাসেবা নিন <small>Urgent: seek eye care without delay</small></div>;

  if (screen === 'welcome') return <Page><span className="eyebrow">Safe next steps</span><h1>চোখের সমস্যায়<br />সহজ ও নিরাপদ সহায়তা</h1><p className="english">Bengali-first eye-care guidance for clear, safe next steps.</p><Notice bn="জরুরি লক্ষণ থাকলে দেরি করবেন না।" en="Do not wait if there is sudden vision change, severe pain, injury, or chemical exposure." /><label className="consent"><span className="consent-instruction"><b>শুরু করতে নিচের সম্মতিতে টিক দিন।</b><small>Select the consent option to continue.</small></span><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span className="consent-copy"><b>NetraJyoti আমাকে নিরাপদ পরবর্তী পদক্ষেপ ও উপযুক্ত চোখের সেবার পথ বুঝতে সাহায্য করে।</b><small>NetraJyoti helps me understand safe next steps and the right path to suitable eye care.</small></span></label><Primary className="welcome-start" disabled={!consent} onClick={() => setScreen('concerns')}>শুরু করুন<small>Start safely</small></Primary>{!consent && <p className="consent-hint">সম্মতিতে টিক দিলে শুরু করতে পারবেন।<small>Select consent to start.</small></p>}</Page>;

  if (screen === 'concerns') return <Page back={() => setScreen('welcome')}><Step label="Step 2" bn="আপনার চোখের কী কী উপসর্গ আছে?" en="Which eye symptoms are you experiencing?" /><p className="selection-guidance"><b>এক বা একাধিক উপসর্গ বেছে নিন।</b><small>Select one or more symptoms.</small></p><ChoiceList choices={choices} selected={selected} toggle={toggle} /><div className="voice-card"><b>🎙️ আরও তথ্য বলতে চান?</b><span>Optional voice or text stays on this device and is not used for triage.</span><button className="voice-button" onClick={captureVoice}>বলুন <small>Tap to speak</small></button><textarea value={voiceNote} onChange={event => setVoiceNote(event.target.value)} placeholder="ঐচ্ছিক: এখানে লিখতে পারেন" /></div><Primary disabled={!selected.length} onClick={() => setScreen('urgentCheck')}>জরুরি লক্ষণ দেখুন<small>Check urgent warning signs</small></Primary></Page>;

  if (screen === 'urgentCheck') return <Page back={() => setScreen('concerns')}><Step label="Step 3" bn="জরুরি সতর্ক লক্ষণ আছে কি?" en="Urgent warning-sign check" urgent /><Notice bn="নিচের যেকোনো একটি থাকলে আজই চোখের সেবা নিন।" en="Any urgent sign routes you to urgent eye care today." /><ChoiceList choices={urgentChoices} selected={selected} toggle={toggle} urgent /><label className="help"><input type="checkbox" checked={needsHelp} onChange={event => setNeedsHelp(event.target.checked)} /><span>আমি নিশ্চিত নই / একজন সহায়তাকারীর সঙ্গে কথা বলতে চাই<small>I am not sure or I want support from a person.</small></span></label><Primary onClick={() => setScreen('decision')}>নিরাপদ পরবর্তী ধাপ দেখুন<small>View the safe next step</small></Primary></Page>;

  if (screen === 'decision') return <Page back={() => setScreen('urgentCheck')}><Step label="Step 4" bn="NetraJyoti নিরাপদ পরবর্তী পদক্ষেপ নির্ধারণ করছে" en="NetraJyoti is preparing safe guidance" /><div className="progress-checks"><div><i>✓</i><span><b>চোখের সমস্যার তথ্য নেওয়া হয়েছে</b><small>Eye-problem details have been received.</small></span></div><div><i>✓</i><span><b>জরুরি লক্ষণ যাচাই করা হয়েছে</b><small>Urgent warning signs have been checked.</small></span></div><div><i>✓</i><span><b>NetraJyoti নিরাপদ পরবর্তী পদক্ষেপ নির্ধারণ করছে</b><small>Preparing the most suitable safe guidance.</small></span></div></div>{outcome ? <><Notice bn={outcome === 'URGENT' ? 'NetraJyoti-এর নিরাপদ নির্দেশনা: আজই জরুরি চোখের সেবা নিন।' : outcome === 'ROUTINE' ? 'চোখ পরীক্ষা করানোর নিরাপদ নির্দেশনা প্রস্তুত হয়েছে।' : 'মানব সহায়তার নিরাপদ পথ প্রস্তুত হয়েছে।'} en={outcome === 'URGENT' ? 'NetraJyoti guidance: seek urgent eye care today.' : 'Safe guidance is ready.'} /><Primary onClick={openOutcome}>নিরাপদ নির্দেশনা দেখুন<small>View safe guidance</small></Primary></> : <Primary disabled={busy} onClick={choosePath}>{busy ? 'নিরাপদ নির্দেশনা প্রস্তুত করা হচ্ছে…' : 'নিরাপদ নির্দেশনা দেখুন'}<small>{busy ? 'Preparing safe guidance' : 'View safe guidance'}</small></Primary>}</Page>;

  if (screen === 'urgent') return <Page back={() => setScreen('decision')} urgent><Step label="5A" bn="এখনই চোখের চিকিৎসাসেবা নিন" en="Immediate action" /><div className="urgent-action-card"><span className="urgent-pill">জরুরি চিকিৎসা<small>Urgent care</small></span><div className="urgent-instruction"><b>আজই নিকটবর্তী চোখের হাসপাতাল বা জরুরি চিকিৎসাসেবায় যান।</b><small>Visit a nearby eye hospital or urgent-care service today.</small><hr /><strong>অপেক্ষা করবেন না। সম্ভব হলে পরিবারের কাউকে সঙ্গে নিন।</strong><small>Do not wait. If possible, ask a family member to accompany you.</small></div><Primary onClick={() => setScreen('urgentLocation')}>কাছাকাছি যাচাইকৃত সেবা খুঁজুন<small>Find verified care</small></Primary><Secondary onClick={() => setScreen('urgentShare')}>জরুরি বার্তা পরিবারের সঙ্গে ভাগ করুন<small>Share urgent message</small></Secondary><Secondary onClick={() => setScreen('urgentEnd')}>সরাসরি চিকিৎসাসেবা নিতে যান<small>Continue to care</small></Secondary></div></Page>;

  if (screen === 'urgentLocation') return <UrgentRoute label="5A.1" title="কাছাকাছি সেবা খুঁজতে চান?" subtitle="Would you like to find care nearby?" back={() => setScreen('urgent')}><div className="location-privacy"><b>আপনার অনুমতি ছাড়া বর্তমান অবস্থান ব্যবহার করা হবে না।</b><small>Your current location will not be used without your permission.</small></div><Primary onClick={() => setScreen('urgentPermission')}>বর্তমান অবস্থান ব্যবহার করুন<small>Use current location</small></Primary><Secondary onClick={() => setScreen('urgentArea')}>জেলা / ব্লক নির্বাচন করুন<small>Select district / block</small></Secondary><Secondary onClick={() => setScreen('urgentArea')}>প্রাথমিক স্বাস্থ্যকেন্দ্র (PHC) থেকে সহায়তা নিন<small>Get PHC guidance or referral</small></Secondary><Secondary onClick={() => setScreen('urgent')}>জরুরি ফলাফলে ফিরুন<small>Return to urgent result</small></Secondary></UrgentRoute>;

  if (screen === 'urgentPermission') return <UrgentRoute label="5A.2" title="বর্তমান অবস্থান ব্যবহার করতে দেবেন?" subtitle="Allow location access" back={() => setScreen('urgentLocation')}><div className="location-privacy"><b>কাছাকাছি যাচাইকৃত চোখের চিকিৎসাসেবা দেখানোর জন্য অবস্থান ব্যবহার করা হবে।</b><small>Your location is used only to show nearby verified eye-care services.</small></div><Primary onClick={requestCurrentLocation}>অনুমতি দিন<small>Allow and view services</small></Primary><Secondary onClick={() => setScreen('urgentArea')}>জেলা / ব্লক বেছে নিন<small>Select district / block</small></Secondary><Secondary onClick={() => setScreen('urgent')}>জরুরি ফলাফলে ফিরুন<small>Return to urgent result</small></Secondary></UrgentRoute>;

  if (screen === 'urgentArea') return <UrgentRoute label="5A.3" title="আপনার এলাকা বেছে নিন" subtitle="Select your district and block" back={() => setScreen('urgentLocation')}><select className="area-input area-select" value={district} onChange={event => { setDistrict(event.target.value); setBlock(''); }}><option value="">জেলা নির্বাচন করুন / Select district</option><option value="North 24 Parganas">উত্তর ২৪ পরগনা / North 24 Parganas</option><option value="South 24 Parganas">দক্ষিণ ২৪ পরগনা / South 24 Parganas</option><option value="Nadia">নদিয়া / Nadia</option></select><select className="area-input area-select" value={block} onChange={event => setBlock(event.target.value)} disabled={!district}><option value="">ব্লক / শহর নির্বাচন করুন / Select block or town</option><option value="Block market">ব্লক বাজার / Block market</option><option value="District town">জেলা শহর / District town</option></select><Primary disabled={!district || !block} onClick={() => setScreen('urgentFacilities')}>যাচাইকৃত সেবা দেখুন<small>View verified services</small></Primary><Secondary onClick={() => setScreen('urgent')}>জরুরি ফলাফলে ফিরুন<small>Return to urgent result</small></Secondary></UrgentRoute>;

  if (screen === 'urgentFacilities') return <UrgentRoute label="5A.4" title="আপনার এলাকার চোখের চিকিৎসাসেবা" subtitle="Verified care options" back={() => setScreen('urgentLocation')}><DemoNotice />{(showAllFacilities ? facilities : facilities.slice(0, 1)).map(facility => <Facility key={facility.en} verified {...facility} />)}<Primary onClick={() => { window.location.href = 'tel:+91330000000'; }}>হাসপাতালে ফোন করুন<small>Call hospital</small></Primary><Secondary onClick={() => setShowAllFacilities(true)}>আরও যাচাইকৃত সেবা দেখুন<small>Find more verified care</small></Secondary><Secondary onClick={() => setScreen('urgent')}>জরুরি ফলাফলে ফিরুন<small>Return to urgent result</small></Secondary></UrgentRoute>;

  if (screen === 'urgentShare') return <UrgentRoute label="5A.5" title="জরুরি বার্তা ভাগ করুন" subtitle="Share an urgent message" back={() => setScreen('urgent')}><div className="urgent-instruction"><b>NetraJyoti-এর তথ্য অনুযায়ী আজই জরুরি চোখের চিকিৎসাসেবা নেওয়ার পরামর্শ দেওয়া হচ্ছে।</b><small>Based on the information shared with NetraJyoti, urgent eye care is recommended today.</small></div><div className="selected-symptoms"><b>নির্বাচিত সমস্যা ও লক্ষণ</b><small>Selected concerns and symptoms</small><ul>{selectedShareSymptoms.map(choice => <li key={choice.id}>{choice.bn}<span>{choice.en}</span></li>)}</ul></div><Primary onClick={() => shareMessage('NetraJyoti urgent eye-care message', urgentShareText)}>শেয়ার করুন<small>Share</small></Primary><Secondary onClick={() => copyMessage(urgentShareText)}>কপি করুন<small>Copy</small></Secondary>{shareStatus && <p className="share-status" aria-live="polite">{shareStatus}</p>}<Secondary onClick={() => setScreen('urgentLocation')}>চোখের সেবার বিকল্প দেখুন<small>View eye-care options</small></Secondary><Secondary onClick={() => setScreen('urgent')}>জরুরি ফলাফলে ফিরুন<small>Return to urgent result</small></Secondary></UrgentRoute>;

  if (screen === 'urgentEnd') return <Page back={() => setScreen('urgent')} urgent><div className="urgent-route-card urgent-end-card"><Notice bn="জরুরি: দেরি না করে চোখের চিকিৎসাসেবা নিন" en="Urgent: seek eye care without delay" /><div className="urgent-end-label"><b>পরবর্তী করণীয়</b><small>Next action</small></div><h1>এখন চোখের চিকিৎসাসেবা নিন</h1>{careConfirmed ? <div className="care-confirmed"><b>আপনার সিদ্ধান্তের জন্য ধন্যবাদ। এখনই কাছের চোখের চিকিৎসাসেবায় যান।</b><small>Thank you. Please go to the nearest eye-care service now.</small></div> : <><div className="urgent-instruction"><b>আপনি সেবার তথ্য না দেখে এগিয়ে যাওয়ার সিদ্ধান্ত নিয়েছেন। দেরি না করে নিকটবর্তী চোখের হাসপাতাল বা জরুরি চিকিৎসাসেবায় যান।</b><small>You chose to continue without service details. Please go to the nearest eye hospital or urgent-care service now.</small></div><Primary onClick={() => setCareConfirmed(true)}>আমি এখন চিকিৎসাসেবা নেব<small>I will seek care now</small></Primary><Secondary onClick={() => setScreen('urgentLocation')}>কাছাকাছি সেবা খুঁজুন<small>Find nearby care</small></Secondary><Secondary onClick={() => setScreen('urgentShare')}>জরুরি বার্তা ভাগ করুন<small>Share urgent message</small></Secondary></>}<Secondary onClick={restart}>আবার শুরু করুন<small>Start again</small></Secondary></div></Page>;

  if (screen === 'routineDetails') return <Page back={() => setScreen('decision')}><Step label="5B" bn="আপনার এলাকার তথ্য দিন" en="Choose your district and town or city" /><p className="english">Choose your district first, then your town or city to receive relevant demo service direction. This does not affect the safety result.</p><select className="area-input area-select" value={district} onChange={event => { setDistrict(event.target.value); setBlock(''); }}><option value="">জেলা নির্বাচন করুন / Select district</option>{Object.keys(localitiesByDistrict).map(name => <option key={name} value={name}>{name === 'North 24 Parganas' ? 'উত্তর ২৪ পরগনা / North 24 Parganas' : name === 'South 24 Parganas' ? 'দক্ষিণ ২৪ পরগনা / South 24 Parganas' : 'নদিয়া / Nadia'}</option>)}</select><select className="area-input area-select" value={block} onChange={event => setBlock(event.target.value)} disabled={!district}><option value="">শহর / নগর নির্বাচন করুন / Select town or city</option>{(localitiesByDistrict[district] ?? []).map(place => <option key={place.en} value={place.en}>{place.bn} / {place.en}</option>)}</select><div className="voice-card"><b>🎙️ চাইলে চোখের সমস্যার বিষয়ে আরও বলুন</b><span>Optional. It does not change the safety result.</span><button className="voice-button" onClick={captureVoice}>বলুন <small>Tap to speak</small></button><textarea value={voiceNote} onChange={event => setVoiceNote(event.target.value)} placeholder="ঐচ্ছিক তথ্য / Optional detail" /></div><Primary disabled={!district || !block} onClick={() => setScreen('routineResult')}>নিরাপদ নির্দেশনা দেখুন<small>View safe guidance</small></Primary></Page>;

  if (screen === 'routineResult') return <Page back={() => setScreen('routineDetails')}><Step label="Step 6" bn="চোখ পরীক্ষা করানোর পরামর্শ" en="Your recommended next step" /><div className="routine-result-card"><span className="routine-result-label">পরবর্তী করণীয়<small>Next action</small></span><b>কয়েক দিনের মধ্যে ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন।</b><small>Plan a visit to a vision centre or eye clinic in the next few days. Confirm service hours before you go.</small></div><button className="listen" onClick={() => speak('কয়েক দিনের মধ্যে ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন।')}><span>▶ শুনুন</span><small>Listen</small></button><Primary onClick={() => setScreen('serviceDirection')}>পরিষেবার দিকনির্দেশনা দেখুন<small>View service direction</small></Primary></Page>;

  if (screen === 'serviceDirection') return <Page back={() => setScreen('routineResult')}><Step label="Step 7" bn="কোথায় যেতে পারেন" en="Service direction" /><SymptomSummary choices={selectedShareSymptoms} showNextStep /><DemoNotice />{facilities.map(facility => <Facility key={facility.en} {...facility} />)}<Secondary onClick={() => setScreen('aiSupport')}>পরিবারের জন্য বার্তা<small>Message for family</small></Secondary><TextButton onClick={restart}>আবার শুরু করুন · Start again</TextButton></Page>;

  if (screen === 'aiSupport') return <Page back={() => setScreen('serviceDirection')}><Step label="Step 8" bn="পরিবারের জন্য বার্তা" en="A clear message to help your family support you" /><div className="family-message-card"><span className="family-message-label">পরিবারের জন্য প্রস্তুত বার্তা<small>Ready-to-share family message</small></span><p>{routineCareMessage}</p></div><SymptomSummary choices={selectedShareSymptoms} showNextStep /><PatientDetailsForm details={patientDetails} includeDetails={includePatientDetails} onChange={(field, value) => { setPatientDetails(current => ({ ...current, [field]: value })); setSummaryGenerated(false); }} onVoice={capturePatientField} onIncludeChange={value => { setIncludePatientDetails(value); setSummaryGenerated(false); }} /><Primary onClick={requestCaregiverSummary}>{aiLoading ? 'বার্তা তৈরি হচ্ছে…' : 'পরিবারের জন্য বার্তা প্রস্তুত করুন'}<small>{aiLoading ? 'Creating message' : 'Prepare message for review'}</small></Primary>{summaryGenerated && <><SharePreview text={caregiverShareText} /><Secondary onClick={() => shareMessage('NetraJyoti family message', caregiverShareText)}>শেয়ার করুন<small>Share</small></Secondary><Secondary onClick={() => copyMessage(caregiverShareText)}>কপি করুন<small>Copy</small></Secondary>{shareStatus && <p className="share-status" aria-live="polite">{shareStatus}</p>}<div className="summary-exits"><TextButton onClick={() => setSummaryGenerated(false)}>তথ্য বা বার্তা সম্পাদনা করুন · Edit details or message</TextButton><TextButton onClick={() => setScreen('serviceDirection')}>পরিষেবার নির্দেশনায় ফিরুন · Return to service direction</TextButton></div></>}</Page>;

  if (screen === 'human') return <Page back={() => setScreen('decision')}><Step label="5C" bn="একজন স্বাস্থ্যকর্মীর সঙ্গে কথা বলুন" en="Get help from a person near you" /><div className="human-support-card"><span className="human-support-label">মানব সহায়তা<small>Human support</small></span><b>আপনাকে একা সিদ্ধান্ত নিতে হবে না। কাছের ASHA কর্মী, PHC বা চোখের সেবার পথ খুঁজে নিন।</b><small>You do not have to decide alone. Find a nearby ASHA worker, PHC, or eye-care route.</small></div><Primary onClick={() => setScreen('humanOptions')}>কাছের সহায়তা খুঁজুন<small>Find nearby support</small></Primary><Secondary onClick={restart}>আবার শুরু করুন<small>Start again</small></Secondary></Page>;

  if (screen === 'humanOptions') return <Page back={() => setScreen('human')}><Step label="5C.1" bn="আপনার এলাকা বেছে নিন" en="Choose your area for nearby support" /><p className="english">Select your district and town or city. Your precise home address is not needed.</p><select className="area-input area-select" value={district} onChange={event => { setDistrict(event.target.value); setBlock(''); setHumanLocationUsed(false); }}><option value="">জেলা নির্বাচন করুন / Select district</option>{Object.keys(localitiesByDistrict).map(name => <option key={name} value={name}>{name === 'North 24 Parganas' ? 'উত্তর ২৪ পরগনা / North 24 Parganas' : name === 'South 24 Parganas' ? 'দক্ষিণ ২৪ পরগনা / South 24 Parganas' : 'নদিয়া / Nadia'}</option>)}</select><select className="area-input area-select" value={block} onChange={event => { setBlock(event.target.value); setHumanLocationUsed(false); }} disabled={!district}><option value="">শহর / নগর নির্বাচন করুন / Select town or city</option>{(localitiesByDistrict[district] ?? []).map(place => <option key={place.en} value={place.en}>{place.bn} / {place.en}</option>)}</select><Secondary onClick={requestHumanLocation}>বর্তমান অবস্থান ব্যবহার করুন<small>Use current location instead</small></Secondary><Primary disabled={!humanLocationUsed && (!district || !block)} onClick={() => setScreen('humanServices')}>কাছের সহায়তা দেখুন<small>View nearby support</small></Primary></Page>;

  return <Page back={() => setScreen('humanOptions')}><Step label="5C.2" bn="কাছের সহায়তার পথ" en="Nearby people and services" /><div className="local-support-context"><b>{humanLocationUsed ? 'বর্তমান অবস্থানের ভিত্তিতে সহায়তার পথ' : `${district} · ${block}`}</b><small>{humanLocationUsed ? 'Based on your current location' : 'Based on your selected district and town or city'}</small></div><div className="support-option local"><b>ASHA কর্মীর সহায়তা</b><small>Ask the nearest PHC to connect you with an ASHA worker who can help you reach suitable eye care.</small><Secondary onClick={() => navigator.share?.({ title: 'NetraJyoti ASHA support request', text: `Please help me contact an ASHA worker near ${block || 'my area'} for eye-care guidance.` })}>ASHA সহায়তার অনুরোধ শেয়ার করুন<small>Share ASHA support request</small></Secondary></div><div className="support-option local"><b>প্রাথমিক স্বাস্থ্যকেন্দ্র (PHC)</b><small>Visit or contact the nearby PHC for guidance, referral, and help reaching an eye-care service.</small><Secondary onClick={() => setScreen('serviceDirection')}>চোখের সেবার পথ দেখুন<small>View eye-care direction</small></Secondary></div><div className="support-option local"><b>পরিবার বা পরিচিত যত্নদাতা</b><small>Share your symptoms and next step with someone you trust so they can help you reach care.</small><Secondary onClick={() => navigator.share?.({ title: 'NetraJyoti support request', text: `Please help me reach eye care. My area: ${district}${block ? `, ${block}` : ''}.` })}>সহায়তার অনুরোধ শেয়ার করুন<small>Share request for help</small></Secondary></div><Notice bn="লক্ষণ খারাপ হলে বা জরুরি মনে হলে দেরি না করে চিকিৎসাসেবা নিন।" en="Seek care today if symptoms worsen or feel urgent." /><TextButton onClick={() => setScreen('humanOptions')}>এলাকা পরিবর্তন করুন · Change area</TextButton><TextButton onClick={restart}>আবার শুরু করুন · Start again</TextButton></Page>;
}

function UrgentRoute({ label, title, subtitle, back, children }: { label: string; title: string; subtitle: string; back: () => void; children: React.ReactNode }) {
  return <Page back={back} urgent><div className="urgent-route-card"><Notice bn="জরুরি: দেরি না করে চোখের চিকিৎসাসেবা নিন" en="Urgent: seek eye care without delay" /><span className="eyebrow urgent-tag">{label}</span><h1>{title}</h1><p className="english">{subtitle}</p>{children}</div></Page>;
}

function Page({ children, back, urgent }: { children: React.ReactNode; back?: () => void; urgent?: boolean }) { return <main className="page"><header>{back ? <button className="back" onClick={back}>← ফিরে যান</button> : <span /> }<div className="brand"><i />NetraJyoti <small>AI</small></div><span className="support">সহায়তা</span></header><section className={`content ${urgent ? 'urgent-page' : ''}`}>{children}</section><footer>নিরাপদ তথ্য, রোগ নির্ণয় নয় <span>•</span> Safe information, not a diagnosis</footer></main>; }
function Step({ label, bn, en, urgent }: { label: string; bn: string; en: string; urgent?: boolean }) {
  const copy = label === 'Step 2'
    ? { bn: 'আপনার চোখে কী কী সমস্যা হচ্ছে?', en: 'Which eye symptoms are you experiencing?' }
    : label === 'Step 3'
      ? { bn: 'এর কোনোটি কি এখন হচ্ছে?', en: 'Is any of this happening right now?' }
      : { bn, en };
  return <><span className={`eyebrow ${urgent ? 'urgent-tag' : ''}`}>{label}</span><h1>{copy.bn}</h1><p className="english heading-support">{copy.en}</p></>;
}
function Notice({ bn, en }: { bn: string; en: string }) {
  const isWelcomeWarning = en.startsWith('Do not wait if there is sudden vision change');
  return <div className={`notice ${isWelcomeWarning ? 'welcome-warning' : ''}`}><strong>{bn}</strong><span>{en}</span></div>;
}
function Primary({ children, onClick, disabled, className = '' }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) { return <button className={`primary ${className}`} disabled={disabled} onClick={onClick}>{children}</button>; }
function Secondary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="secondary" onClick={onClick}>{children}</button>; }
function TextButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) { return <button className="text-button" onClick={onClick}>{children}</button>; }
function ChoiceList({ choices, selected, toggle, urgent }: { choices: Choice[]; selected: Concern[]; toggle: (id: Concern) => void; urgent?: boolean }) { return <div className={`choice-list ${urgent ? 'urgent-list' : ''}`}>{choices.map(choice => <label className={`choice ${selected.includes(choice.id) ? 'selected' : ''}`} key={choice.id}><input type="checkbox" checked={selected.includes(choice.id)} onChange={() => toggle(choice.id)} /><span><b>{choice.bn}</b><small>{choice.en}</small></span>{choice.urgent && <em>জরুরি</em>}</label>)}</div>; }
function DemoNotice() { return <div className="callout"><b>ডেমো তথ্য</b><br />যাওয়ার আগে পরিষেবার সময়, ঠিকানা ও খোলা থাকার তথ্য নিশ্চিত করুন।<span>Demo only. Confirm hours, address, and availability before travelling.</span></div>; }
function PatientDetailsForm({ details, includeDetails, onChange, onVoice, onIncludeChange }: { details: PatientDetails; includeDetails: boolean; onChange: (field: PatientField, value: string) => void; onVoice: (field: PatientField) => void; onIncludeChange: (include: boolean) => void }) {
  const fields: { id: PatientField; bn: string; en: string; type?: string }[] = [
    { id: 'name', bn: 'রোগীর নাম', en: 'Patient name' },
    { id: 'age', bn: 'বয়স', en: 'Age', type: 'text' },
    { id: 'address', bn: 'ঠিকানা', en: 'Address' },
    { id: 'phone', bn: 'ফোন নম্বর', en: 'Phone number', type: 'tel' }
  ];
  return <div className="patient-details-form"><b>পরিবারের সঙ্গে ভাগ করার জন্য রোগীর তথ্য <small>Optional patient details for sharing</small></b><span className="patient-details-note">এই তথ্য এই ডিভাইসেই থাকে এবং আপনি সম্মতি দিলে শুধু শেয়ার করা বার্তায় যুক্ত হবে।<small>These details stay on this device and are added only to the message you choose to share.</small></span><div className="patient-fields">{fields.map(field => <label key={field.id}><span>{field.bn}<small>{field.en}</small></span><div><input type={field.type ?? 'text'} value={details[field.id]} onChange={event => onChange(field.id, event.target.value)} /><button type="button" className="voice-button" onClick={() => onVoice(field.id)}>🎙 বলুন <small>Speak</small></button></div></label>)}</div><label className="patient-details-consent"><input type="checkbox" checked={includeDetails} onChange={event => onIncludeChange(event.target.checked)} /><span>শেয়ার করা বার্তায় এই তথ্য যুক্ত করতে আমি সম্মত।<small>I agree to include these details in the shared message.</small></span></label></div>;
}

function SharePreview({ text }: { text: string }) { return <section className="share-preview" aria-live="polite"><b>শেয়ার করার আগে বার্তাটি দেখে নিন<small>Review this message before sharing</small></b><pre>{text}</pre></section>; }

function SymptomSummary({ choices, showNextStep = false }: { choices: Choice[]; showNextStep?: boolean }) {
  if (!choices.length) return null;
  return <div className="selected-symptoms symptom-summary"><b>আপনার নির্বাচিত সমস্যা</b><small>Selected symptoms</small><ul>{choices.map(choice => <li key={choice.id}>{choice.bn}<span>{choice.en}</span></li>)}</ul>{showNextStep && <div className="summary-next-step"><b>পরবর্তী করণীয়</b><small>Next step: plan a visit to a vision centre or eye clinic within the next few days.</small></div>}</div>;
}

function Facility({ name, en, place, verified }: { name: string; en: string; place: string; verified?: boolean }) {
  const contact = en === 'NetraJyoti Vision Centre' ? '০৩৩-XXXXXXX / 033-XXXXXXX' : '০৩৩-XXXXXXY / 033-XXXXXXY';
  return <div className="facility">{verified && <span className="facility-tag">যাচাইকৃত<small>Verified</small></span>}<b>{name}</b><small>{en}<br />{place}{verified && <><br />ফোন / Phone: {contact}<br />সর্বশেষ যাচাই / Last verified: ১ অগাস্ট ২০২৬ / 1 August 2026</>}</small></div>;
}
