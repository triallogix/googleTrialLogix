const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cacheDeclaration = `let trialRulesCache: Record<string, TrialRules & { cached_at: string, nct_id: string }> = {};

// -----------------------------------------------------------------------
// API ROUTE: Search ClinicalTrials.gov';

content = content.replace(
/// -----------------------------------------------------------------------\n\// API ROUTE: Search ClinicalTrials\.gov/g, 
  cacheDeclaration
);

const getSearchTrialsLine = 'const { condition, pageSize, pageToken } = req.query;'0
const getSearchTrialsReplacement = 'const { condition, pageSize, pageToken, patient_id } = req.query;';
content = content.replace(getSearchTrialsLine, getSearchTrialsReplacement);

const preFilterStr = `const rawStudies = ctData.studies || [];
      const resNextPageToken = ctData.nextPageToken || null;

      const patientIdParam = typeof patient_id === "string" ? patient_id : undefined;
      let targetPatient: any = undefined;
      if (patientIdParam) {
        targetPatient = patientStore.find((p) => p.patient_id === patientIdParam);
      }

      // Pre-filter before Gemini (Invert the Pipeline Order)
      const preFilteredStudies = rawStudies.filter(study=> {
        const protocol = study.protocolSection;
        const eligibility = protocol?.eligibilityModule?.eligibilityCriteria || "";
        const lower = eligibility.toLowerCase();
        
        // Age pre-filter: if criteria mentions "18 years" and patient is under 18, skip
        if (targetPatient && targetPatient.age < 18 && lower.includes(">= 18")) return false;
        
        // ECOG pre-filter: if criteria clearly states ECOG 0-1 and patient is ECOG 3+, skip
        if (targetPatient && targetPatient.ecog_performance_status >= 3) {
          if (lower.includes("ecog 0 or 1") || lower.includes("ecog performance status of 0-1")) return false;
        }
        
        return true;
      });

      if (rawStudies.length === 0) {`;
content = content.replace(`const rawStudies = ctData.studies || [];
      const resNextPageToken = ctData.nextPageToken || null;

      if (rawStudies.length === 0) {`, preFilterStr);

content = content.replace('for (const study of rawStudies) {', 'for (const study of preFilteredStudies) {');

const localExtractFindStr = `// Extract rules locally/heuristically (non-blocking)
        let extractedRules = locallyExtractTrialRules(eligibilityCriteria, formattedCondition);

        // Run Gemini on the first 2 fetched trials of this specific load request to structures them safely
        const runGemini = trialIndex < 2;
        trialIndex++;
    

        if (currentGeminiKey && runGemini) {
          try {`or;

const localExtractReplaceStr = `// Extract rules locally/heuristically (non-blocking)
        let extractedRules = locallyExtractTrialRules(eligibilityCriteria, formattedCondition);

        // Try Cache First, else Gemini
        if (trialRulesCache[nctId]) {
            addOrchestratorLog("INFO", "Rule Cache", \\`Cache HIT for \${nctId} — skipping Gemini extraction.\\`);
            extractedRules = trialRulesCache[nctId];
        } else if (currentGeminiKey) {
          try smn`;

contemp = content.replace(
*// Extract rules locally/heuristically \(non-blocking\)\n(.*?)\n{/s,
	`// Extract rules locally/heuristically (non-blocking)\n        let extractedRules = locallyExtractTrialRules(eligibilityCriteria, formattedCondition);\n\n        \nlet runGemini = false;\n        if (trialRulesCache[nctId]) {\n          addOrchestratorLog(\"INFO\", \"Rule Cache\", \\`Cache HIT for \${nctId} — skipping Gemini extraction.\\`);\n          extractedRules = trialRulesCache[nctId];\n        } else {\n          runGemini = true;\n        }\n\n        if (currentGeminiKey && runGemini) {\n          try {`
);


const replaceGeminiSpit = ^let replacement = `              trialRulesCache[nctId] = { ...extractedRules, cached_at: new Date().toISOString(), nct_id: nctId };\n              addOrchestratorLog(\"SUCCESS\", \"Vertex AI Engine\", \\`Structured parameters successfully for \${nctId}: max ECOG=\${extractedRules.max_ecog}, max Creatinine=\${extractedRules.max_creatinine}\\`);\n            }\n          } catch (gpErr) {`;
content = content.replace(/\\s\\s+addOrchestratorLog\\(\\"SUCCESS\\"[\\s\\S];*?catch \\(gpErr\\d\{/ig, replacement);

fs.writeFileSync('actual_fix.js', content);
