patient_profiles = [
    {
        "patient_id": "PT-10042",
        "name": "Jane Doe (NSCLC EGFR-Positive)",
        "age": 58,
        "sex": "F",
        "diagnoses": [
            {
                "icd10_code": "C34.11",
                "description": "Stage IIIB non-small cell lung cancer adenocarcinoma",
                "stage": "IIIB",
                "date_diagnosed": "2023-11"
            }
        ],
        "biomarkers": [
            {"name": "EGFR", "result": "Exon 19 deletion positive"},
            {"name": "PD-L1", "result": "TPS 65%"},
            {"name": "KRAS", "result": "Negative"},
            {"name": "ALK", "result": "Negative"}
        ],
        "prior_treatments": [
            {
                "name": "Carboplatin + Pemetrexed",
                "type": "chemotherapy",
                "end_date": "2024-07",
                "response": "partial response"
            },
            {
                "name": "Osimertinib",
                "type": "EGFR TKI",
                "end_date": "2025-05",
                "response": "progressive disease"
            }
        ],
        "ecog_performance_status": 1,
        "lab_values": {
            "creatinine": 0.9,
            "ALT": 28,
            "ANC": 2.1
        },
        "location": {
            "city": "Boston",
            "state": "MA",
            "zip": "02115",
            "country": "USA"
        },
        "comorbidities": [],
        "last_therapy_days_ago": 30,
        "willing_to_biopsy": True
    },
    {
        "patient_id": "PT-10043",
        "name": "Alex Smith (Adolescent Patient)",
        "age": 16,
        "sex": "M",
        "diagnoses": [
            {
                "icd10_code": "C34.11",
                "description": "Stage IIIB non-small cell lung cancer adenocarcinoma",
                "stage": "IIIB",
                "date_diagnosed": "2024-02"
            }
        ],
        "biomarkers": [
            {"name": "EGFR", "result": "Negative"},
            {"name": "PD-L1", "result": "TPS 5%"}
        ],
        "prior_treatments": [
            {
                "name": "Carboplatin + Paclitaxel",
                "type": "chemotherapy",
                "end_date": "2024-12",
                "response": "stable disease"
            }
        ],
        "ecog_performance_status": 1,
        "lab_values": {
            "creatinine": 0.7,
            "ALT": 22,
            "ANC": 1.8
        },
        "location": {
            "city": "Worcester",
            "state": "MA",
            "zip": "01602",
            "country": "USA"
        },
        "comorbidities": [],
        "last_therapy_days_ago": 180,
        "willing_to_biopsy": False
    },
    {
        "patient_id": "PT-10044",
        "name": "Robert Johnson (ECOG-3 Frail Patient)",
        "age": 72,
        "sex": "M",
        "diagnoses": [
            {
                "icd10_code": "C34.11",
                "description": "Stage IV NSCLC adenocarcinoma",
                "stage": "IV",
                "date_diagnosed": "2024-05"
            }
        ],
        "biomarkers": [
            {"name": "EGFR", "result": "Negative"},
            {"name": "KRAS", "result": "Negative"}
        ],
        "prior_treatments": [
            {
                "name": "Carboplatin + Pemetrexed",
                "type": "chemotherapy",
                "end_date": "2024-11",
                "response": "progressive disease"
            }
        ],
        "ecog_performance_status": 3,
        "lab_values": {
            "creatinine": 1.1,
            "ALT": 35,
            "ANC": 1.9
        },
        "location": {
            "city": "Providence",
            "state": "RI",
            "zip": "02903",
            "country": "USA"
        },
        "comorbidities": ["Hypertension", "Type 2 Diabetes"],
        "last_therapy_days_ago": 210,
        "willing_to_biopsy": True
    },
    {
        "patient_id": "PT-10045",
        "name": "Sarah Chen (Prior PD-1 Immunotherapy)",
        "age": 55,
        "sex": "F",
        "diagnoses": [
            {
                "icd10_code": "C34.11",
                "description": "Stage IV non-small cell lung cancer",
                "stage": "IV",
                "date_diagnosed": "2024-01"
            }
        ],
        "biomarkers": [
            {"name": "EGFR", "result": "Negative"},
            {"name": "KRAS", "result": "G12C positive"},
            {"name": "PD-L1", "result": "TPS 80%"}
        ],
        "prior_treatments": [
            {
                "name": "Pembrolizumab",
                "type": "immunotherapy",
                "end_date": "2025-01",
                "response": "progressive disease"
            }
        ],
        "ecog_performance_status": 1,
        "lab_values": {
            "creatinine": 0.8,
            "ALT": 31,
            "ANC": 2.5
        },
        "location": {
            "city": "Boston",
            "state": "MA",
            "zip": "02215",
            "country": "USA"
        },
        "comorbidities": [],
        "last_therapy_days_ago": 150,
        "willing_to_biopsy": True
    },
    {
        "patient_id": "PT-10046",
        "name": "Edward Norton (Newly Diagnosed, Low Refractory)",
        "age": 64,
        "sex": "M",
        "diagnoses": [
            {
                "icd10_code": "C34.11",
                "description": "Stage IIIA non-small cell lung cancer",
                "stage": "IIIA",
                "date_diagnosed": "2025-05"
            }
        ],
        "biomarkers": [
            {"name": "EGFR", "result": "Negative"}
        ],
        "prior_treatments": [],
        "ecog_performance_status": 0,
        "lab_values": {
            "creatinine": 0.95,
            "ALT": 24,
            "ANC": 3.2
        },
        "location": {
            "city": "Boston",
            "state": "MA",
            "zip": "02118",
            "country": "USA"
        },
        "comorbidities": [],
        "last_therapy_days_ago": 999,
        "willing_to_biopsy": True
    },
    {
        "patient_id": "PT-10047",
        "name": "David Miller (Optimal Solid Tumor Profile)",
        "age": 52,
        "sex": "M",
        "diagnoses": [
            {
                "icd10_code": "C34.11",
                "description": "Stage IV NSCLC adenocarcinoma",
                "stage": "IV",
                "date_diagnosed": "2024-04"
            }
        ],
        "biomarkers": [
            {"name": "EGFR", "result": "Negative"},
            {"name": "ALK", "result": "Negative"},
            {"name": "PD-L1", "result": "TPS 1%"}
        ],
        "prior_treatments": [
            {
                "name": "Carboplatin + Pemetrexed",
                "type": "chemotherapy",
                "end_date": "2025-04",
                "response": "progressive disease"
            }
        ],
        "ecog_performance_status": 0,
        "lab_values": {
            "creatinine": 0.82,
            "ALT": 25,
            "ANC": 2.8
        },
        "location": {
            "city": "Newton",
            "state": "MA",
            "zip": "02458",
            "country": "USA"
        },
        "comorbidities": [],
        "last_therapy_days_ago": 45,
        "willing_to_biopsy": True
    }
]

clinical_trials = [
    {
        "nct_id": "NCT05669430",
        "title": "GV20-0251 in Solid Tumor Malignancies",
        "phase": "Phase 1 / Phase 2",
        "sponsor": "GV20 Therapeutics",
        "primary_contact": {
            "name": "Sponsor Clinical Operations",
            "email": "clinicaltrials@gv20tx.com",
            "phone": "+1-617-555-0199"
        },
        "locations": [
            {
                "facility": "Massachusetts General Hospital",
                "city": "Boston",
                "state": "Massachusetts"
            },
            {
                "facility": "Dana-Farber Cancer Institute",
                "city": "Boston",
                "state": "Massachusetts"
            }
        ],
        "interventions": ["GV20-0251", "Pembrolizumab"],
        "inclusion_criteria": "Inclusion Criteria:\n- Participants must be >= 18 years of age.\n- Previously treated, histologically-confirmed advanced solid malignancy (such as NSCLC) with progressive disease requiring therapy.\n- Patient must have progressive disease and be refractory or intolerant to standard therapies (e.g. at least 2 prior systemic lines).\n- ECOG performance status of 0 or 1.\n- Measurable disease per RECIST 1.1.",
        "exclusion_criteria": "Exclusion Criteria:\n- Symptomatic central nervous system (CNS) metastases (brain metastases).\n- Prior anti-PD-1 or anti-PD-L1 therapy.\n- Inadequate organ function (Creatinine > 1.5 mg/dL, ALT > 45 U/L, ANC < 1.5 x10^9/L).\n- Active or unstable comorbidities.",
        "url": "https://clinicaltrials.gov/study/NCT05669430",
        "rules": {
            "required_conditions": ["NSCLC", "Solid Tumor"],
            "excluded_conditions": ["Brain Metastasis", "CNS Metastasis", "Symptomatic CNS"],
            "required_biomarkers": [],
            "max_ecog": 1,
            "max_creatinine": 1.5,
            "max_alt": 45.0,
            "required_prior_pd1_exclusion": True
        }
    },
    {
        "nct_id": "NCT06112938",
        "title": "EGFR-Targeted Osimertinib Resistant NSCLC Study",
        "phase": "Phase 3 Progression Trial",
        "sponsor": "AstraZeneca Oncology",
        "primary_contact": {
            "name": "AstraZeneca Trial Helpdesk",
            "email": "clinicaltrialinfo@astrazeneca.com",
            "phone": "+1-800-236-9933"
        },
        "locations": [
            {
                "facility": "Dana-Farber Cancer Institute",
                "city": "Boston",
                "state": "Massachusetts"
            }
        ],
        "interventions": ["AZD3759", "Chemotherapy co-infusion"],
        "inclusion_criteria": "Inclusion Criteria:\n- Age >= 18 years.\n- Histologically-confirmed advanced or metastatic Non-Small Cell Lung Cancer (NSCLC).\n- Documentation of an EGFR active mutation (Exon 19 deletion or L858R substitution).\n- Documented disease progression on or after EGFR TKI therapy (such as Osimertinib).\n- ECOG performance status of 0-1.",
        "exclusion_criteria": "Exclusion Criteria:\n- Active cerebral metastases or meningitis (CNS disease).\n- Severe organ dysfunction (Creatinine > 1.5, ALT > 45 U/L).\n- Washout period less than 14 days since last systemic therapy.",
        "url": "https://clinicaltrials.gov/study/NCT06112938",
        "rules": {
            "required_conditions": ["NSCLC"],
            "excluded_conditions": ["Brain Metastasis", "Meningitis"],
            "required_biomarkers": ["EGFR"],
            "max_ecog": 1,
            "max_creatinine": 1.5,
            "max_alt": 45,
            "required_prior_pd1_exclusion": False
        }
    },
    {
        "nct_id": "NCT08991200",
        "title": "NCI Pediatric and Adolescent Lymphoma & Solid Tumor Trial",
        "phase": "Phase 1 Cohort Expansion",
        "sponsor": "National Cancer Institute (NCI)",
        "primary_contact": {
            "name": "NCI Patient Center Liaison",
            "email": "nciclinical@nih.gov",
            "phone": "+1-301-444-0100"
        },
        "locations": [
            {
                "facility": "Boston Children's Hospital",
                "city": "Boston",
                "state": "Massachusetts"
            }
        ],
        "interventions": ["NCI-9981 Targeted Peptide"],
        "inclusion_criteria": "Inclusion Criteria:\n- Patient age major limits: >= 12 years and <= 30 years old.\n- Histologically confirmed solid tumors (including NSCLCs) or lymphoma refractory to standard treatment.\n- ECOG status 0, 1 or 2.",
        "exclusion_criteria": "Exclusion Criteria:\n- Uncontrolled infections or chronic cardiovascular conditions.\n- Failure of vital organ reserves (creatinine > 1.8, ALT > 60).",
        "url": "https://clinicaltrials.gov/study/NCT08991200",
        "rules": {
            "required_conditions": ["NSCLC", "Solid Tumor", "Lymphoma"],
            "excluded_conditions": ["Cardiovascular Condition", "Uncontrolled Infection"],
            "required_biomarkers": [],
            "max_ecog": 2,
            "max_creatinine": 1.8,
            "max_alt": 60,
            "required_prior_pd1_exclusion": False
        }
    }
]
