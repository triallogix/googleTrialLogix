export interface DiseaseRequirement {
  disease: string;
  requiredFields: string[];
}

export const DISEASE_REQUIREMENTS: DiseaseRequirement[] = [
  {
    disease: "Diabetes",
    requiredFields: ["bmi", "hba1c", "blood_pressure"]
  },
  {
    disease: "Non-Small Cell Lung Cancer",
    requiredFields: ["biomarkers (EGFR, ALK, KRAS)", "ecog_performance_status", "prior_treatments", "creatinine", "ALT", "ANC"]
  },
  {
    disease: "Breast Cancer",
    requiredFields: ["biomarkers (ER, PR, HER2)", "ecog_performance_status", "prior_treatments", "creatinine", "ALT", "ANC"]
  },
  {
    disease: "Cardiovascular Disease",
    requiredFields: ["systolic_bp", "diastolic_bp", "bmi", "creatinine", "cholesterol", "triglycerides"]
  },
  {
    disease: "Autoimmune Disease",
    requiredFields: ["rheumatoid_factor", "crp", "ana_titer", "esr"]
  },
  {
    disease: "HIV/AIDS",
    requiredFields: ["cd4_count", "viral_load", "art_status"]
  },
  {
    disease: "Neurological Assessment",
    requiredFields: ["mmse_score", "mobility_assistance"]
  },
  {
    disease: "Pulmonology/Respiratory Assessment",
    requiredFields: ["fev1_fvc_ratio", "oxygen_required"]
  },
  {
    disease: "Kidney Disease",
    requiredFields: ["egfr_value", "creatinine", "dialysis_dependent"]
  }
];
