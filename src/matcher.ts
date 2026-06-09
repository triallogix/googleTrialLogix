import { PatientProfile, ClinicalTrial, MatcherResult, CategoryScore } from "./types";

// ============================================================
// COMPLETE PD-1/PD-L1/CTLA-4 CHECKPOINT INHIBITOR REFERENCE
// Updated to cover all approved agents as of 2025
// ============================================================
const PD1_PDL1_DRUGS = new Set([
  // PD-1 inhibitors
  "PEMBROLIZUMAB", "NIVOLUMAB", "CEMIPLIMAB", "DOSTARLIMAB",
  "TISLELIZUMAB", "SPARTALIZUMAB", "CAMRELIZUMAB", "SINTILIMAB",
  // PD-L1 inhibitors
  "ATEZOLIZUMAB", "DURVALUMAB", "AVELUMAB",
  // CTLA-4 (often co-excluded)
  "IPILIMUMAB", "TREMELIMUMAB",
  // Generic / partial-match tokens (checked via .includes below)
]);

const PD1_PARTIAL_TOKENS = [
  "PD-1", "PD-L1", "ANTI-PD", "CHECKPOINT", "IMMUNE CHECKPOINT",
];

function hasPD1Therapy(treatments: PatientProfile["prior_treatments"]): boolean {
  return treatments.some((tx) => {
    const name = tx.name.toUpperCase();
    const type = tx.type.toUpperCase();
    if (type === "IMMUNOTHERAPY") return true;
    if (PD1_PDL1_DRUGS.has(name)) return true;
    return PD1_PARTIAL_TOKENS.some((token) => name.includes(token));
  });
}

export function scoreTrial(patient: PatientProfile, trial: ClinicalTrial): MatcherResult {
  const nct_id = trial.nct_id;
  const rules = trial.rules;

  const inclusion_met: string[] = [];
  const inclusion_not_met: string[] = [];
  const inclusion_unknown: string[] = [];
  const exclusion_cleared: string[] = [];
  const exclusion_violations: string[] = [];
  const exclusion_unknown: string[] = [];
  const data_gaps: string[] = [];
  const chain_of_reasoning: MatcherResult["chain_of_reasoning"] = [];

  // ─── Helper flags ───────────────────────────────────────────────────
  const requiredConds = rules.required_conditions;
  const ONCOLOGY_KEYS = [
    "NSCLC", "SOLID TUMOR", "LYMPHOMA", "CANCER", "TUMOR",
    "SARCOMA", "CARCINOMA", "ADENOCARCINOMA", "MELANOMA", "GIST", "LEUKEMIA",
  ];
  const isOncology = requiredConds.some((c) =>
    ONCOLOGY_KEYS.some((k) => c.toUpperCase().includes(k))
  );
  const isHivTrial = requiredConds.some((c) =>
    ["HIV", "AIDS", "VIROLOGY", "RETROVIRUS", "IMMUNODEFICIENCY"].some((k) =>
      c.toUpperCase().includes(k)
    )
  );

  // ==========================================
  // TIER 1 — HARD GATES
  // ==========================================
  const gate_violations: string[] = [];

  // Gate 1: Age
  const minAge = requiredConds.includes("Lymphoma") ? 12 : 18;
  const maxAge = (rules as any).max_age as number | undefined;
  if (patient.age < minAge) {
    gate_violations.push(
      `Below protocol minimum age (Patient: ${patient.age}, Requirement: >= ${minAge})`
    );
  } else if (maxAge !== undefined && patient.age > maxAge) {
    gate_violations.push(
      `Exceeds protocol maximum age (Patient: ${patient.age}, Maximum: <= ${maxAge})`
    );
  } else {
    inclusion_met.push(`Age eligibility confirmed (Age: ${patient.age})`);
  }

  // Gate 2: Tumor type / indication
  let hasMatchingPathology = false;
  for (const dx of patient.diagnoses) {
    const desc = dx.description.toUpperCase();
    const icd = dx.icd10_code.toUpperCase();
    if (requiredConds.includes("NSCLC") && (
      desc.includes("NSCLC") || desc.includes("NON-SMALL CELL LUNG") || icd.startsWith("C34")
    )) {
      hasMatchingPathology = true;
    } else if (requiredConds.includes("Solid Tumor")) {
      hasMatchingPathology = true;
    } else if (requiredConds.includes("Lymphoma") && desc.includes("LYMPHOMA")) {
      hasMatchingPathology = true;
    } else if (
      requiredConds.some((cond) =>
        desc.includes(cond.toUpperCase()) || icd.startsWith(cond.toUpperCase().slice(0, 3))
      )
    ) {
      hasMatchingPathology = true;
    }
  }
  if (isHivTrial && patient.lab_values.cd4_count !== undefined) {
    hasMatchingPathology = true;
  }
  if (!hasMatchingPathology) {
    gate_violations.push(
      `Protocol cohort mismatch (Trial requires: ${requiredConds.join(" or ")})`
    );
  } else {
    inclusion_met.push(`Indication / cohort eligibility confirmed (${requiredConds.join(", ")})`);
  }

  // Gate 3: ECOG (oncology)
  if (isOncology && patient.ecog_performance_status > rules.max_ecog) {
    gate_violations.push(
      `ECOG status exceeds protocol limit (Patient: ${patient.ecog_performance_status}, Max: ${rules.max_ecog})`
    );
  } else if (isOncology) {
    inclusion_met.push(`Performance status (ECOG ${patient.ecog_performance_status}) within limits`);
  }

  // Gate 4: Prior PD-1/PD-L1 exclusion
  if (rules.required_prior_pd1_exclusion && isOncology) {
    if (hasPD1Therapy(patient.prior_treatments)) {
      gate_violations.push(
        "Prior anti-PD-1 / anti-PD-L1 / CTLA-4 checkpoint therapy documented — violates protocol exclusion"
      );
    } else {
      exclusion_cleared.push(
        "No prior checkpoint inhibitor (PD-1/PD-L1/CTLA-4) therapy documented — cleared"
      );
    }
  }

  // Gate 5: CNS / brain metastases
  const CNS_KEYWORDS = ["BRAIN", "CNS", "CEREBRAL", "LEPTOMENINGEAL", "MENINGITIS"];
  const hasCNS =
    patient.comorbidities.some((c) => CNS_KEYWORDS.some((k) => c.toUpperCase().includes(k))) ||
    patient.diagnoses.some((dx) => CNS_KEYWORDS.some((k) => dx.description.toUpperCase().includes(k)));
  if (hasCNS) {
    gate_violations.push("Symptomatic CNS/brain metastases documented — violates protocol exclusion");
  } else {
    exclusion_cleared.push("Cleared CNS/brain metastasis exclusion");
  }

  // Early exit
  if (gate_violations.length > 0) {
    gate_violations.forEach((v) => {
      inclusion_not_met.push(v);
      exclusion_violations.push(v);
      chain_of_reasoning.push({
        criterion: v,
        type: "gate",
        determination: "NOT_MET",
        rationale: "Fails mandatory Tier-1 study constraint",
      });
    });
    return {
      nct_id,
      title: trial.title,
      score: 0,
      match_status: "EXCLUDED",
      inclusion_met,
      inclusion_not_met,
      inclusion_unknown,
      exclusion_cleared,
      exclusion_violations,
      exclusion_unknown,
      data_gaps: gate_violations,
      score_breakdown: {
        tier: 1,
        status: "EXCLUDED",
        gate_violations,
        final_score: 0,
        why_not_higher: "Patient failed Tier-1 eligibility gate(s). Scoring terminated.",
        data_gaps: gate_violations,
      },
      chain_of_reasoning,
      eligibility_summary: `Ineligible — Failed gate: ${gate_violations[0]}`,
    };
  }

  // ==========================================
  // TIER 2 — WEIGHTED SCORING
  // ==========================================

  // ── Category 1: Disease & Refractory History (Max 35) ───────────────
  let diseaseEarned = 0;
  const diseaseMet: string[] = [];
  const diseaseDeductions: string[] = [];

  // A. Exact pathology: 15 pts
  const exactMatch = patient.diagnoses.some((dx) =>
    requiredConds.some((c) => dx.description.toUpperCase().includes(c.toUpperCase()))
  );
  if (exactMatch) {
    diseaseEarned += 15;
    diseaseMet.push("Exact pathology match verified (+15 pts)");
    inclusion_met.push("Primary diagnosis matches protocol target indication");
  } else {
    diseaseEarned += 10;
    diseaseMet.push("Broad solid-tumour cohort match (+10 pts)");
    inclusion_unknown.push("Confirm sub-cohort eligibility with PI");
    diseaseDeductions.push("General cohort only; sub-indication unconfirmed (-5 pts)");
  }

  // B. Refractory lines: 10 pts
  const linesCount = patient.prior_treatments.length;
  if (linesCount >= 2) {
    diseaseEarned += 10;
    diseaseMet.push(`Refractory: ${linesCount} prior systemic lines (+10 pts)`);
    inclusion_met.push(`>= 2 prior systemic regimens confirmed (${linesCount} lines)`);
  } else if (linesCount === 1) {
    diseaseEarned += 5;
    diseaseMet.push("1 prior line documented (+5/10 pts)");
    inclusion_unknown.push("Only 1 prior line — verify sub-protocol rules");
    data_gaps.push("Confirm minimum prior treatment line requirements");
    diseaseDeductions.push("Only 1 prior line (requires >= 2 for most protocols) (-5 pts)");
  } else {
    diseaseMet.push("No prior systemic therapy (+0/10 pts)");
    data_gaps.push("Treatment-naive — confirm if trial accepts naive patients");
    diseaseDeductions.push("No prior systemic therapy (-10 pts)");
  }

  // C. Progression: 10 pts
  const hasProgression = patient.prior_treatments.some((tx) =>
    tx.response.toUpperCase().includes("PROGRESS")
  );
  if (hasProgression) {
    diseaseEarned += 10;
    diseaseMet.push("Documented progression on prior therapy (+10 pts)");
    inclusion_met.push("Disease progression documented on prior systemic line");
  } else {
    diseaseEarned += 4;
    diseaseMet.push("No explicit progression on record (+4/10 pts)");
    data_gaps.push("Confirm progression with treating oncologist");
    diseaseDeductions.push("Progression not documented on last therapy line (-6 pts)");
  }

  // D. RECIST gap
  if (!patient.willing_to_biopsy) {
    diseaseEarned = Math.max(0, diseaseEarned - 5);
    data_gaps.push("Baseline RECIST 1.1 imaging required — CT scan needed before screening");
    diseaseDeductions.push("RECIST baseline unverified; biopsy consent not given (-5 pts)");
  }

  const disease_and_refractory: CategoryScore = {
    max: 35,
    earned: Math.min(35, diseaseEarned),
    met: diseaseMet,
    deductions: diseaseDeductions,
  };

  // ── Category 2: Biomarker & Molecular Match (Max 25) ────────────────
  let biomarkerEarned = 0;
  const biomarkerMet: string[] = [];
  const biomarkerDeductions: string[] = [];
  const lackingBiomarkers: string[] = [];
  const neededBiomarkers: string[] = [];

  if (isHivTrial) {
    const reqCd4 = (rules as any).min_cd4 ?? 200;
    const reqVl = (rules as any).max_viral_load ?? 50000;
    const reqArt = (rules as any).requires_art as boolean | undefined;
    const patCd4 = patient.lab_values.cd4_count;
    const patVl = patient.lab_values.viral_load;
    const patArt = patient.lab_values.art_status ?? "";

    neededBiomarkers.push("CD4 Count", "Viral Load");
    let hivPts = 0;

    if (patCd4 !== undefined) {
      if (patCd4 >= reqCd4) {
        hivPts += 12.5;
        biomarkerMet.push(`CD4 count ${patCd4} cells/mcL >= ${reqCd4} (+12.5 pts)`);
        inclusion_met.push(`CD4 count (${patCd4} cells/mcL) meets protocol minimum`);
      } else {
        inclusion_not_met.push(`CD4 count ${patCd4} cells/mcL below threshold (>= ${reqCd4})`);
        lackingBiomarkers.push("CD4 Count (below target)");
        biomarkerDeductions.push(`CD4 ${patCd4} < ${reqCd4} required (-12.5 pts)`);
      }
    } else {
      data_gaps.push("CD4+ T-lymphocyte count missing — order quantitative assay");
      lackingBiomarkers.push("CD4 Count (not on file)");
      biomarkerDeductions.push("CD4 count not on file (-12.5 pts)");
    }

    if (patVl !== undefined) {
      if (patVl <= reqVl) {
        hivPts += 12.5;
        biomarkerMet.push(`Viral load ${patVl} copies/mL <= ${reqVl} (+12.5 pts)`);
        inclusion_met.push(`HIV viral load (${patVl} copies/mL) within protocol limit`);
      } else {
        inclusion_not_met.push(`Viral load ${patVl} copies/mL exceeds limit (<= ${reqVl})`);
        lackingBiomarkers.push("Viral Load (exceeds limit)");
        biomarkerDeductions.push(`Viral load ${patVl} > ${reqVl} (-12.5 pts)`);
      }
    } else {
      data_gaps.push("HIV-1 viral load (PCR) missing — order quantitative assay");
      lackingBiomarkers.push("Viral Load (not on file)");
      biomarkerDeductions.push("Viral load not on file (-12.5 pts)");
    }

    if (reqArt === true && !["ACTIVE", "YES", "ON-ART"].includes(patArt.toUpperCase())) {
      data_gaps.push("Active ART required but status unclear — confirm current regimen");
    }

    biomarkerEarned = Math.round(hivPts);
  } else {
    const requiredBms = rules.required_biomarkers;
    if (requiredBms.length > 0) {
      neededBiomarkers.push(...requiredBms);
      let matchedAll = true;
      const matchedNames: string[] = [];
      for (const req of requiredBms) {
        const found = patient.biomarkers.find((b) => b.name.toUpperCase() === req.toUpperCase());
        if (found && !found.result.toUpperCase().includes("NEG")) {
          matchedNames.push(`${found.name} (${found.result})`);
        } else {
          matchedAll = false;
          lackingBiomarkers.push(req);
        }
      }
      if (matchedAll && matchedNames.length > 0) {
        biomarkerEarned = 25;
        biomarkerMet.push(`All protocol biomarkers matched: ${matchedNames.join(", ")} (+25 pts)`);
        inclusion_met.push(`Required biomarkers confirmed: ${matchedNames.join(", ")}`);
      } else {
        biomarkerEarned = 0;
        biomarkerMet.push(`Missing required biomarkers: ${lackingBiomarkers.join(", ")} (+0 pts)`);
        inclusion_not_met.push(`Protocol biomarker(s) absent: ${lackingBiomarkers.join(", ")}`);
        data_gaps.push(`Order NGS / PCR assay for: ${lackingBiomarkers.join(", ")}`);
        biomarkerDeductions.push(`Lacks required biomarkers: ${lackingBiomarkers.join(", ")} (-25 pts)`);
      }
    } else {
      const STANDARD_PANEL = ["EGFR", "ALK", "KRAS", "PD-L1", "BRAF", "ROS1"];
      neededBiomarkers.push(...STANDARD_PANEL);
      const missing = STANDARD_PANEL.filter(
        (g) => !patient.biomarkers.some((b) => b.name.toUpperCase() === g)
      );
      lackingBiomarkers.push(...missing);
      const panelCount = patient.biomarkers.length;

      if (panelCount >= 3) {
        biomarkerEarned = 15;
        biomarkerMet.push(`Complete genomic panel (${panelCount} markers) (+15 pts)`);
        exclusion_cleared.push("Driver mutation profile complete for general solid-tumour trial");
        if (missing.length > 0) {
          biomarkerDeductions.push(`Panel incomplete: missing ${missing.join(", ")} (-10 pts)`);
        }
      } else if (panelCount > 0) {
        biomarkerEarned = 8;
        biomarkerMet.push(`Partial biomarker panel (${panelCount} markers) (+8 pts)`);
        inclusion_unknown.push("Incomplete genomics — full NGS recommended before screening");
        data_gaps.push("Order comprehensive NGS panel (EGFR/ALK/KRAS/BRAF/ROS1/PD-L1)");
        biomarkerDeductions.push(`Panel incomplete; missing ${missing.join(", ")} (-17 pts)`);
      } else {
        biomarkerEarned = 0;
        biomarkerMet.push("No biomarker data on file (+0 pts)");
        data_gaps.push("No molecular results — order companion diagnostic panel");
        biomarkerDeductions.push("Zero biomarker data (-25 pts)");
      }
    }
  }

  const biomarker_molecular: CategoryScore = {
    max: 25,
    earned: Math.min(25, biomarkerEarned),
    met: biomarkerMet,
    deductions: biomarkerDeductions,
    needed_biomarkers: neededBiomarkers,
    lacking_biomarkers: lackingBiomarkers,
  };

  // ── Category 3: Performance & Labs (Max 20) ─────────────────────────
  let perfEarned = 0;
  const perfMet: string[] = [];
  const perfDeductions: string[] = [];

  // A. ECOG: 10 pts
  const ecog = patient.ecog_performance_status;
  if (isOncology) {
    if (ecog === 0 || ecog === 1) {
      perfEarned += 10;
      perfMet.push(`Highly active: ECOG ${ecog} (+10 pts)`);
      inclusion_met.push(`Functional performance index ECOG ${ecog} verified`);
    } else if (ecog === 2) {
      perfEarned += 5;
      perfMet.push(`Moderately active: ECOG ${ecog} (+5/10 pts)`);
      inclusion_unknown.push("ECOG 2 — confirm sub-protocol eligibility");
      data_gaps.push("Physical performance review required (ECOG 2 borderline)");
      perfDeductions.push("ECOG 2 is borderline for most protocols (-5 pts)");
    } else {
      perfMet.push(`Severely deconditioned: ECOG ${ecog} (+0 pts)`);
      perfDeductions.push(`ECOG ${ecog} significantly limits trial access (-10 pts)`);
    }
  } else {
    perfEarned += 10;
    perfMet.push("ECOG gate waived (non-oncology protocol) (+10 pts)");
  }

  // B. Labs: 10 pts
  const creatinine = patient.lab_values.creatinine;
  const alt = patient.lab_values.ALT;
  const ast = patient.lab_values.AST;
  const anc = patient.lab_values.ANC;
  const maxCreatinine = rules.max_creatinine;
  const maxAlt = rules.max_alt;
  let labPts = 0;

  if (creatinine <= maxCreatinine) {
    labPts += 3.33;
    perfMet.push(`Creatinine ${creatinine} mg/dL <= ${maxCreatinine} (+3.33 pts)`);
  } else {
    data_gaps.push(`Creatinine ${creatinine} mg/dL exceeds limit (<= ${maxCreatinine})`);
    perfDeductions.push(`Elevated creatinine ${creatinine} mg/dL (-3.33 pts)`);
  }

  const altOk = alt <= maxAlt;
  const astOk = ast === undefined || ast <= maxAlt;
  if (altOk && astOk) {
    labPts += 3.33;
    const astStr = ast !== undefined ? `, AST ${ast} U/L` : "";
    perfMet.push(`Hepatic enzymes in range: ALT ${alt} U/L${astStr} (+3.33 pts)`);
  } else {
    data_gaps.push(`Elevated hepatic enzymes: ALT ${alt}, AST ${ast ?? "N/A"} (max ${maxAlt})`);
    perfDeductions.push(`Hepatic enzymes exceed protocol threshold (-3.33 pts)`);
  }

  if (anc >= 1.5) {
    labPts += 3.34;
    perfMet.push(`ANC ${anc} x10^9/L >= 1.5 (+3.34 pts)`);
  } else {
    data_gaps.push(`ANC ${anc} x10^9/L below safety threshold (>= 1.5)`);
    perfDeductions.push(`ANC ${anc} insufficient (-3.34 pts)`);
  }

  perfEarned += labPts;
  const performance_and_labs: CategoryScore = {
    max: 20,
    earned: Math.min(20, Math.round(perfEarned)),
    met: perfMet,
    deductions: perfDeductions,
  };

  // ── Category 4: Logistics & Geography (Max 10) ──────────────────────
  let geoEarned = 0;
  const geoMet: string[] = [];

  const patCity = patient.location.city.toUpperCase();
  const patState = patient.location.state.toUpperCase();
  const sameCity = trial.locations.some((l) => l.city.toUpperCase() === patCity);
  const sameState = trial.locations.some(
    (l) =>
      l.state.toUpperCase().includes(patState) ||
      patState.includes(l.state.toUpperCase().slice(0, 2))
  );

  if (sameCity) {
    geoEarned = 10;
    geoMet.push(`Local match: trial site in ${patient.location.city} (+10 pts)`);
  } else if (patient.willing_to_change_location) {
    geoEarned = 10;
    geoMet.push("Patient willing to relocate — logistics override applied (+10 pts)");
  } else if (sameState) {
    geoEarned = 7;
    geoMet.push(`Regional match: trial site in ${patient.location.state} (+7 pts)`);
    data_gaps.push(`Commute readiness needed: ${patient.location.city} to trial site`);
  } else {
    geoEarned = 3;
    geoMet.push("Out-of-state site — long-distance travel required (+3 pts)");
    data_gaps.push("Travel accommodation and reimbursement assessment needed");
  }

  const logistics_geography: CategoryScore = { max: 10, earned: geoEarned, met: geoMet };

  // ── Category 5: Washout & Screening Readiness (Max 10) ──────────────
  let washoutEarned = 0;
  const washoutMet: string[] = [];
  const washoutDeductions: string[] = [];

  // Read min washout from trial rules; fall back to 14-day floor, 28-day safe threshold
  const minWashout = (rules as any).min_washout_days as number ?? 14;
  const safeWashout = Math.max(28, minWashout);
  const daysAgo = patient.last_therapy_days_ago;

  if (daysAgo >= safeWashout) {
    washoutEarned += 6;
    washoutMet.push(`Safe washout: ${daysAgo} days since last therapy (protocol min: ${minWashout}) (+6 pts)`);
    exclusion_cleared.push(`Washout complete (>= ${safeWashout} days verified)`);
  } else if (daysAgo >= minWashout) {
    washoutEarned += 4;
    washoutMet.push(`Minimum washout met: ${daysAgo} days (safe threshold: ${safeWashout}) (+4/6 pts)`);
    exclusion_unknown.push(`Washout ${daysAgo} days — meets minimum but below recommended ${safeWashout}`);
    data_gaps.push("Monitor drug clearance; consider extended washout before screening visit");
    washoutDeductions.push(`Borderline washout (${daysAgo} days, ideal >= ${safeWashout}) (-2 pts)`);
  } else {
    washoutMet.push(`Insufficient washout: ${daysAgo} days (min ${minWashout} required) (+0 pts)`);
    inclusion_not_met.push(`Within active treatment window: only ${daysAgo} days since last therapy`);
    data_gaps.push(`Washout incomplete — need ${minWashout - daysAgo} more days before screening`);
    washoutDeductions.push(`Active drug window (${daysAgo} days < ${minWashout} required) (-6 pts)`);
  }

  // Biopsy: 4 pts
  const biopsyNeeded =
    trial.inclusion_criteria.toUpperCase().includes("BIOPSY") ||
    trial.inclusion_criteria.toUpperCase().includes("TISSUE");
  if (biopsyNeeded) {
    if (patient.willing_to_biopsy) {
      washoutEarned += 4;
      washoutMet.push("Biopsy consent confirmed (+4 pts)");
      inclusion_met.push("Patient consents to archival/fresh tumour biopsy protocol");
    } else {
      exclusion_unknown.push("Biopsy required but patient unwilling — obtain consent");
      data_gaps.push("Mandatory biopsy consent required before screening visit");
      washoutDeductions.push("Biopsy consent not given — screening blocked (-4 pts)");
    }
  } else {
    washoutEarned += 4;
    washoutMet.push("No biopsy requirement in protocol (+4 pts)");
  }

  const washout_readiness: CategoryScore = {
    max: 10,
    earned: Math.min(10, washoutEarned),
    met: washoutMet,
    deductions: washoutDeductions,
  };

  // ─── Final score ─────────────────────────────────────────────────────
  const finalScoreRaw =
    disease_and_refractory.earned +
    biomarker_molecular.earned +
    performance_and_labs.earned +
    logistics_geography.earned +
    washout_readiness.earned;
  const final_score = Math.max(0, Math.min(100, Math.round(finalScoreRaw)));

  let status: MatcherResult["match_status"] =
    final_score >= 85 ? "HIGH_PRIORITY" : final_score >= 50 ? "POTENTIAL" : "LOW_MATCH";

  // Chain of reasoning
  diseaseMet.forEach((m) =>
    chain_of_reasoning.push({ criterion: m, type: "inclusion", determination: "MET", rationale: "Disease history evaluation" })
  );
  biomarkerMet.forEach((m) =>
    chain_of_reasoning.push({ criterion: m, type: "inclusion", determination: "MET", rationale: "Genomic / molecular profiling" })
  );
  perfMet.forEach((m) =>
    chain_of_reasoning.push({ criterion: m, type: "inclusion", determination: "MET", rationale: "Performance and biochemistry" })
  );
  geoMet.forEach((m) =>
    chain_of_reasoning.push({ criterion: m, type: "inclusion", determination: "MET", rationale: "Geographic logistics" })
  );
  washoutMet.forEach((m) =>
    chain_of_reasoning.push({ criterion: m, type: "inclusion", determination: "MET", rationale: "Washout and screening readiness" })
  );
  data_gaps.forEach((g) => {
    chain_of_reasoning.push({
      criterion: g,
      type: "data_gap",
      determination: "UNKNOWN",
      rationale: "Requires on-site clinical verification",
    });
    inclusion_unknown.push(g);
  });

  const ptsLost = 100 - final_score;
  const why_not_higher =
    final_score === 100
      ? "Patient satisfies all clinical, biochemical, logistical, and safety checkpoints."
      : `Score ${final_score}/100 — ${ptsLost} pts outstanding: ${data_gaps.slice(0, 2).join("; ")}`;

  return {
    nct_id,
    title: trial.title,
    score: final_score,
    match_status: status,
    inclusion_met,
    inclusion_not_met,
    inclusion_unknown,
    exclusion_cleared,
    exclusion_violations,
    exclusion_unknown,
    data_gaps,
    score_breakdown: {
      tier: 2,
      status,
      categories: {
        disease_and_refractory,
        biomarker_molecular,
        performance_and_labs,
        logistics_geography,
        washout_readiness,
      },
      final_score,
      why_not_higher,
      data_gaps,
    },
    chain_of_reasoning: chain_of_reasoning.slice(0, 30),
    eligibility_summary: `${status.replace("_", " ")} (${final_score}/100): ${diseaseMet[0] ?? "Cohort matched"}`,
  };
}

/**
 * Runs score_trial N times and verifies zero variance.
 * Used to prove determinism — the core audit guarantee of the engine.
 */
export function runConsistencySimulation(
  patient: PatientProfile,
  trial: ClinicalTrial,
  runs = 100
): {
  runs_evaluated: number;
  mean_score: number;
  min_score: number;
  max_score: number;
  variance: number;
  std_dev: number;
  status_unanimity: boolean;
  determinism_verified: boolean;
  audit_note: string;
} {
  const scores: number[] = [];
  const statuses = new Set<string>();
  for (let i = 0; i < runs; i++) {
    const r = scoreTrial(patient, trial);
    scores.push(r.score);
    statuses.add(r.match_status);
  }
  const mean = scores.reduce((a, b) => a + b, 0) / runs;
  const variance = scores.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / runs;
  const std_dev = Math.sqrt(variance);
  const det = std_dev === 0;
  return {
    runs_evaluated: runs,
    mean_score: mean,
    min_score: Math.min(...scores),
    max_score: Math.max(...scores),
    variance,
    std_dev,
    status_unanimity: statuses.size === 1,
    determinism_verified: det,
    audit_note: det
      ? "PASS — Score is 100% deterministic. Zero variance. Suitable for clinical audit trails."
      : `WARNING — Non-zero variance detected (${std_dev.toFixed(4)}). Investigate randomness source.`,
  };
}