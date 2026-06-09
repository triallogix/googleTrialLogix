const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const cacheDeclaration = `let trialRulesCache: Record<string, TrialRules & { cached_at: string, nct_id: string }> = {};

// -----------------------------------------------------------------------
// API ROUTE: Search ClinicalTrials.gov and Structure standard rules with Gemini`;

content = content.replace(
  /\/\/ -----------------------------------------------------------------------\n\/\/ API ROUTE: Search ClinicalTrials\.gov and Structure standard rules with Gemini/g, 
  cacheDeclaration
);

// We need to fetch patient_id as well
const getSearchTrialsLine = 'const { condition, pageSize, pageToken } = req.query;';
const getSearchTrialsReplacement = `const { condition, pageSize, pageToken, patient_id } = req.query;`;
content = content.replace(getSearchTrialsLine, getSearchTrialsReplacement);

// Pre-filtering logic replacement
const preFilterStr = `const rawStudies = ctData.studies || [];
      const resNextPageToken = ctData.nextPageToken || null;

      const patientIdParam = typeof patient_id === "string" ? patient_id : undefined;
      let targetPatient: any = undefined;
      if (patientIdParam) {
        targetPatient = patientStore.find((p) => p.patient_id === patientIdParam);
      }

      // Pre-filter before Gemini (Invert the Pipeline Order)
      const preFilteredStudies = rawStudies.filter(study => {
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

content = content.replace(`for (const study of rawStudies) {`, `for (const study of preFilteredStudies) {`);

// Now replacing Gemini caching logic
const localExtractFindStr = `// Extract rules locally/heuristically (non-blocking)
        let extractedRules = locallyExtractTrialRules(eligibilityCriteria, formattedCondition);

        // Run Gemini on the first 2 fetched trials of this specific load request to structures them safely
        const runGemini = trialIndex < 2;
        trialIndex++;

        if (currentGeminiKey && runGemini) {
          try {
            addOrchestratorLog("INFO", "Vertex AI Engine", \`Instructing Vertex AI gemini-3.5-flash to extract eligibility parameters from trial: \${nctId}\`);
            console.log(\`[Gemini Rule Extractor] Parsing protocol for \${nctId}...\`);
            const criteriaSample = eligibilityCriteria.substring(0, 3500); // safety cap`;

const localExtractReplaceStr = `// Extract rules locally/heuristically (non-blocking) fallback
        let extractedRules = locallyExtractTrialRules(eligibilityCriteria, formattedCondition);

        // Pre-Filtering and caching (FIX 2)
        if (trialRulesCache[nctId]) {
          addOrchestratorLog("INFO", "Rule Cache", \`Cache HIT for \${nctId} — skipping Gemini extraction.\`);
          extractedRules = trialRulesCache[nctId];
        } else if (currentGeminiKey) {
          try {
            addOrchestratorLog("INFO", "Vertex AI Engine", \`Instructing Vertex AI gemini-3.5-flash to extract eligibility parameters from trial: \${nctId}\`);
            console.log(\`[Gemini Rule Extractor] Parsing protocol for \${nctId}...\`);
            const criteriaSample = eligibilityCriteria.substring(0, 3500); // safety cap`;

content = content.replace(localExtractFindStr, localExtractReplaceStr);

const geminiResponseParseStr = `extractedRules = {
                required_conditions: parsedResult.required_conditions || [sanitizedCondition],
                excluded_conditions: parsedResult.excluded_conditions || ["Brain Metastasis"],
                required_biomarkers: parsedResult.required_biomarkers || [],
                max_ecog: typeof parsedResult.max_ecog === "number" ? parsedResult.max_ecog : 1,
                max_creatinine: typeof parsedResult.max_creatinine === "number" ? parsedResult.max_creatinine : 1.5,
                max_alt: typeof parsedResult.max_alt === "number" ? parsedResult.max_alt : 45.0,
                required_prior_pd1_exclusion: Boolean(parsedResult.required_prior_pd1_exclusion),
                min_cd4: typeof parsedResult.min_cd4 === "number" ? parsedResult.min_cd4 : undefined,
                max_viral_load: typeof parsedResult.max_viral_load === "number" ? parsedResult.max_viral_load : undefined,
                requires_art: parsedResult.requires_art !== undefined ? Boolean(parsedResult.requires_art) : undefined
              };
              addOrchestratorLog("SUCCESS", "Vertex AI Engine", \`Structured parameters successfully for \${nctId}: max ECOG=\${extractedRules.max_ecog}, max Creatinine=\${extractedRules.max_creatinine}\`);
            }
          } catch (gpErr) {
            addOrchestratorLog("WARN", "Vertex AI Engine", \`Applied deterministic safety boundaries for \${nctId} due to parsing exception / rate-limit fallback.\`);
            console.error(\`[Gemini Parsing Error] Non-blocking fallback applied for \${nctId}:\`, gpErr);
          }
        } else if (runGemini) {
          addOrchestratorLog("INFO", "Google ADK Orchestrator", \`Skipped api-key check for \${nctId}; using high-precision local rule parser.\`);
        }`;


const geminiResponseParseReplaceStr = `extractedRules = {
                required_conditions: parsedResult.required_conditions || [sanitizedCondition],
                excluded_conditions: parsedResult.excluded_conditions || ["Brain Metastasis"],
                required_biomarkers: parsedResult.required_biomarkers || [],
                max_ecog: typeof parsedResult.max_ecog === "number" ? parsedResult.max_ecog : 1,
                max_creatinine: typeof parsedResult.max_creatinine === "number" ? parsedResult.max_creatinine : 1.5,
                max_alt: typeof parsedResult.max_alt === "number" ? parsedResult.max_alt : 45.0,
                required_prior_pd1_exclusion: Boolean(parsedResult.required_prior_pd1_exclusion),
                min_cd4: typeof parsedResult.min_cd4 === "number" ? parsedResult.min_cd4 : undefined,
                max_viral_load: typeof parsedResult.max_viral_load === "number" ? parsedResult.max_viral_load : undefined,
                requires_art: parsedResult.requires_art !== undefined ? Boolean(parsedResult.requires_art) : undefined
              };
              
              trialRulesCache[nctId] = {
                ...extractedRules,
                cached_at: new Date().toISOString(),
                nct_id: nctId
              };
              
              addOrchestratorLog("SUCCESS", "Vertex AI Engine", \`Structured parameters successfully for \${nctId}: max ECOG=\${extractedRules.max_ecog}, max Creatinine=\${extractedRules.max_creatinine}\`);
            }
          } catch (gpErr) {
            addOrchestratorLog("WARN", "Vertex AI Engine", \`Applied deterministic safety boundaries for \${nctId} due to parsing exception / rate-limit fallback.\`);
            console.error(\`[Gemini Parsing Error] Non-blocking fallback applied for \${nctId}:\`, gpErr);
          }
        } else {
          addOrchestratorLog("INFO", "Google ADK Orchestrator", \`Skipped api-key check for \${nctId}; using high-precision local rule parser.\`);
        }`;

content = content.replace(geminiResponseParseStr, geminiResponseParseReplaceStr);

fs.writeFileSync('server.ts', content);
console.log('Script ran!');
