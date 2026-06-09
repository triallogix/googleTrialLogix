const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const promptText = `Generate a highly professional, clinical referral and eligibility screening memo\.[\s\S]*?Keep language respectful, scientific, and trace performance metrics\.`;/;

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
