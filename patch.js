
import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regexVars = /const \[showDlpModal, setShowDlpModal\] = useState<boolean>\(false\);/;
const replacementVars = `const [showDlpModal, setShowDlpModal] = useState<boolean>(false);
  const [duplicatePatient, setDuplicatePatient] = useState<any | null>(null);
  const [ingestedRawText, setIngestedRawText] = useState<string>("");`;
content = content.replace(regexVars, replacementVars);

const regexHandle = /setParsedOriginal\(data\.originalProfile\);\s*setParsedAnonymized\(data\.anonymizedProfile\);\s*setShowDlpModal\(true\);\s*showToast\("DLP scan completed! Side-by-side PII scrubbed.", "success"\);[\s\S]*?setSelectedPatientId\(data\.originalProfile\.patient_id\);\s*\}/;
const replacementHandle = `setParsedOriginal(data.originalProfile);
      setParsedAnonymized(data.anonymizedProfile);
      setDuplicatePatient(data.duplicatePatient || null);
      setIngestedRawText(data.extractedText || "");
      setShowDlpModal(true);
      showToast("DLP scan completed! Please review parsed data against duplications.", "success");
      
      // Clear file states
      setNoteFileBase64("");
      setNoteFileMimeType("");
      setNoteFileName("");
      setMergePatientId("");
    `;
content = content.replace(regexHandle, replacementHandle);

const confirmFunc = `
  const handleSaveParsedProfile = async () => {
    if (!parsedOriginal) return;
    try {
      showToast("Saving evaluated profile to registry...", "info");
      const res = await fetch("/api/patients/save-parsed-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          parsedProfile: parsedOriginal,
          rawText: ingestedRawText,
          isUpdating: !!duplicatePatient || false
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save profile");
      }
      
      showToast("Patient successfully added/updated in registry.", "success");
      setShowDlpModal(false);
      setDuplicatePatient(null);
      
      await loadRecords();
      setSelectedPatientId(parsedOriginal.patient_id);
    } catch(err: any) {
      showToast(err.message, "error");
    }
  };
`;
content = content.replace(/\/\/ ==========================================\n\s*\/\/ ONBOARD FORM ACTION: PDF\/Clinical Report Upload Parser/, confirmFunc + "\n  // ==========================================\n  // ONBOARD FORM ACTION: PDF/Clinical Report Upload Parser");

content = content.replace(
  /<button\s*type="button"\s*onClick=\{.*?setShowDlpModal.*?\}\s*class.*?Onload & Dismiss.*?<\/button>/is,
  `<button type="button" onClick={() => setShowDlpModal(false)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition mr-2">Cancel Analysis</button><button type="button" onClick={handleSaveParsedProfile} className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer transition shadow-sm font-bold">{duplicatePatient ? "Merge & Save Patient" : "Confirm & Enroll Profile"}</button>`
);

const banner = `{duplicatePatient && (
  <div className="bg-amber-100/50 border border-amber-300 text-amber-900 px-4 py-2 text-xs mb-4 rounded-xl font-medium tracking-tight">
    ⚠️ <strong>Duplication Warning:</strong> A patient matching this demographic/clinical fingerprint already exists (<span className="opacity-80 mx-1">{duplicatePatient.patient_id} - {duplicatePatient.name}</span>). Confirming below will <u>update</u> and merge this record instead of creating a brand new one.
  </div>
)}`;

content = content.replace(
  /\{\s*showDlpModal && parsedOriginal && parsedAnonymized && \(\s*<div.*?<motion\.div.*?>\s*\{\s*\/\* Header Box \*\/\s*\}/s,
  `{showDlpModal && parsedOriginal && parsedAnonymized && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-4xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-5 pt-3 bg-slate-900">${banner}</div>
              {/* Header Box */}`
);

fs.writeFileSync('src/App.tsx', content);
