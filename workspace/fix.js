const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const promptText = `Generate a highly professional, clinical referral and eligibility screening memo\.[\s\S]*?Keep language respectful, scientific, and trace performance metrics\.`;/;

// For Fix 1 let's actually double check if it applied correctly.
const fix1Regex = /const deterministicResult = scoreTrial\(patient as any, trial as any\);/;
if (!fix1Regex.test(content)) {
    // Attempting to apply fix 1 again
    const oldFix1Regex = /const promptText = `Evaluate oncology patient clinical suitability for trial protocol\.[\s\S]*?Use plain text such as '>=' and 'mcL'\.`;/;
    
    const newFix1 = `// FIX 1: Run deterministic engine first to provide score consistency 
      const deterministicResult = scoreTrial(patient as any, trial as any);

      const promptText = \`Evaluate oncology patient clinical suitability for trial protocol.
A deterministic scoring engine has already evaluated this patient-trial pair and produced the following verified score breakdown. 
Your task is to explain the reasoning behind this clinical score, what the data gaps mean for screening, and what the clinician should do next.

DETERMINISTIC SCORE (DO NOT MODIFY THESE VALUES):
- Final Score: \${deterministicResult.score}/100
- Status: \${deterministicResult.match_status}
- Disease & Refractory: \${deterministicResult.score_breakdown.categories?.disease_and_refractory?.earned}/\${deterministicResult.score_breakdown.categories?.disease_and_refractory?.max}
- Biomarker & Molecular: \${deterministicResult.score_breakdown.categories?.biomarker_molecular?.earned}/\${deterministicResult.score_breakdown.categories?.biomarker_molecular?.max}
- Performance & Labs: \${deterministicResult.score_breakdown.categories?.performance_and_labs?.earned}/\${deterministicResult.score_breakdown.categories?.performance_and_labs?.max}
- Logistics & Geography: \${deterministicResult.score_breakdown.categories?.logistics_geography?.earned}/\${deterministicResult.score_breakdown.categories?.logistics_geography?.max}

SCORE RATIONALE (from engine):
\${JSON.stringify(deterministicResult.chain_of_reasoning.slice(0, 10), null, 2)}

DATA GAPS IDENTIFIED BY ENGINE:
\${deterministicResult.data_gaps.join("; ")}

Patient Details:
- ID: \${patient.patient_id}
- Diagnostics: \${JSON.stringify(patient.diagnoses)}
- Genomes: \${JSON.stringify(patient.biomarkers)}
- Physical state (ECOG): \${patient.ecog_performance_status}
- Biochemistry: \${JSON.stringify(patient.lab_values)}
- Prior lines: \${JSON.stringify(patient.prior_treatments)}
- Washout period: \${patient.last_therapy_days_ago} days

Trial Protocol:
- NCT: \${trial.nct_id}
- Inclusions: "\${trial.inclusion_criteria}"
- Exclusions: "\${trial.exclusion_criteria}"

Provide:
1. Criteria matching analysis (Citations of exact biochemistry and biomarkers).
2. Protocol eligibility barriers or risks.
3. Logical final suitability score justification.
Respond in clear, robust markdown formatting. CRITICAL: Do NOT use LaTeX math formatting (like \\ge or \\mu). Use plain text such as '>=' and 'mcL'.\`;`;

    content = content.replace(oldFix1Regex, newFix1);
    console.log("Applied Fix 1 via script.");
}


const replacement = `// FIX 6: Connect the Referral Memo Generator to the Deterministic Score
      const deterministicResult = scoreTrial(patient as any, trial as any);
      const promptText = \`Generate a highly professional, clinical referral and eligibility screening memo.
The memo has to clear details for a transplant / oncology screening coordinator detailing a potential match.

CRITICAL: Include this exact deterministic eligibility score in the memo justification: \${deterministicResult.score}/100.

Patient profile:
- Name: \${patient.name} (Age: \${patient.age}, Sex: \${patient.sex})
- Main diagnosis: \${JSON.stringify(patient.diagnoses)}
- Biomarkers: \${JSON.stringify(patient.biomarkers)}
- Relevant labs: Creatinine \${patient.lab_values.creatinine} mg/dL, ALT \${patient.lab_values.ALT} U/L, ANC \${patient.lab_values.ANC} K/uL
- Washout status: \${patient.last_therapy_days_ago} days off previous systemic regimens.

Trial details:
- Sponsor: \${trial.sponsor}
- Protocol Title: \${trial.title}
- NCT identifier: \${trial.nct_id}
- Phase: \${trial.phase}
- Interventions: \${trial.interventions.join(", ")}
- Target Locations: \${JSON.stringify(trial.locations)}

Generate two items:
1. email_subject: A concise, executive professional clinical referral subject line.
2. email_body: A detailed clinical referral document specifying eligibility criteria parsed, baseline screening actions required on-site, and coordinator check details. Include placeholder signatures. Always keep language respectful, scientific, and trace performance metrics.\`;`;

const newContent = content.replace(regex, replacement);
if (content === newContent) {
  console.log("Failed to match the regex for Fix 6!");
} else {
  fs.writeFileSync('server.ts', newContent);
  console.log("Successfully replaced Fix 6!");
}
