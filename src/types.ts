export interface Diagnosis {
  icd10_code: string;
  description: string;
  stage?: string;
  date_diagnosed?: string;
}

export interface Biomarker {
  name: string;
  result: string; // e.g. "positive", "Exon 19 deletion positive", "negative", "65%"
}

export interface PriorTreatment {
  name: string;
  type: string; // e.g. "chemotherapy", "EGFR TKI", "immunotherapy"
  end_date: string;
  response: string; // e.g. "partial response", "progressive disease"
}

export interface LabValues {
  creatinine: number;
  ALT: number;
  AST?: number;
  ANC: number; // Absolute Neutrophil Count (x10^9/L)
  platelets?: number;
  hemoglobin?: number;
  cd4_count?: number; // HIV CD4 T-cell count (cells/mcL)
  viral_load?: number; // HIV Viral Load (copies/mL)
  art_status?: string; // Antiretroviral Therapy status (e.g., "Active", "Naive")
  systolic_bp?: number; // Systemic blood pressure (mmHg) for Cardiovascular
  diastolic_bp?: number;
  bmi?: number;
  cholesterol?: number;
  triglycerides?: number;
  ana_titer?: string;
  esr?: number;
  PSA?: number; // Prostate-Specific Antigen (ng/mL)
  rheumatoid_factor?: string; // Rheumatoid factor (positive/negative) for Autoimmune
  hba1c?: number; // HbA1c percentage (%) for Cardiovascular/Metabolic
  crp?: number; // C-Reactive Protein (mg/L) for Autoimmune/Inflammatory
  mmse_score?: number; // Mini-Mental State Examination (0-30) for Neurology
  mobility_assistance?: string; // e.g., "None", "Cane", "Wheelchair" for Neurology
  fev1_fvc_ratio?: number; // FEV1/FVC Ratio (%) for Pulmonology
  oxygen_required?: boolean; // Requires oxygen supplementation for Pulmonology
  egfr_value?: number; // e.g. eGFR (mL/min/1.73m2) for Nephrology
  dialysis_dependent?: boolean; // Overwhelming renal dependency for Nephrology
}

export interface LocationInfo {
  city: string;
  state: string;
  zip?: string;
  country: string;
}

export interface PatientProfile {
  patient_id: string;
  name: string;
  age: number;
  sex: "M" | "F" | "other";
  diagnoses: Diagnosis[];
  biomarkers: Biomarker[];
  prior_treatments: PriorTreatment[];
  ecog_performance_status: number;
  lab_values: LabValues;
  location: LocationInfo;
  comorbidities: string[];
  last_therapy_days_ago: number;
  willing_to_biopsy: boolean;
  willing_to_change_location?: boolean;
  approvalStatus?: string;
  raw_clinical_note?: string;
}

export interface ReferralApproval {
  approval_id: string;
  timestamp: string;
  patient_id: string;
  patient_name: string;
  nct_id: string;
  trial_title: string;
  status: "Draft" | "Dispatched" | "PENDING_REVIEW" | "APPROVED";
  email_subject: string;
  email_body: string;
  coordinator_email: string;
  coordinator_name: string;
}

export interface TrialLocation {
  facility: string;
  city: string;
  state: string;
}

export interface TrialRules {
  required_conditions: string[];
  excluded_conditions: string[];
  required_biomarkers: string[];
  max_ecog: number;
  max_creatinine: number;
  max_alt: number;
  required_prior_pd1_exclusion: boolean;
  min_cd4?: number; // CD4 T-cell minimum threshold (cells/mcL)
  max_viral_load?: number; // Max viral copies/mL
  requires_art?: boolean; // Requires active antiretroviral therapy
}

export interface ClinicalTrial {
  nct_id: string;
  title: string;
  phase: string;
  sponsor: string;
  primary_contact?: {
    name: string;
    email: string;
    phone?: string;
  };
  locations: TrialLocation[];
  interventions: string[];
  inclusion_criteria: string;
  exclusion_criteria: string;
  url: string;
  rules: TrialRules;
}

export interface CategoryScore {
  max: number;
  earned: number;
  met: string[];
  deductions?: string[];
  needed_biomarkers?: string[];
  lacking_biomarkers?: string[];
}

export interface ScoreBreakdown {
  tier: number;
  status: "HIGH_PRIORITY" | "POTENTIAL" | "LOW_MATCH" | "EXCLUDED" | "INELIGIBLE";
  gate_violations?: string[];
  categories?: {
    disease_and_refractory: CategoryScore;
    biomarker_molecular: CategoryScore;
    performance_and_labs: CategoryScore;
    logistics_geography: CategoryScore;
    washout_readiness: CategoryScore;
  };
  final_score: number;
  why_not_higher: string;
  data_gaps: string[];
}

export interface MatcherResult {
  nct_id: string;
  title: string;
  score: number;
  match_status: "HIGH_PRIORITY" | "POTENTIAL" | "LOW_MATCH" | "EXCLUDED" | "INELIGIBLE";
  inclusion_met: string[];
  inclusion_not_met: string[];
  inclusion_unknown: string[];
  exclusion_cleared: string[];
  exclusion_violations: string[];
  exclusion_unknown: string[];
  data_gaps: string[];
  score_breakdown: ScoreBreakdown;
  chain_of_reasoning: {
    criterion: string;
    type: "inclusion" | "exclusion" | "gate" | "data_gap";
    determination: "MET" | "NOT_MET" | "UNKNOWN";
    rationale: string;
  }[];
  eligibility_summary: string;
}

export interface TrialLogixRun {
  run_id: string;
  timestamp: string;
  patient_id: string;
  nct_id: string;
  score: number;
  match_status: string;
}

export interface Message {
  role: "user" | "model";
  text: string;
}
