import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add states
const regexVars = /const \[showDlpModal, setShowDlpModal\] = useState<boolean>\(false\);/;
const replacementVars = `const [showDlpModal, setShowDlpModal] = useState<boolean>(false);
  const [duplicatePatient, setDuplicatePatient] = useState<any | null>(null);
  const [ingestedRawText, setIngestedRawText] = useState<string>("");`;
content = content.replace(regexVars, replacementVars);

// 2. Add handleSaveParsedProfile
const regexAction = /\/\/ ==========================================\n\s*\/\/ ONBOARD FORM ACTION: PDF\/Clinical Report Upload Parser/;
const replacementAction = `  const handleSaveParsedProfile = async () => {
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

  // ==========================================
  // ONBOARD FORM ACTION: PDF/Clinical Report Upload Parser`;
content = content.replace(regexAction, replacementAction);

// 3. Update handleParseClinicalNote
const regexHandleStr = `      setParsedOriginal(data.originalProfile);
      setParsedAnonymized(data.anonymizedProfile);
      setShowDlpModal(true);
      showToast("DLP scan completed! Side-by-side PII scrubbed.", "success");
      
      // Clear file states
      setNoteFileBase64("");
      setNoteFileMimeType("");
      setNoteFileName("");
      setMergePatientId("");

      // Reload the global patients list so the new patient is immediately listed
      await loadRecords();
      
      // Select the newly parsed patient automatically
      if (data.originalProfile && data.originalProfile.patient_id) {
        setSelectedPatientId(data.originalProfile.patient_id);
      }`;

const replacedHandleStr = `      setParsedOriginal(data.originalProfile);
      setParsedAnonymized(data.anonymizedProfile);
      setDuplicatePatient(data.duplicatePatient || null);
      setIngestedRawText(data.extractedText || "");
      setShowDlpModal(true);
      showToast("DLP scan completed! Please review parsed data against duplications.", "success");
      
      // Clear file states
      setNoteFileBase64("");
      setNoteFileMimeType("");
      setNoteFileName("");
      setMergePatientId("");`;
content = content.replace(regexHandleStr, replacedHandleStr);

// 4. Update Modal UI exactly line by line
const regexModalHeader = `<div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2.5">`;
const replacedModalHeader = `{duplicatePatient && (
                <div className="bg-amber-100/50 border-b border-amber-300 text-amber-900 px-5 py-3 text-sm font-medium tracking-tight flex items-start gap-4">
                  <span className="text-xl mt-0.5">⚠️</span>
                  <div>
                    <h4 className="font-bold text-amber-800">Duplication Warning: Matching Patient Exists</h4>
                    <p className="text-amber-700/90 text-xs mt-1 leading-relaxed">
                      A patient matching this demographic/clinical fingerprint already exists (<strong className="font-mono bg-amber-200/50 px-1.5 py-0.5 rounded">{duplicatePatient.patient_id}</strong> - {duplicatePatient.name}). 
                      Confirming below will <u>update and merge</u> this record.
                    </p>
                  </div>
                </div>
              )}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2.5">`;
content = content.replace(regexModalHeader, replacedModalHeader);

const regexModalButton = `<button
                  type="button"
                  onClick={() => setShowDlpModal(false)}
                  className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer transition border border-slate-700 font-bold"
                >
                  Onload & Dismiss
                </button>`;
const replacedModalButton = `<div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowDlpModal(false)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer transition border border-slate-600 font-bold">
                    Cancel
                  </button>
                  {duplicatePatient ? (
                    <button type="button" onClick={handleSaveParsedProfile} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white text-xs rounded-lg cursor-pointer transition shadow-sm font-bold flex items-center gap-2">
                      <span>Merge into Existing Record</span>
                    </button>
                  ) : (
                    <button type="button" onClick={handleSaveParsedProfile} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs rounded-lg cursor-pointer transition shadow-sm font-bold flex items-center gap-2">
                      <span>Confirm & Enroll Profile</span>
                    </button>
                  )}
                </div>`;
content = content.replace(regexModalButton, replacedModalButton);

fs.writeFileSync('src/App.tsx', content);

console.log('Patch complete.');
