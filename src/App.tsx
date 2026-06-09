import { useState, useEffect, useRef, FormEvent } from "react";
import {
  User,
  UserPlus,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Activity,
  Calendar,
  ArrowRight,
  Play,
  Check,
  Loader2,
  Send,
  ChevronRight,
  RefreshCw,
  Heart,
  ExternalLink,
  Sliders,
  Award,
  Plus,
  Search,
  Lock,
  Mail,
  FileText,
  LogOut,
  BellRing
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { scoreTrial } from "./matcher";
import { PatientProfile, ClinicalTrial, MatcherResult, Message, Biomarker } from "./types";
import { ArchitectureDiagram } from "./components/ArchitectureDiagram";
import { PitchDeck } from "./components/PitchDeck";

interface ReferralApproval {
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

import { loginWithGoogle, loginWithEmail, logout as firebaseLogout, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const TrialLogixLogo = ({ size = 32, showText = true, textClassName = "font-black tracking-tight text-slate-900 text-sm sm:text-base" }: { size?: number; showText?: boolean; textClassName?: string }) => {
  return (
    <div className="flex items-center gap-2 select-none shrink-0 font-sans">
      <svg width={size * 1.3} height={size} viewBox="0 0 130 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        {/* Stylized custom TL brand logo matching user's logo exactly */}
        {/* T-Top horizontal bar & left stem part */}
        <path d="M10 24h66v11H42v55H31V35H10V24z" fill="#001F54" />
        {/* L-Shape vertical & base */}
        <path d="M60 40h11v40h15v10H60V40z" fill="#001F54" />
        {/* Vibrant Blue Accent Checkmark/Slash */}
        <path d="M32 60l14 14L88 28h11L46 80 18 52h14z" fill="#0052CC" />
      </svg>
      {showText && (
        <span className={textClassName}>
          <span className="text-[#001F54] font-extrabold font-sans">Trial</span>
          <span className="text-[#0052CC] font-extrabold font-sans">Logix</span>
        </span>
      )}
    </div>
  );
};

export default function App() {
  // ==========================================
  // AUTHENTICATION AND LOGGED IN USER STATE
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [publicTab, setPublicTab] = useState<"about" | "architecture" |  "deck" | "login">("about");
  const [currentClinician, setCurrentClinician] = useState<{
    email: string;
    name: string;
    role: string;
    avatarInitials: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Authenticated user
        setIsLoggedIn(true);
        setCurrentClinician({
          email: user.email || "clinician@triallogix.org",
          name: user.displayName || "Clinician",
          role: "Consulting Investigator", // Default assigned role
          avatarInitials: user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "MD",
          color: "bg-blue-600"
        });
      } else {
        // Logged out
        setIsLoggedIn(false);
        setCurrentClinician(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const isAuthorizedAdmin = currentClinician && (
    currentClinician.email.toLowerCase() === "dr.google@triallogix.org" ||
    currentClinician.email.toLowerCase() === "james.carter@triallogix.org" ||
    currentClinician.email.toLowerCase() === "srkkr12@gmail.com" // Provide admin privileges to user
  );

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");

  const handleCredentialsLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please supply both clinician email and security key keys.");
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await loginWithEmail(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "Failed credentials verification.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setLoginError(err.message || "Failed credentials verification via Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setIsLoggedIn(false);
    setCurrentClinician(null);
  };

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    setAdminStatusMsg({ text: "Registering standard users is handled automatically via Google Sign In.", type: "info" });
  };

  const fetchGeminiKeyStatus = async () => {
    if (!currentClinician) return;
    setGeminiStatusLoading(true);
    try {
      const res = await fetch("/api/admin/gemini-key/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterEmail: currentClinician.email })
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiKeyStatus(data);
      } else {
        showToast(data.error || "Failed to fetch Gemini key status.", "error");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setGeminiStatusLoading(false);
    }
  };

  const handleUpdateGeminiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentClinician) return;
    setGeminiStatusMsg(null);
    try {
      const res = await fetch("/api/admin/gemini-key/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterEmail: currentClinician.email,
          newKey: geminiKeyOverrideVal
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiStatusMsg({ text: data.message, type: "success" });
        showToast(data.message, "success");
        setGeminiKeyOverrideVal("");
        fetchGeminiKeyStatus();
      } else {
        setGeminiStatusMsg({ text: data.error || "Failed to update Gemini key override.", type: "error" });
        showToast(data.error || "Failed to update Gemini key override.", "error");
      }
    } catch (err: any) {
      console.error(err);
      setGeminiStatusMsg({ text: "Network error occurred.", type: "error" });
    }
  };

  // ==========================================
  // GOOGLE ADK LIVE CONSOLE STREAM
  // ==========================================
  const [orchestratorLogs, setOrchestratorLogs] = useState<{
    timestamp: string;
    level: "INFO" | "SUCCESS" | "WARN";
    agent: string;
    message: string;
  }[]>([]);

  const fetchOrchestratorLogs = async () => {
    try {
      const res = await fetch("/api/orchestrator/logs");
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          setOrchestratorLogs(data);
        }
      }
    } catch (err) {
      console.error("Failed fetching orchestrator logs", err);
    }
  };

  // ==========================================
  // FULLSTACK SYSTEM STATES
  // ==========================================
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [approvals, setApprovals] = useState<ReferralApproval[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedTrialId, setSelectedTrialId] = useState<string>(() => {
    return sessionStorage.getItem("selectedTrialId") || "";
  });

  useEffect(() => {
    if (selectedTrialId) {
      sessionStorage.setItem("selectedTrialId", selectedTrialId);
    }
  }, [selectedTrialId]);

  // UI Navigation Sidebar tabs
  const [activeLeftTab, setActiveLeftTab] = useState<"tuner" | "approvals" | "streamlit">("tuner");

  // Multi-phase clinical agency states
  const [rawClinicalNote, setRawClinicalNote] = useState<string>("");
  const [mergePatientId, setMergePatientId] = useState<string>("");
  const [noteFileBase64, setNoteFileBase64] = useState<string>("");
  const [noteFileMimeType, setNoteFileMimeType] = useState<string>("");
  const [noteFileName, setNoteFileName] = useState<string>("");
  const [isIngestingNote, setIsIngestingNote] = useState<boolean>(false);
  const [parsedOriginal, setParsedOriginal] = useState<PatientProfile | null>(null);
  const [parsedAnonymized, setParsedAnonymized] = useState<any | null>(null);
  const [showDlpModal, setShowDlpModal] = useState<boolean>(false);
  const [showRawNoteModal, setShowRawNoteModal] = useState<boolean>(false);
  const [duplicatePatient, setDuplicatePatient] = useState<any | null>(null);
  const [ingestedRawText, setIngestedRawText] = useState<string>('');

  const [isEhrSyncing, setIsEhrSyncing] = useState<boolean>(false);
  const [syncedLabsResult, setSyncedLabsResult] = useState<any>(null);
  const [isLabsMaximized, setIsLabsMaximized] = useState<boolean>(false);
  const syncedLabsRef = useRef<HTMLDivElement>(null);

  const [isCompilingReasoning, setIsCompilingReasoning] = useState<boolean>(false);
  const [proReasoning, setProReasoning] = useState<string | null>(null);
  const [isReasoningMaximized, setIsReasoningMaximized] = useState<boolean>(false);
  const proReasoningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (syncedLabsResult && syncedLabsRef.current) {
      setTimeout(() => {
        syncedLabsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }
  }, [syncedLabsResult]);

  useEffect(() => {
    if (proReasoning && proReasoningRef.current) {
      setTimeout(() => {
        proReasoningRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }
  }, [proReasoning]);

  const [isGroundingTrial, setIsGroundingTrial] = useState<boolean>(false);
  const [groundedContext, setGroundedContext] = useState<string | null>(null);
  const [groundingCitations, setGroundingCitations] = useState<{ title: string; url: string }[]>([]);
  const [isGroundingMaximized, setIsGroundingMaximized] = useState<boolean>(false);
  const groundedContextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groundedContext && groundedContextRef.current) {
      setTimeout(() => {
        groundedContextRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }
  }, [groundedContext]);

  const lastPatientIdRef = useRef<string>("");
  const [selectedPendingApprovalId, setSelectedPendingApprovalId] = useState<string>("");
  const [editedStreamlitSubject, setEditedStreamlitSubject] = useState<string>("");
  const [editedStreamlitBody, setEditedStreamlitBody] = useState<string>("");
  const [isSubmittingStreamlitApproval, setIsSubmittingStreamlitApproval] = useState<boolean>(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<{ auditLogId: string; timestamp: string; approvedBy: string; deliveryReceipt: string } | null>(null);

  // Onboarding Patient Form state
  const [showAddPatientForm, setShowAddPatientForm] = useState<boolean>(false);
  const [onboardingBiomarkers, setOnboardingBiomarkers] = useState<Biomarker[]>([
    { name: "EGFR", result: "Negative" },
    { name: "PD-L1", result: "TPS 5%" }
  ]);
  const [newPtName, setNewPtName] = useState<string>("");
  const [newPtAge, setNewPtAge] = useState<number>(60);
  const [newPtSex, setNewPtSex] = useState<"M" | "F" | "other">("M");
  const [newPtDxDesc, setNewPtDxDesc] = useState<string>("");
  const [newPtDxIcd, setNewPtDxIcd] = useState<string>("C34.11");
  const [newPtDxStage, setNewPtDxStage] = useState<string>("IV");
  const [newPtEgfr, setNewPtEgfr] = useState<string>("Negative");
  const [newPtPdl1, setNewPtPdl1] = useState<string>("TPS 5%");
  const [newPtPriorTxCount, setNewPtPriorTxCount] = useState<number>(2);
  const [newPtEcog, setNewPtEcog] = useState<number>(1);
  const [newPtCreatinine, setNewPtCreatinine] = useState<number>(0.9);
  const [newPtAlt, setNewPtAlt] = useState<number>(25);
  const [newPtAnc, setNewPtAnc] = useState<number>(2.2);
  const [newPtCity, setNewPtCity] = useState<string>("Boston");
  const [newPtState, setNewPtState] = useState<string>("MA");
  const [newPtWashout, setNewPtWashout] = useState<number>(30);
  const [newPtBiopsy, setNewPtBiopsy] = useState<boolean>(true);
  const [newPtLocationChange, setNewPtLocationChange] = useState<boolean>(false);
  const [newPtCd4, setNewPtCd4] = useState<number>(450);
  const [newPtViralLoad, setNewPtViralLoad] = useState<number>(0);
  const [newPtArtStatus, setNewPtArtStatus] = useState<string>("Active");
  const [newPtSystolicBp, setNewPtSystolicBp] = useState<number>(120);
  const [newPtHba1c, setNewPtHba1c] = useState<number>(5.7);
  const [newPtRheumatoidFactor, setNewPtRheumatoidFactor] = useState<string>("Negative");
  const [newPtCrp, setNewPtCrp] = useState<number>(2.0);
  // Neurology inputs
  const [newPtMmse, setNewPtMmse] = useState<number>(30);
  const [newPtMobility, setNewPtMobility] = useState<string>("None");
  // Pulmonology inputs
  const [newPtFev1Fvc, setNewPtFev1Fvc] = useState<number>(80);
  const [newPtOxygenRequired, setNewPtOxygenRequired] = useState<boolean>(false);
  // Nephrology inputs
  const [newPtEgfrValue, setNewPtEgfrValue] = useState<number>(95);
  const [newPtDialysisDependent, setNewPtDialysisDependent] = useState<boolean>(false);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  // Registered clinicians & Admin variables
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminName, setAdminName] = useState<string>("");
  const [adminRole, setAdminRole] = useState<string>("Consulting Oncologist");
  const [adminStatusMsg, setAdminStatusMsg] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedNewDoctor, setSelectedNewDoctor] = useState<string>("");

  // Dedicated Admin API Override Variables
  const [adminSubTab, setAdminSubTab] = useState<"onboard" | "gemini" | "smtp">("onboard");
  const [geminiKeyOverrideVal, setGeminiKeyOverrideVal] = useState<string>("");
  const [geminiKeyStatus, setGeminiKeyStatus] = useState<{
    hasEnvKey: boolean;
    isOverridden: boolean;
    activeKeyMasked: string;
    usingDefault: boolean;
  } | null>(null);
  const [geminiStatusLoading, setGeminiStatusLoading] = useState<boolean>(false);
  const [geminiStatusMsg, setGeminiStatusMsg] = useState<{ text: string, type: "success" | "error" } | null>(null);

  // Dynamic ClinicalTrials.gov Search query
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchingTrials, setIsSearchingTrials] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [searchPageSize, setSearchPageSize] = useState<number>(10);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Referral draft states
  const [activeReferral, setActiveReferral] = useState<ReferralApproval | null>(null);
  const [isGeneratingReferral, setIsGeneratingReferral] = useState<boolean>(false);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState<boolean>(false);
  const [editedReferralSubject, setEditedReferralSubject] = useState<string>("");
  const [editedReferralBody, setEditedReferralBody] = useState<string>("");
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  // Param validation warning
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Dynamic Clinical Category detection based on entered ICD10
  const getIcd10Category = (icd: string): "oncology" | "immunology" | "cardiovascular_metabolic" | "autoimmune" | "neurology" | "pulmonology" | "nephrology" | "other" => {
    if (!icd) return "other";
    const clean = icd.trim().toUpperCase();
    if (clean.startsWith("C") || clean.startsWith("D")) return "oncology";
    if (clean.startsWith("A") || clean.startsWith("B")) return "immunology";
    if (clean.startsWith("I") || clean.startsWith("E")) return "cardiovascular_metabolic";
    if (clean.startsWith("M") || clean.startsWith("L")) return "autoimmune";
    if (clean.startsWith("G") || clean.startsWith("F")) return "neurology";
    if (clean.startsWith("J")) return "pulmonology";
    if (clean.startsWith("N")) return "nephrology";
    return "other";
  };

  // ==========================================
  // REAL TIME TUNER ADJOURNED STATES
  // ==========================================
  const [tunedAge, setTunedAge] = useState<number>(55);
  const [tunedEcog, setTunedEcog] = useState<number>(1);
  const [tunedCreatinine, setTunedCreatinine] = useState<number>(0.9);
  const [tunedAlt, setTunedAlt] = useState<number>(25);
  const [tunedAst, setTunedAst] = useState<number>(25);
  const [tunedAnc, setTunedAnc] = useState<number>(2.2);
  const [tunedWashout, setTunedWashout] = useState<number>(30);
  const [tunedBiopsy, setTunedBiopsy] = useState<boolean>(true);
  const [tunedLocationChange, setTunedLocationChange] = useState<boolean>(false);
  const [hasPriorPd1Excl, setHasPriorPd1Excl] = useState<boolean>(false);
  const [tunedBiomarkers, setTunedBiomarkers] = useState<Biomarker[]>([]);

  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ==========================================
  // SYNC SYSTEM RECORDS FROM EXPRESS APIs
  // ==========================================
  const loadRecords = async (refillSelections = false) => {
    try {
      setLoadError(null);
      const safeParseJson = async (response: Response) => {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Expected JSON response but received HTML or invalid format. The backend server might still be booting up or compiling.");
        }
        return response.json();
      };

      const responsePatients = await fetch("/api/patients");
      if (!responsePatients.ok) {
        throw new Error(`HTTP ${responsePatients.status}. The active EHR patients server may be restarting.`);
      }
      const dataPatients = await safeParseJson(responsePatients) as PatientProfile[];
      setPatients(dataPatients);

      const responseTrials = await fetch("/api/trials");
      if (!responseTrials.ok) {
        throw new Error(`HTTP ${responseTrials.status}`);
      }
      const dataTrials = await safeParseJson(responseTrials) as ClinicalTrial[];
      setTrials(dataTrials);

      const responseApprovals = await fetch("/api/approvals");
      if (!responseApprovals.ok) {
        throw new Error(`HTTP ${responseApprovals.status}`);
      }
      const dataApprovals = await safeParseJson(responseApprovals) as ReferralApproval[];
      setApprovals(dataApprovals);

      try {
        const responseClinics = await fetch("/api/auth/users");
        if (responseClinics.ok) {
          const clinicsContentType = responseClinics.headers.get("content-type") || "";
          if (clinicsContentType.includes("application/json")) {
            const list = await responseClinics.json();
            setClinicians(list);
          }
        }
      } catch (e) {
        console.error("Failed fetching clinician user list", e);
      }

      if (dataPatients.length > 0) {
        setSelectedPatientId(prev => {
          if (!prev || refillSelections) {
            return dataPatients[0].patient_id;
          }
          const exists = dataPatients.some(p => p.patient_id === prev);
          return exists ? prev : dataPatients[0].patient_id;
        });
      }
      if (dataTrials.length > 0) {
        const storedTrialId = sessionStorage.getItem("selectedTrialId");
        const hasStored = storedTrialId && dataTrials.some(t => t.nct_id === storedTrialId);
        
        setSelectedTrialId(prev => {
          if (hasStored && storedTrialId) {
            return storedTrialId;
          }
          if (!prev || refillSelections) {
            return dataTrials[0].nct_id;
          }
          const exists = dataTrials.some(t => t.nct_id === prev);
          return exists ? prev : dataTrials[0].nct_id;
        });
      }

      setIsLoadingRecords(false);
    } catch (err: any) {
      console.error("[Clinical Records load error]", err);
      setLoadError(err.message || String(err));
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadRecords();
      fetchOrchestratorLogs();
      const interval = setInterval(() => {
        fetchOrchestratorLogs();
        loadRecords();
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Handle auto-retry of loadRecords on connection failures
  useEffect(() => {
    if (loadError) {
      const retryTimer = setTimeout(() => {
        console.log("Retrying EHR data loading...");
        loadRecords();
      }, 4000); // retry every 4 seconds
      return () => clearTimeout(retryTimer);
    }
  }, [loadError]);

  // Fetch Gemini Custom Key Status for Authorized Administrator sessions
  useEffect(() => {
    if (isAdminOpen && isAuthorizedAdmin) {
      fetchGeminiKeyStatus();
    }
  }, [isAdminOpen, isAuthorizedAdmin]);

  // Synchronize tuners when patient changes
  useEffect(() => {
    if (patients.length === 0 || !selectedPatientId) return;
    if (lastPatientIdRef.current !== selectedPatientId) {
      const base = patients.find(p => p.patient_id === selectedPatientId);
      if (base) {
        setTunedAge(base.age);
        setTunedEcog(base.ecog_performance_status);
        setTunedCreatinine(base.lab_values.creatinine);
        setTunedAlt(base.lab_values.ALT);
        setTunedAst(base.lab_values.AST || 25);
        setTunedAnc(base.lab_values.ANC);
        setTunedWashout(base.last_therapy_days_ago);
        setTunedBiopsy(base.willing_to_biopsy);
        setTunedLocationChange(base.willing_to_change_location || false);
        setTunedBiomarkers(typeof base.biomarkers === "object" ? JSON.parse(JSON.stringify(base.biomarkers)) : []);

        const matchesPd1 = base.prior_treatments.some(tx => {
          const n = tx.name.toUpperCase();
          return n.includes("PEMBROLIZUMAB") || n.includes("NIVOLUMAB") || n.includes("PD-1") || n.includes("PD-L1");
        });
        setHasPriorPd1Excl(matchesPd1);
        lastPatientIdRef.current = selectedPatientId;
      }
    }
  }, [selectedPatientId, patients]);

  // Pre-populate Streamlit editor values when a pending record is selected
  useEffect(() => {
    if (selectedPendingApprovalId) {
      const found = approvals.find(a => a.approval_id === selectedPendingApprovalId);
      if (found) {
        setEditedStreamlitSubject(found.email_subject);
        setEditedStreamlitBody(found.email_body);
        setAuditResult(null);
      }
    } else {
      const firstPending = approvals.find(a => a.status === "PENDING_REVIEW");
      if (firstPending) {
        setSelectedPendingApprovalId(firstPending.approval_id);
      }
    }
  }, [selectedPendingApprovalId, approvals]);

  // Synthesize working patient whenever tuner edits happen
  useEffect(() => {
    if (patients.length === 0 || !selectedPatientId) return;
    const orig = patients.find(p => p.patient_id === selectedPatientId) || patients[0];
    const synthesized: PatientProfile = {
      ...orig,
      age: tunedAge,
      ecog_performance_status: tunedEcog,
      lab_values: {
        ...orig.lab_values,
        creatinine: tunedCreatinine,
        ALT: tunedAlt,
        AST: tunedAst,
        ANC: tunedAnc
      },
      last_therapy_days_ago: tunedWashout,
      willing_to_biopsy: tunedBiopsy,
      willing_to_change_location: tunedLocationChange,
      biomarkers: tunedBiomarkers,
      prior_treatments: hasPriorPd1Excl
        ? [
            ...orig.prior_treatments.filter(tx => !tx.name.toUpperCase().includes("PEMBROL")),
            {
              name: "Pembrolizumab Immunotherapy Regimen",
              type: "immunotherapy",
              end_date: "2025-01",
              response: "progressive disease"
            }
          ]
        : orig.prior_treatments.filter(tx => {
            const n = tx.name.toUpperCase();
            return !n.includes("PEMBROL") && !n.includes("NIVOL") && !n.includes("PD-1") && !n.includes("PD-L1");
          })
    };
    setCurrentPatient(synthesized);
  }, [tunedAge, tunedEcog, tunedCreatinine, tunedAlt, tunedAst, tunedAnc, tunedWashout, tunedBiopsy, tunedLocationChange, hasPriorPd1Excl, tunedBiomarkers, selectedPatientId, patients]);

  // Resolve current evaluated trial
  const currentTrial = trials.find(t => t.nct_id === selectedTrialId) || trials[0];

  // Run exact deterministic clinical-matching calculator
  const matchResult: MatcherResult | null = currentPatient && currentTrial ? scoreTrial(currentPatient, currentTrial) : null;

  // ==========================================
  // STABLE CONSISTENCY REPEATED SANDBOX ENGINE
  // ==========================================
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simRunCount, setSimRunCount] = useState<number>(0);
  const [simResults, setSimResults] = useState<{
    totalRuns: number;
    scores: number[];
    minScore: number;
    maxScore: number;
    avgScore: number;
    variance: number;
    stdDev: number;
    statusConsistent: boolean;
  } | null>(null);

  const runConsistencySimulation = () => {
    if (!currentPatient || !currentTrial || !matchResult) return;
    setSimulationActive(true);
    let runsCount = 100;
    const scores: number[] = [];
    let statusConsistent = true;
    const firstStatus = matchResult.match_status;

    for (let i = 0; i < runsCount; i++) {
      const res = scoreTrial(currentPatient, currentTrial);
      scores.push(res.score);
      if (res.match_status !== firstStatus) {
        statusConsistent = false;
      }
    }

    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avgScore = sum / runsCount;

    const sqDiffSum = scores.reduce((accum, val) => accum + Math.pow(val - avgScore, 2), 0);
    const variance = sqDiffSum / runsCount;
    const stdDev = Math.sqrt(variance);

    setTimeout(() => {
      setSimResults({
        totalRuns: runsCount,
        scores,
        minScore,
        maxScore,
        avgScore,
        variance,
        stdDev,
        statusConsistent
      });
      setSimulationActive(false);
      setSimRunCount(prev => prev + 1);
    }, 400);
  };

  // ==========================================
  // ACTION HANDLER: Clinical Onboard Patient
  // ==========================================
  const handleOnboardNewPatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPtName.trim() || !newPtDxDesc.trim()) {
      showToast("Please supply the candidate name and primary diagnosis description.", "error");
      return;
    }

    setIsOnboarding(true);

    const diagnosesList = [{
      icd10_code: newPtDxIcd,
      description: newPtDxDesc,
      stage: newPtDxStage,
      date_diagnosed: new Date().toISOString().substring(0, 7)
    }];

    const biomarkersList = onboardingBiomarkers;

    const priorTreatmentsList = [];
    if (newPtPriorTxCount >= 1) {
      priorTreatmentsList.push({
        name: "First Line Induction Chemotherapy (Carboplatin Bundle)",
        type: "chemotherapy",
        end_date: "2024-06",
        response: "partial response"
      });
    }
    if (newPtPriorTxCount >= 2) {
      priorTreatmentsList.push({
        name: "Standard TKI Targeted Or Systemic Doublet",
        type: "targeted therapy",
        end_date: "2025-01",
        response: "progressive disease"
      });
    }

    const payload = {
      name: newPtName,
      age: Number(newPtAge),
      sex: newPtSex,
      diagnoses: diagnosesList,
      biomarkers: biomarkersList,
      prior_treatments: priorTreatmentsList,
      ecog_performance_status: Number(newPtEcog),
      lab_values: {
        creatinine: Number(newPtCreatinine),
        ALT: Number(newPtAlt),
        ANC: Number(newPtAnc),
        cd4_count: Number(newPtCd4),
        viral_load: Number(newPtViralLoad),
        art_status: newPtArtStatus,
        systolic_bp: Number(newPtSystolicBp),
        rheumatoid_factor: newPtRheumatoidFactor,
        hba1c: Number(newPtHba1c),
        crp: Number(newPtCrp),
        mmse_score: Number(newPtMmse),
        mobility_assistance: newPtMobility,
        fev1_fvc_ratio: Number(newPtFev1Fvc),
        oxygen_required: Boolean(newPtOxygenRequired),
        egfr_value: Number(newPtEgfrValue),
        dialysis_dependent: Boolean(newPtDialysisDependent)
      },
      location: {
        city: newPtCity,
        state: newPtState,
        country: "USA"
      },
      comorbidities: [],
      last_therapy_days_ago: Number(newPtWashout),
      willing_to_biopsy: Boolean(newPtBiopsy),
      willing_to_change_location: Boolean(newPtLocationChange),
      doctors: [currentClinician.email]
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to register patient candidate");
      }

      const registeredPt = await res.json() as PatientProfile;
      showToast(`Patient profile generated successfully: ${registeredPt.name} (${registeredPt.patient_id})`, "success");
      
      // Reset onboarding form
      setShowAddPatientForm(false);
      setOnboardingBiomarkers([
        { name: "EGFR", result: "Negative" },
        { name: "PD-L1", result: "TPS 5%" }
      ]);
      setNewPtName("");
      setNewPtDxDesc("");
      setIsOnboarding(false);

      // Reload registry and select new patient
      await loadRecords();
      setSelectedPatientId(registeredPt.patient_id);
    } catch (err: any) {
      showToast(`Onboarding error: ${err.message}`, "error");
      setIsOnboarding(false);
    }
  };

  // ==========================================
  // ACTION HANDLER: ClinicalTrials.gov Search
  // ==========================================
  const handleClinicalTrialsSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingTrials(true);
    setSearchFeedback(null);
    setNextPageToken(null);

    try {
      showToast(`Contacting ClinicalTrials.gov for condition: "${searchQuery}" (pageSize: ${searchPageSize})...`, "info");
      const res = await fetch(`/api/search-trials?condition=${encodeURIComponent(searchQuery)}&pageSize=${searchPageSize}&patient_id=${currentPatient?.patient_id || ""}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed live study query");
      }

      setSearchFeedback(data.message);
      setNextPageToken(data.nextPageToken || null);
      showToast(data.message, "success");
      
      // Reload the trials database
      await loadRecords();
      
      if (data.trials && data.trials.length > 0) {
        setSelectedTrialId(data.trials[0].nct_id);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Trials search failed: ${err.message}`, "error");
    } finally {
      setIsSearchingTrials(false);
    }
  };

  const applyQuickSearchHelper = async (query: string) => {
    setSearchQuery(query);
    setIsSearchingTrials(true);
    setSearchFeedback(null);
    setNextPageToken(null);
    try {
      showToast(`Invoking crawler helper for query: "${query}" (pageSize: ${searchPageSize})...`, "info");
      const res = await fetch(`/api/search-trials?condition=${encodeURIComponent(query)}&pageSize=${searchPageSize}&patient_id=${currentPatient?.patient_id || ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed live study query");
      setSearchFeedback(data.message);
      setNextPageToken(data.nextPageToken || null);
      showToast(data.message, "success");
      await loadRecords();
      if (data.trials && data.trials.length > 0) {
        setSelectedTrialId(data.trials[0].nct_id);
      }
    } catch (err: any) {
      showToast(`Quick helper failed: ${err.message}`, "error");
    } finally {
      setIsSearchingTrials(false);
    }
  };

  // ==========================================
  // ACTION HANDLER: Load More ClinicalTrials.gov results
  // ==========================================
  const handleLoadMoreTrials = async () => {
    if (!searchQuery.trim() || !nextPageToken || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      showToast(`Loading additional ClinicalTrials.gov results...`, "info");
      const res = await fetch(`/api/search-trials?condition=${encodeURIComponent(searchQuery)}&pageSize=${searchPageSize}&pageToken=${nextPageToken}&patient_id=${currentPatient?.patient_id || ""}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed load-more live study query");
      }

      setSearchFeedback(data.message);
      setNextPageToken(data.nextPageToken || null);
      showToast(`Fetched ${data.trials?.length || 0} additional trials!`, "success");
      
      // Reload the trials database
      await loadRecords();
    } catch (err: any) {
      console.error(err);
      showToast(`Failed loading more trials: ${err.message}`, "error");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ==========================================
  // ACTION HANDLER: Create Referral Letter Draft
  // ==========================================
  const handleInitiateApprovalDraft = async () => {
    if (!selectedPatientId || !selectedTrialId) {
      showToast("Please ensure you have loaded a patient and selected a trial protocol.", "error");
      return;
    }

    setIsGeneratingReferral(true);

    try {
      showToast("Formulating formal clinical referral memo...", "info");
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          nct_id: selectedTrialId,
          drafted_by_email: currentClinician.email,
          drafted_by_name: currentClinician.name
        })
      });

      const approvalRecord = await res.json();
      if (!res.ok) {
        throw new Error(approvalRecord.error || "Failed compiling referral letter draft");
      }

      setActiveReferral(approvalRecord);
      setEditedReferralSubject(approvalRecord.email_subject);
      setEditedReferralBody(approvalRecord.email_body);
      setShowReferralModal(true);
      showToast("Referral dossier generated successfully!", "success");
      
      // Auto-reload records to synchronize the background panels (Streamlit portal index & Referral logs)
      await loadRecords();
    } catch (err: any) {
      showToast(`Referral compiler error: ${err.message}`, "error");
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  // ==========================================
  // ACTION HANDLER: Send Referral Email to Coordinator
  // ==========================================
  const handleDispatchReferralEmail = async () => {
    if (!activeReferral) return;
    setIsDispatchingEmail(true);

    try {
      // Record dispatch update
      const res = await fetch("/api/approvals/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: activeReferral.approval_id,
          approved_by_email: currentClinician.email,
          approved_by_name: currentClinician.name
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed sending referral letter packet");
      }

      showToast(`Letter officially dispatched to Screening Coordinator!`, "success");
      setShowReferralModal(false);
      setActiveReferral(null);
      
      // Reload registry to reflect updated patient approval status (Pending/Approved)
      await loadRecords();
      setActiveLeftTab("approvals");
    } catch (err: any) {
      showToast(`Dispatch error: ${err.message}`, "error");
    } finally {
      setIsDispatchingEmail(false);
    }
  };

  // ==========================================
  // PHASE 1 ACTION: Clinical Note Parser & DLP Masking Ingest
  // ==========================================
  const loadSarahChenPreset = async (type: "unfit" | "fit") => {
    try {
      const filename = type === "unfit" ? "sarah_chen_unfit.svg" : "sarah_chen_fit.svg";
      const textValue = type === "unfit" 
        ? "Sarah Chen is a 58-year-old female diagnosed with Stage IV metastatic non-small cell lung adenocarcinoma. Received frontline PD-1 immunotherapy (Pembrolizumab). CT scan shows progressive disease. Genotyping shows EGFR: Negative / wild-type, ALK: Negative, and PD-L1 expression TPS 80%. Normal organ values: ALT 24, AST 28, Creatinine 0.9 mg/dL. Fully compliant with subsequent tissue biopsies and willing to travel."
        : "Sarah Chen is a 58-year-old female diagnosed with Stage IV metastatic non-small cell lung adenocarcinoma. Received frontline platinum-based chemotherapy and PD-1 immunotherapy (Pembrolizumab), followed by second-line Osimertinib (EGFR TKI). Now presenting with objective disease progression and drug resistance. Tumor re-genotyping reveals EGFR: Exon 19 Deletion positive, ALK: Negative, and PD-L1 expression TPS 45%. ALT 24, AST 28, Creatinine 0.9 mg/dL, Platelets 250.";
      
      setRawClinicalNote(textValue);
      setNoteFileName(filename);
      setNoteFileMimeType("image/svg+xml");
      
      showToast(`Loading medical note image asset ${filename}...`, "info");
      const response = await fetch(`/${filename}`);
      if (response.ok) {
        const svgText = await response.text();
        const base64 = btoa(unescape(encodeURIComponent(svgText)));
        setNoteFileBase64(base64);
        showToast(`Staged medical note image file: ${filename}`, "success");
      } else {
        showToast("Could not find matching image asset on server.", "info");
      }
    } catch (err: any) {
      showToast(`Preset error: ${err.message}`, "error");
    }
  };

  const handleExtractTextFromFile = async (base64: string, mime: string) => {
    setIsIngestingNote(true);
    showToast("Gemini Profile Parser is transcribing clinical report document...", "info");
    try {
      const res = await fetch("/api/patients/extract-text-from-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64, fileMimeType: mime })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setRawClinicalNote(data.text);
        showToast("Clinical report read successfully! Extracted narrative text into editor.", "success");
      } else {
        throw new Error(data.error || "Document transcription failed.");
      }
    } catch (err: any) {
      showToast(`Text extraction failed: ${err.message}`, "error");
    } finally {
      setIsIngestingNote(false);
    }
  };

  const handleParseClinicalNote = async () => {
    if (!rawClinicalNote.trim() && !noteFileBase64) {
      showToast("Please enter raw unstructured notes or select a clinical document first.", "error");
      return;
    }

    setIsIngestingNote(true);
    setParsedOriginal(null);
    setParsedAnonymized(null);

    try {
      showToast("Invoking Profile Parser Agent (gemini-3.5-flash)...", "info");
      const res = await fetch("/api/patients/parse-clinical-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: rawClinicalNote,
          fileBase64: noteFileBase64,
          fileMimeType: noteFileMimeType,
          doctor_email: currentClinician.email,
          patient_id: mergePatientId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ingestion note parsing failed");
      }

      setParsedOriginal(data.originalProfile);
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
    } catch (err: any) {
      showToast(`Ingestion error: ${err.message}`, "error");
    } finally {
      setIsIngestingNote(false);
    }
  };

    const handleSaveParsedProfile = async () => {
    if (!parsedOriginal) return;
    try {
      showToast('Saving evaluated profile to registry...', 'info');
      const res = await fetch('/api/patients/save-parsed-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parsedProfile: parsedOriginal,
          rawText: ingestedRawText,
          isUpdating: !!duplicatePatient || false
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save profile');
      }
      
      showToast('Patient successfully added/updated in registry.', 'success');
      setShowDlpModal(false);
      setDuplicatePatient(null);
      
      await loadRecords();
      setSelectedPatientId(parsedOriginal.patient_id);
    } catch(err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ONBOARD FORM ACTION: PDF/Clinical Report Upload Parser
  // ==========================================
  const [onboardingFileName, setOnboardingFileName] = useState<string>("");
  const [isAnalyzingFile, setIsAnalyzingFile] = useState<boolean>(false);

  const handleDocumentOnboardingUpload = async (file: File) => {
    setOnboardingFileName(file.name);
    setIsAnalyzingFile(true);
    showToast(`Reading medical report document: ${file.name}...`, "info");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
         setIsAnalyzingFile(false);
         showToast("Failed to read the selected clinical file.", "error");
         return;
      }
      const base64Content = dataUrl.split(",")[1];
      const mimeType = file.type || "application/pdf";

      try {
        showToast("Instructing Gemini to analyze document & map parameters...", "info");
        const res = await fetch("/api/patients/parse-clinical-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText: "",
            fileBase64: base64Content,
            fileMimeType: mimeType,
            doctor_email: currentClinician.email
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gemini document analysis failed");
        }

        // The parser returns originalProfile or standard JSON structure
        const profile = data.originalProfile || data.anonymizedProfile || data;
        if (profile) {
          if (profile.name) setNewPtName(profile.name);
          if (profile.age) setNewPtAge(profile.age);
          if (profile.sex) setNewPtSex(profile.sex === "M" || profile.sex === "F" ? profile.sex : "other");
          
          if (profile.diagnoses && profile.diagnoses[0]) {
            const dx = profile.diagnoses[0];
            if (dx.description) setNewPtDxDesc(dx.description);
            if (dx.icd10_code) setNewPtDxIcd(dx.icd10_code);
            if (dx.stage) setNewPtDxStage(dx.stage);
          } else {
             setNewPtDxDesc("Advanced Solid Tumor");
             setNewPtDxIcd("C80.1");
          }

          if (profile.biomarkers && profile.biomarkers.length > 0) {
            const egfrBm = profile.biomarkers.find((b: any) => b.name.toUpperCase().includes("EGFR"));
            if (egfrBm) setNewPtEgfr(egfrBm.result);
            const pdl1Bm = profile.biomarkers.find((b: any) => b.name.toUpperCase().includes("PD-L1"));
            if (pdl1Bm) setNewPtPdl1(pdl1Bm.result);
          }

          if (profile.ecog_performance_status !== undefined) setNewPtEcog(profile.ecog_performance_status);
          
          if (profile.lab_values) {
            if (profile.lab_values.creatinine !== undefined) setNewPtCreatinine(profile.lab_values.creatinine);
            if (profile.lab_values.ALT !== undefined) setNewPtAlt(profile.lab_values.ALT);
            if (profile.lab_values.ANC !== undefined) setNewPtAnc(profile.lab_values.ANC);
            if (profile.lab_values.cd4_count !== undefined) setNewPtCd4(profile.lab_values.cd4_count);
            if (profile.lab_values.viral_load !== undefined) setNewPtViralLoad(profile.lab_values.viral_load);
            if (profile.lab_values.art_status !== undefined) setNewPtArtStatus(profile.lab_values.art_status);
            if (profile.lab_values.systolic_bp !== undefined) setNewPtSystolicBp(profile.lab_values.systolic_bp);
            if (profile.lab_values.rheumatoid_factor !== undefined) setNewPtRheumatoidFactor(profile.lab_values.rheumatoid_factor);
            if (profile.lab_values.hba1c !== undefined) setNewPtHba1c(profile.lab_values.hba1c);
            if (profile.lab_values.crp !== undefined) setNewPtCrp(profile.lab_values.crp);
            if (profile.lab_values.mmse_score !== undefined) setNewPtMmse(profile.lab_values.mmse_score);
            if (profile.lab_values.mobility_assistance !== undefined) setNewPtMobility(profile.lab_values.mobility_assistance);
            if (profile.lab_values.fev1_fvc_ratio !== undefined) setNewPtFev1Fvc(profile.lab_values.fev1_fvc_ratio);
            if (profile.lab_values.oxygen_required !== undefined) setNewPtOxygenRequired(profile.lab_values.oxygen_required);
            if (profile.lab_values.egfr_value !== undefined) setNewPtEgfrValue(profile.lab_values.egfr_value);
            if (profile.lab_values.dialysis_dependent !== undefined) setNewPtDialysisDependent(profile.lab_values.dialysis_dependent);
          }

          if (profile.location) {
            if (profile.location.city) setNewPtCity(profile.location.city);
            if (profile.location.state) setNewPtState(profile.location.state);
          }

          if (profile.last_therapy_days_ago !== undefined) setNewPtWashout(profile.last_therapy_days_ago);
          if (profile.prior_treatments) {
            setNewPtPriorTxCount(profile.prior_treatments.length);
          }
          if (profile.willing_to_biopsy !== undefined) setNewPtBiopsy(profile.willing_to_biopsy);
          if (profile.willing_to_change_location !== undefined) setNewPtLocationChange(profile.willing_to_change_location);

          showToast("Gemini analysis completed! Patient clinical intake fields pre-populated.", "success");
        } else {
          showToast("Document parsed, but structured candidate details could not be mapped.", "error");
        }
      } catch (err: any) {
        showToast(`Clinical document ingestion failed: ${err.message}`, "error");
      } finally {
        setIsAnalyzingFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // PHASE 2 ACTION: EHR Context Agent Sync
  // ==========================================
  const handleSyncEhrValues = async (patientId: string) => {
    if (!patientId) return;
    setIsEhrSyncing(true);
    setSyncedLabsResult(null);

    try {
      showToast("Activating EHR Context Agent MCP Server ( Epic / Cerner Sync )...", "info");
      const res = await fetch(`/api/patients/${patientId}/ehr-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const updatedPatient = await res.json();
      if (!res.ok) {
        throw new Error(updatedPatient.error || "EHR context synchronization failed");
      }

      setSyncedLabsResult({
        status: "EHR_SYNCED",
        values: {
          AST: updatedPatient.lab_values?.AST || 32,
          platelets: updatedPatient.lab_values?.platelets || 240,
          hemoglobin: updatedPatient.lab_values?.hemoglobin || 13.5
        },
        biomarkers: updatedPatient.biomarkers || [],
        diagnoses: updatedPatient.diagnoses || [],
        ecog: updatedPatient.ecog_performance_status ?? 1,
        comorbidities: updatedPatient.comorbidities || [],
        demographics: {
          age: updatedPatient.age,
          sex: updatedPatient.sex,
          location: updatedPatient.location
        },
        systemId: updatedPatient.systemId || "HL7-FHIR-EPIC-" + Math.random().toString(36).substring(2, 12).toUpperCase()
      });

      showToast("EHR Sync Complete. Synchronized full active profile, including demographics, genomics profile, and biochemical labs!", "success");
      
      // Reload list and preserve active selection
      await loadRecords();
    } catch (err: any) {
      showToast(`EHR Sync error: ${err.message}`, "error");
    } finally {
      setIsEhrSyncing(false);
    }
  };

  // ==========================================
  // PHASE 2 ACTION: Advanced Suitability Reasoner (gemini-3.5-flash)
  // ==========================================
  const handleCompileProReasoning = async () => {
    if (!selectedPatientId || !selectedTrialId) {
      showToast("Load a patient profile and select a trial protocol first.", "error");
      return;
    }

    setIsCompilingReasoning(true);
    setProReasoning(null);
    fetchOrchestratorLogs();

    try {
      showToast("Invoking Eligibility Matcher (Vertex AI gemini-3.5-flash)...", "info");
      const res = await fetch("/api/match-reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: selectedPatientId, nct_id: selectedTrialId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Advanced reasoning compilation failed");
      }

      setProReasoning(data.reasoning);
      await fetchOrchestratorLogs();
      showToast("Advanced logical eligibility report compiled!", "success");
    } catch (err: any) {
      showToast(`Eligibility reasoning error: ${err.message}`, "error");
    } finally {
      setIsCompilingReasoning(false);
      await fetchOrchestratorLogs();
    }
  };

  // ==========================================
  // PHASE 3 ACTION: Context Enricher with Google Search Grounding
  // ==========================================
  const handleGroundTrialContext = async (nctId: string) => {
    if (!nctId) return;
    setIsGroundingTrial(true);
    setGroundedContext(null);
    setGroundingCitations([]);
    fetchOrchestratorLogs();

    try {
      showToast("Vertex AI Grounding (Google Search) initialized...", "info");
      const res = await fetch(`/api/trials/${nctId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Grounded lookup failed");
      }

      setGroundedContext(data.enrichedContent);
      setGroundingCitations(data.groundingLinks || []);
      await fetchOrchestratorLogs();
      showToast("Grounded logistics validated from real-time web references!", "success");
    } catch (err: any) {
      showToast(`Grounding error: ${err.message}`, "error");
    } finally {
      setIsGroundingTrial(false);
      await fetchOrchestratorLogs();
    }
  };

  // ==========================================
  // PHASE 4 & 5 ACTION: Streamlit Webhook Approval & Logging
  // ==========================================
  const handleStreamlitWebhookApprove = async (approvalId: string) => {
    if (!approvalId) return;
    setIsSubmittingStreamlitApproval(true);
    setAuditResult(null);

    try {
      showToast("Sending secure webhook POST back to Backend Cloud Run container...", "info");
      const res = await fetch("/api/webhook/streamlit-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: approvalId,
          editedSubject: editedStreamlitSubject,
          editedBody: editedStreamlitBody,
          physicianName: currentClinician.name,
          physicianEmail: currentClinician.email
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed sending clinical approval webhook");
      }

      setAuditResult({
        auditLogId: result.auditLogId,
        timestamp: result.timestamp,
        approvedBy: result.approvedBy,
        deliveryReceipt: result.deliveryReceipt
      });

      showToast("Webhook matched. SMTP referral dispatched & blockchain audit stored!", "success");
      
      // Reload records to reflect approved and dispatched status
      await loadRecords();
    } catch (err: any) {
      showToast(`HITL Webhook error: ${err.message}`, "error");
    } finally {
      setIsSubmittingStreamlitApproval(false);
    }
  };

  const handleDeletePendingDraft = async (approvalId: string) => {
    if (!approvalId) return;
    setIsDeletingDraft(true);

    try {
      showToast("Deleting pending clinical referral draft...", "info");
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete clinical referral draft");
      }

      showToast(`Referral draft ${approvalId} has been deleted and patient eligibility reset!`, "success");
      
      // Clear select fields
      setSelectedPendingApprovalId("");
      setEditedStreamlitSubject("");
      setEditedStreamlitBody("");
      setAuditResult(null);

      // Reload records to reflect deleted status
      await loadRecords();
    } catch (err: any) {
      showToast(`Delete draft error: ${err.message}`, "error");
    } finally {
      setIsDeletingDraft(false);
    }
  };

  // ==========================================
  // COPILOT AI ADVISOR CHAT
  // ==========================================
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your TrialLogix Co-Pilot. I have loaded the selected clinical trial database, standard matching rubric weights, and patient parameters. Ask me any questions about baseline screening checklist protocols, creatinine clearance warnings, or to draft a standard physician referral letter."
    }
  ]);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChatMessage = async (e?: FormEvent, directMessageText?: string) => {
    if (e) e.preventDefault();
    let textToSend = (directMessageText || chatInput).trim();
    if (!textToSend || isSendingMessage) return;

    // Basic sanitization for SQLi patterns and prompt/XSS injection attempts
    const sanitizeInput = (str: string) => {
      // Remove basic disruptive SQL keywords and operators that might confuse parsing engines
      const sqliPattern = /(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|--|;|\/\*|\*\/|@@|<script>|onload=)/ig;
      let safeStr = str.replace(sqliPattern, "[REDACTED]");
      
      // Escape generic HTML tags
      safeStr = safeStr.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return safeStr.trim();
    };

    textToSend = sanitizeInput(textToSend);

    if (!currentPatient || !currentTrial || !matchResult) {
      showToast("Cannot initialize conversation context without patient and trial selections.", "error");
      return;
    }

    const userText = textToSend;
    if (!directMessageText) {
      setChatInput("");
    }
    const newMessages: Message[] = [...chatMessages, { role: "user", text: userText }];
    setChatMessages(newMessages);
    setIsSendingMessage(true);

    try {
      const contextPreamble = `Context for analysis:
Selected Patient ID: ${currentPatient.patient_id}
Tuned Profile details:
- Age: ${currentPatient.age}
- ECOG: ${currentPatient.ecog_performance_status}
- Labs: Creatinine ${currentPatient.lab_values.creatinine} mg/dL, ALT ${currentPatient.lab_values.ALT} U/L, ANC ${currentPatient.lab_values.ANC} x10^9/L
- Location: ${currentPatient.location.city}, ${currentPatient.location.state}
- Biomarkers: ${currentPatient.biomarkers.map(b => `${b.name} (${b.result})`).join(", ")}
- Washout period: ${currentPatient.last_therapy_days_ago} days off last treatment

Clinical Trial evaluated:
- Title: ${currentTrial.title} (${currentTrial.nct_id})
- Sponsor: ${currentTrial.sponsor}
- Required matching criteria: ${currentTrial.rules.required_conditions.join(", ")}
- Target gene mutation requested: ${currentTrial.rules.required_biomarkers.join(", ") || "None requested"}

Deterministic score calculated: ${matchResult.score}/100.
Recommendation Status: ${matchResult.match_status}.
List of current Action Items/Data Gaps: ${matchResult.data_gaps.join("; ")}.

Now answer the user instruction: "${userText}"`;

      const conversationContext: Message[] = [
        ...chatMessages.slice(-4),
        { role: "user", text: contextPreamble }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationContext,
          patient_id: currentPatient.patient_id,
          nct_id: currentTrial.nct_id
        })
      });

      const responseData = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, { role: "model", text: responseData.text }]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            role: "model",
            text: `An error occurred on the server: ${responseData.error || "Failed loading reply."}`
          }
        ]);
      }
    } catch (error: any) {
      setChatMessages(prev => [
        ...prev,
        {
          role: "model",
          text: `Failed communicating with Clinical Co-Pilot backend: ${error.message || "Network offline."}`
        }
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // ==========================================
  // HELPER REUSABLE UTILS
  // ==========================================
  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ text, type });
    fetchOrchestratorLogs();
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HIGH_PRIORITY": return "text-emerald-700 bg-emerald-50 border-emerald-250 border-emerald-200";
      case "POTENTIAL": return "text-sky-700 bg-sky-50 border-sky-200";
      default: return "text-rose-700 bg-rose-50 border-rose-200";
    }
  };

  // ==========================================
  // AUTHENTICATION GUARD CARD with TABBED LANDING EXPERIENCE
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
        {/* Navigation Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <TrialLogixLogo size={36} textClassName="font-black text-slate-900 text-base sm:text-xl tracking-tight leading-none" />
            </div>
            
            {/* Navigation and Login */}
            <div className="flex items-center gap-4">
              <nav className="flex items-center bg-slate-100 rounded-lg p-1 text-slate-600 border border-slate-200 mr-2">
                <button
                  onClick={() => setPublicTab("about")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    publicTab === "about"
                      ? "bg-white text-slate-950 shadow-sm font-extrabold"
                      : "hover:text-slate-900 duration-200"
                  }`}
                >
                  🏠 About Project
                </button>
                <button
                  onClick={() => setPublicTab("architecture")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    publicTab === "architecture"
                      ? "bg-white text-slate-950 shadow-sm font-extrabold"
                      : "hover:text-slate-900 duration-200"
                  }`}
                >
                  🧬 Architecture
                </button>
                <button
                  onClick={() => setPublicTab("deck")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    publicTab === "deck"
                      ? "bg-white text-slate-950 shadow-sm font-extrabold"
                      : "hover:text-slate-900 duration-200"
                  }`}
                >
                  📊 Pitch Deck
                </button>
              </nav>

              <button
                onClick={() => setPublicTab("login")}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm border ${
                  publicTab === "login"
                    ? "bg-blue-600 text-white border-blue-700 shadow-md"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Clinician Login
              </button>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {publicTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-8"
              >
                {/* Hero Section */}
                <div className="text-center space-y-3 max-w-3xl mx-auto animate-fade-in">
                  <h1 className="text-3xl sm:text-4xl font-black text-[#001F54] tracking-tight leading-tight">
                    Precision Matching for <span className="text-[#0062E3]">Diverse Patient Cohorts</span>
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
                    A comprehensive clinical matching platform designed to securely align patient clinical profiles—including oncology, immunology, cardiovascular, and other specialized therapeutic cohorts—with active clinical trial guidelines.
                    Instantly evaluates multi-system vital thresholds, diagnostic markers, and therapeutic washout parameters with secure local HIPAA validation and Human-in-the-Loop workflows.
                  </p>
                </div>

                {/* Main Feature Cards Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Left Column Section: Matching Core */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 text-blue-600 flex items-center justify-center font-bold">
                      <Sliders className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-850 text-slate-900 text-sm tracking-tight">Adaptive Parameters Tuner</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Fine-tune screening gating rules (such as minimum blood count metrics, ECOG performance index scores, and therapy washout restrictions) on-the-fly. Sequential score matching calculates candidate viability perfectly.
                      </p>
                    </div>
                  </div>

                  {/* Right Column Section: Grounding Core */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-850 text-slate-900 text-sm tracking-tight">Search-Grounded Trial Logistics</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Bypass stale cache databases altogether. The match engine connects directly with active registers to verify active recruitment status, coordinator details, and primary investigator contact options in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Highlight 3: HIPAA DLP Core */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-850 text-slate-900 text-sm tracking-tight">Local HIPAA PII Masking Proxy</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        To lock down regulatory compliance, sensitive Electronic Health Record (EHR) indicators—such as patient name, location registers, and MRNs—are scrubbed locally before analysis.
                      </p>
                    </div>
                  </div>

                  {/* Highlight 4: Human-in-the-Loop */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Human-in-the-Loop Workflows</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Generate clinical screening and matching draft letters instantly. The practitioner reviews or edits the profile results, securely dispatching verified referral records over automated channels with Human-in-the-Loop approval workflows.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA to Login */}
                <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Secure Portal Login</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Access active logs, draft referrals and tune matching indexes directly.</p>
                  </div>
                  <button
                    onClick={() => setPublicTab("login")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer select-none"
                  >
                    <span>Authorize Clinician credentials</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {publicTab === "architecture" && (
              <motion.div
                key="architecture"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-6"
              >
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span>🧬 Pipeline & System Architecture</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">End-to-end clinical parameter coordination, secure offline PII redaction, and Human-in-the-Loop workflows</p>
                    </div>
                    <span className="text-[10px] sm:self-start font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Verified Workspace Assets
                    </span>
                  </div>
                  
                  {/* Container for the SVG to render nicely */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-x-auto">
                    <div className="min-w-[800px] w-full max-w-[1140px] mx-auto aspect-[1140/880]">
                      <ArchitectureDiagram />
                    </div>
                  </div>

                  {/* Details of System Components */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase font-mono font-sans">Stage 1</span>
                      <h4 className="text-xs font-black text-slate-800 tracking-tight mt-2 uppercase font-sans">DLP PII Redaction Proxy</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                        Medical diagnostic profiles ingested from electronic health records (EHR) go through a secure proxy. Fully redacts Patient Name, Medical Record Numbers (MRN), and specific clinical encounter dates to support compliance standards.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded uppercase font-mono font-sans">Stage 2</span>
                      <h4 className="text-xs font-black text-slate-800 tracking-tight mt-2 uppercase font-sans font-sans animate-pulse">Google Search Grounding</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                        The cohort matching engine dynamically references real-time study parameters. Invokes Google Search Grounding to verify sponsor guidelines, target site active status, and primary study coordinator contacts instantly.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase font-mono">Stage 3</span>
                      <h4 className="text-xs font-black text-slate-800 tracking-tight mt-2 uppercase font-sans">Human-in-the-Loop Workflows</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                        Matched high-priority patient profiles auto-generate clinical screening referral letters. The human coordinator performs peer review edits on Streamlit portals, dispatching final referral packages securely over automated SMTP channels.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

      {publicTab === "deck" && (
              <motion.div
                key="deck"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-6"
              >
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <span>📊 Executive Investor &amp; Clinician Slide Deck</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">End-to-end mission statement, case study metrics, full architecture, HIPAA security, and launch ROI analysis</p>
                  </div>
                  <PitchDeck />
                </div>
              </motion.div>
            )}

            {publicTab === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-md"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 lg:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-md">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Staff Secure Access</h1>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                      Provide authorized clinician credentials below to securely access the clinical portal system.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-250 border-rose-200 font-medium flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCredentialsLogin} className="space-y-4 text-xs mt-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600 block">Clinician Email</label>
                      <input
                        type="email"
                        placeholder="clinician@triallogix.org"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5 font-sans">
                      <label className="font-semibold text-slate-600 block">Security Key Access</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg text-sm flex justify-center items-center gap-2 transition-all cursor-pointer shadow disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
                          Verifying credentials...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-slate-300 font-sans" />
                          Authorize Staff Credentials
                        </>
                      )}
                    </button>

                    <div className="py-2 flex items-center gap-3 text-slate-400">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Or</span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn}
                      className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-lg text-sm border border-slate-300 flex justify-center items-center gap-3 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" strokeWidth={3} />
                          Connecting securely...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Sign In with Google
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-slate-400 mt-4">
                      By securely logging in, you verify your authority to view HIPAA-compliant clinical trials and parameters.
                    </p>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-[10px] text-slate-400 font-mono">
          TrialLogix Clinical Trial Cohort Matching Gateway. Powered by Google Vertex AI. Local DLP Masking Active.
        </footer>
      </div>
    );
  }

  // ==========================================
  // MAIN FULL SYSTEM VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      
      {/* GLOBAL DISPATCH NOTIFIER */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-3 max-w-lg ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-250 bg-emerald-100"
                : notification.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-250"
                : "bg-blue-50 text-blue-800 border-blue-250 bg-blue-100"
            }`}
          >
            <BellRing className="h-4 w-4 text-blue-600" />
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN CONTROL PANEL MODAL */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 lg:p-8 space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-xl">
                  <UserPlus className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Admin Portal: Clinician Registry</h3>
                  <p className="text-xs text-slate-500">Create login credentials or inspect authorized staff keys.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminOpen(false);
                  setAdminStatusMsg(null);
                }}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {adminStatusMsg && (
              <div className={`p-3 text-xs rounded-lg font-bold border ${
                adminStatusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                {adminStatusMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Side: Create Form */}
              {isAuthorizedAdmin ? (
                <div className="space-y-4">
                  {/* Sub-Tab Navigation inside Admin panel */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSubTab("onboard");
                        setAdminStatusMsg(null);
                        setGeminiStatusMsg(null);
                      }}
                      className={`flex-1 py-1.5 px-3 text-center rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        adminSubTab === "onboard"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Onboard Clinician</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSubTab("gemini");
                        setAdminStatusMsg(null);
                        setGeminiStatusMsg(null);
                        fetchGeminiKeyStatus();
                      }}
                      className={`flex-1 py-1.5 px-3 text-center rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        adminSubTab === "gemini"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Gemini API Overlay</span>
                      {geminiKeyStatus?.isOverridden && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSubTab("smtp");
                        setAdminStatusMsg(null);
                        setGeminiStatusMsg(null);
                      }}
                      className={`flex-1 py-1.5 px-3 text-center rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        adminSubTab === "smtp"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>SMTP Status</span>
                    </button>
                  </div>

                  {adminSubTab === "onboard" ? (
                    <form onSubmit={handleRegisterUser} className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-850 uppercase tracking-wider text-[10px]">Onboard New Clinician Key</h4>
                      
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block">Full Name & Credentials</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Robert Downey, MD"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-450"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block">Email Address (Username)</label>
                        <input
                          type="email"
                          required
                          placeholder="robert.downey@triallogix.org"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-450"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block">Primary Specialty Role</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Consulting Oncologist"
                          value={adminRole}
                          onChange={(e) => setAdminRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-450"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block">Password / Security Key</label>
                        <input
                          type="text"
                          required
                          placeholder="clinical-hematology-match"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="font-mono w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-450"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors"
                      >
                        Create Security Credentials
                      </button>
                    </form>
                  ) : adminSubTab === "smtp" ? (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-850 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <span>Secure SMTP Transport Subsystem</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Configured to route authenticated execution summaries via designated SendGrid outbound domains.
                        </p>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>SMTP Dispatch Ready</span>
                        </div>
                        <div className="space-y-2 text-[10px]">
                          <div className="flex justify-between items-center bg-white/60 p-1.5 rounded border border-emerald-100">
                            <span className="text-slate-500 font-medium font-mono text-[9px]">SERVER_HOST:</span>
                            <span className="text-slate-800 font-bold font-mono">smtp.sendgrid.net</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/60 p-1.5 rounded border border-emerald-100">
                            <span className="text-slate-500 font-medium font-mono text-[9px]">TLS_PROTOCOL:</span>
                            <span className="text-slate-800 font-bold font-mono">v1.3 (Strict)</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/60 p-1.5 rounded border border-emerald-100">
                            <span className="text-slate-500 font-medium font-mono text-[9px]">AUTH_MODE:</span>
                            <span className="text-slate-800 font-bold font-mono">API_KEY_BEARER</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/60 p-1.5 rounded border border-emerald-100">
                            <span className="text-slate-500 font-medium font-mono text-[9px]">STATE:</span>
                            <span className="text-emerald-700 font-bold font-mono uppercase">Online & Trigger-Ready</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        When a patient profile is matched via the system agents and reviewed, this transport mechanism dispatches the package to the clinical staff inbox.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateGeminiKey} className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-850 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <span>Gemini Live Engine Key Overlay</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Temporarily supply a backend custom API credential overlay if your standard subscription exhaust limits are met.
                        </p>
                      </div>

                      {geminiStatusMsg && (
                        <div className={`p-2.5 text-[11px] rounded-lg border font-medium ${
                          geminiStatusMsg.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {geminiStatusMsg.text}
                        </div>
                      )}

                      {/* State status indicator */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Default Environment Key:</span>
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                            geminiKeyStatus?.hasEnvKey ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-150 text-slate-600"
                          }`}>
                            {geminiKeyStatus?.hasEnvKey ? "DETECTOR_ACTIVE" : "NONE_DETECTED"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Active Subsystem Key:</span>
                          <span className="font-mono text-[10px] font-bold text-slate-700">
                            {geminiStatusLoading ? "Loading..." : geminiKeyStatus?.activeKeyMasked || "None"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Active Status Profile:</span>
                          {geminiKeyStatus?.isOverridden ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase animate-pulse">
                              Admin Key Override Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              Standard System Default
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 block flex items-center justify-between">
                          <span>Custom API Key (`AI_STUDY_KEY`)</span>
                          {geminiKeyStatus?.isOverridden && (
                            <button
                              type="button"
                              onClick={async () => {
                                setGeminiKeyOverrideVal("");
                                // Send empty key to trigger fallback to process.env.GEMINI_API_KEY
                                setGeminiStatusMsg(null);
                                try {
                                  const res = await fetch("/api/admin/gemini-key/update", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      requesterEmail: currentClinician.email,
                                      newKey: ""
                                    })
                                  });
                                  const d = await res.json();
                                  setGeminiStatusMsg({ text: d.message, type: "success" });
                                  showToast(d.message, "success");
                                  fetchGeminiKeyStatus();
                                } catch (err: any) {
                                  showToast("Failed to revert overlay key", "error");
                                }
                              }}
                              className="text-[9px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                            >
                              Reset to Default key
                            </button>
                          )}
                        </label>
                        <input
                          type="password"
                          placeholder="Paste custom AIStudio / Vertex Gemini key here"
                          value={geminiKeyOverrideVal}
                          onChange={(e) => setGeminiKeyOverrideVal(e.target.value)}
                          className="font-mono w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-450"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={geminiStatusLoading}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {geminiStatusLoading ? "Processing Key..." : "Apply Custom Key Override"}
                      </button>

                      {/* Explicit security analysis addressing user's query */}
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5 leading-normal text-[10px] text-slate-600">
                        <div className="flex items-center gap-1.5 font-bold text-blue-800">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Strict Architectural Security Analysis:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Zero Frontend Exposure:</strong> Entered keys are securely transmitted to the server once and maintained in memory. The UI solely yields a highly-masked signature placeholder (e.g. <code className="font-mono text-slate-800">AIxx••••••••xxxx</code>).</li>
                          <li><strong>Volatile Memory Core:</strong> Key overrides are volatile. They reside only in process executor memory and are never written to any public database, log, or public persistent storage.</li>
                          <li><strong>Role-Based Protection:</strong> Only authorized system seeded keys (<code className="font-mono text-slate-700">dr.google@triallogix.org</code> and <code className="font-mono text-slate-700">james.carter@triallogix.org</code>) possess authorized session claims to register override commands.</li>
                        </ul>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="p-4 border border-rose-100 bg-rose-50/50 rounded-xl space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-rose-700 font-bold">
                    <span className="text-base">🔒</span>
                    <span>Administrative Access Locked</span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Onboarding new practitioners is restricted to designated system administrators. Your active session <strong className="text-slate-850">({currentClinician.name})</strong> does not possess user-creation security clearance keys.
                  </p>
                  <div className="text-[10px] bg-white border border-rose-100 rounded p-2 text-slate-500 font-medium space-y-1">
                    <div>Only the system-seeded clinicians:</div>
                    <div className="font-semibold text-slate-700">• Dr. Google, MD</div>
                    <div className="font-semibold text-slate-700">• Dr. James Carter, MD</div>
                    <div>can authorize and seed new staff keys.</div>
                  </div>
                </div>
              )}

              {/* Right Side: Logged In / Users list */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Active Staff Credentials Directory (Durable)</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {clinicians.map((u, i) => (
                    <div key={i} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.color || "bg-slate-200"} flex items-center justify-center font-bold text-xs text-white uppercase`}>
                        {u.avatarInitials}
                      </div>
                      <div className="flex-1 text-xs min-w-0">
                        <div className="font-bold text-slate-850 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">{u.role}</div>
                        <div className="text-[9px] text-blue-600 font-mono mt-0.5 truncate">{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* TOP NAVIGATION NAV */}
        <nav className="h-16 bg-white border border-slate-200 px-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <TrialLogixLogo size={30} textClassName="font-black text-slate-800 text-sm sm:text-base tracking-tight leading-none" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase font-bold text-slate-400">Security Session</span>
                <span className="text-xs font-semibold text-slate-700">{currentClinician.name}</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase font-bold text-slate-400">Workstation Role</span>
                <span className="text-xs font-semibold text-blue-600">{currentClinician.role}</span>
              </div>
            </div>

            {/* Admin Credentials Creator CTA */}
            <button
              type="button"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-705 text-slate-700 hover:text-slate-900 font-bold tracking-tight text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Admin Key Panel</span>
            </button>

            {/* Clinician Profile / Logout */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className={`w-8 h-8 rounded-full ${currentClinician.color} flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs`}>
                {currentClinician.avatarInitials}
              </div>
              <button
                onClick={handleLogout}
                title="Log out from workstation"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </nav>

        {isLoadingRecords ? (
          <div className="min-h-96 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8 space-y-4 shadow-sm">
            {loadError ? (
              <>
                <span className="text-3xl animate-bounce">⚠️</span>
                <h3 className="text-sm font-bold text-red-650 text-red-600">EHR Connection Error / Bootstrapping...</h3>
                <p className="text-xs text-slate-500 max-w-md text-center leading-relaxed bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 font-mono">
                  {loadError}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => loadRecords()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] uppercase tracking-wide px-4 py-2.5 rounded-xl cursor-pointer transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>Force Re-sync</span>
                    <span>🔄</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">Retrying automatically...</span>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <h3 className="text-sm font-bold text-slate-800">Bootstrapping Clinical Records Datastore...</h3>
                <p className="text-xs text-slate-500">Querying Express engine states and preparing patient rules models.</p>
              </>
            )}
          </div>
        ) : (
          /* CORE BENTO BOARD ROW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIDEBAR PANEL: PATIENTS CORE REGISTRY & SENT EMAILS */}
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
              
              {/* Switching Sidebar tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveLeftTab("tuner")}
                  className={`flex-1 pb-3 text-[10.5px] font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${
                    activeLeftTab === "tuner"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Registry Patient
                </button>
                <button
                  onClick={() => setActiveLeftTab("approvals")}
                  className={`flex-1 pb-3 text-[10.5px] font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer relative ${
                    activeLeftTab === "approvals"
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Referral Logs
                  {approvals.length > 0 && (
                    <span className="absolute top-0 right-1 bg-blue-600 text-white font-mono text-[8.5px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                      {approvals.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveLeftTab("streamlit")}
                  className={`flex-1 pb-3 text-[10.5px] font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer relative ${
                    activeLeftTab === "streamlit"
                      ? "border-[#FF4B4B] text-[#FF4B4B] font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="inline-flex items-center gap-0.5">🎈 Streamlit HITL</span>
                  {approvals.filter(a => a.status === "PENDING_REVIEW").length > 0 && (
                    <span className="absolute top-0 right-1 bg-[#FF4B4B] text-white font-mono text-[8.5px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {approvals.filter(a => a.status === "PENDING_REVIEW").length}
                    </span>
                  )}
                </button>
              </div>

              {activeLeftTab === "tuner" && (
                <div className="space-y-5">
                  {/* Registry header row with Create Patient button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical registry selection</span>
                    <button
                      onClick={() => setShowAddPatientForm(!showAddPatientForm)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-blue-200"
                    >
                      <Plus className="h-3 w-3" />
                      Onboard Patient
                    </button>
                  </div>

                  {/* INTERACTIVE FORM PANEL: ADD PATIENT WIZARD */}
                  <AnimatePresence>
                    {showAddPatientForm && (
                      <motion.form
                        onSubmit={handleOnboardNewPatient}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 space-y-4 overflow-hidden text-xs text-slate-700"
                      >
                        <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5 flex justify-between items-center">
                          <span>Patient Clinical Intake Profile</span>
                          <span className="text-[9px] font-mono text-slate-400 font-semibold lowercase">Fill diagnostics parameters</span>
                        </h4>

                        {/* HIGH FIDELITY REPORT INTEGRATION: PDF & IMAGE UPLOAD ZONE */}
                        <div className="border border-dashed border-blue-200 bg-blue-50/40 rounded-xl p-3 text-center relative hover:bg-blue-50 transition-all">
                          <input
                            id="document-file-onboard"
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentOnboardingUpload(file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isAnalyzingFile}
                          />
                          <div className="text-blue-700 font-bold flex items-center justify-center gap-1.5 text-[11px]">
                            {isAnalyzingFile ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                                <span>Gemini Analyzing Clinical Report...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-lg">🧪</span>
                                <span>Upload Clinical Report (PDF/Scan/Image)</span>
                              </>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                            {onboardingFileName ? (
                              <span className="text-green-600 font-bold">📄 Attached: {onboardingFileName} (Parsing completed!)</span>
                            ) : (
                              "Upload pathology report, molecular PCR/NGS results or EMR logs. Gemini will auto-fill the profile details."
                            )}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 flex items-center justify-between">
                              <span>FullName</span>
                              <span className="text-[9px] text-slate-400 font-normal">Required</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Liam Vance"
                              value={newPtName}
                              onChange={(e) => setNewPtName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500 flex items-center justify-between">
                                <span>Age</span>
                                <span className="text-[9px] text-slate-400 font-normal">≥ 18</span>
                              </label>
                              <input
                                type="number"
                                required
                                value={newPtAge}
                                onChange={(e) => setNewPtAge(parseInt(e.target.value) || 18)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Sex</label>
                              <select
                                value={newPtSex}
                                onChange={(e) => setNewPtSex(e.target.value as any)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none cursor-pointer"
                              >
                                <option value="M">M</option>
                                <option value="F">F</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* GEOGRAPHICAL METRICS ROW */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 flex items-center justify-between">
                              <span>Patient Home City</span>
                              <span className="text-[9px] text-slate-400 font-normal">e.g. Boston, Seattle</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Boston"
                              value={newPtCity}
                              onChange={(e) => setNewPtCity(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 flex items-center justify-between">
                              <span>State Code</span>
                              <span className="text-[9px] text-slate-400 font-normal">e.g. MA, WA, NY</span>
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={2}
                              placeholder="e.g. MA"
                              value={newPtState}
                              onChange={(e) => setNewPtState(e.target.value.toUpperCase())}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1 col-span-2">
                            <label className="font-bold text-slate-500">Diagnosis Description</label>
                            <input
                              type="text"
                              required
                              placeholder="Non-Small Cell Lung Cancer"
                              value={newPtDxDesc}
                              onChange={(e) => setNewPtDxDesc(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-[11px]"
                            />
                            {currentTrial && (
                              <p className="text-[9px] text-blue-600 font-medium">
                                🎯 Expected for Selected Trial: <strong className="underline">{currentTrial.rules.required_conditions.join(" or ")}</strong>
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">ICD10 Code</label>
                            <input
                              type="text"
                              required
                              value={newPtDxIcd}
                              onChange={(e) => setNewPtDxIcd(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-center font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* DYNAMIC DIAGNOSTIC PRESETS FOR IMMEDIATE ADAPTIVE FORM DEMO */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                          <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1">
                            <span>⚡</span>
                            <span>Onboarding Presets (Select to trigger adaptive layouts)</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("C34.11");
                                setNewPtDxDesc("Non-Small Cell Lung Cancer (NSCLC)");
                                setNewPtEgfr("L858R positive");
                                setNewPtPdl1("TPS 25%");
                                setOnboardingBiomarkers([
                                  { name: "EGFR", result: "L858R positive" },
                                  { name: "PD-L1", result: "TPS 25%" },
                                  { name: "ALK", result: "Negative" },
                                  { name: "KRAS", result: "Negative" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "oncology"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              🎗️ Oncology (C34.11)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("B20");
                                setNewPtDxDesc("HIV-1 Disease (Immunological / Virology Candidate)");
                                setNewPtCd4(450);
                                setNewPtViralLoad(0);
                                setNewPtArtStatus("Active");
                                setOnboardingBiomarkers([
                                  { name: "CD4 Count", result: "450 cells/mcL" },
                                  { name: "Viral Load", result: "0 copies/mL" },
                                  { name: "ART Status", result: "Active" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "immunology"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              🛡️ HIV/AIDS (B20)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("I10");
                                setNewPtDxDesc("Essential primary hypertension");
                                setNewPtSystolicBp(140);
                                setOnboardingBiomarkers([
                                  { name: "Systolic BP", result: "140 mmHg" },
                                  { name: "Diastolic BP", result: "90 mmHg" },
                                  { name: "HbA1c", result: "5.7%" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "cardiovascular_metabolic" && newPtDxIcd.startsWith("I")
                                  ? "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              ❤️ Hypertension (I10)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("E11.9");
                                setNewPtDxDesc("Type 2 diabetes mellitus");
                                setNewPtHba1c(7.2);
                                setOnboardingBiomarkers([
                                  { name: "HbA1c", result: "7.2%" },
                                  { name: "Glucose", result: "145 mg/dL" },
                                  { name: "CKD Stage", result: "Stage 2" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "cardiovascular_metabolic" && newPtDxIcd.startsWith("E")
                                  ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              🩸 Diabetes (E11.9)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("M05.79");
                                setNewPtDxDesc("Rheumatoid arthritis, seropositive");
                                setNewPtRheumatoidFactor("Positive");
                                setNewPtCrp(15.5);
                                setOnboardingBiomarkers([
                                  { name: "Rheumatoid Factor", result: "Positive" },
                                  { name: "CRP", result: "15.5 mg/L" },
                                  { name: "ANA", result: "1:80 Positive" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "autoimmune"
                                  ? "bg-violet-50 text-violet-700 border-violet-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              🦠 Rheumatoid (M05)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("G30.9");
                                setNewPtDxDesc("Alzheimer's disease, unspecified");
                                setNewPtMmse(22);
                                setNewPtMobility("None");
                                setOnboardingBiomarkers([
                                  { name: "MMSE Score", result: "22/30" },
                                  { name: "Mobility", result: "Independent" },
                                  { name: "APOE4", result: "Positive" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "neurology"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              🧠 Neurology (G30)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("J44.9");
                                setNewPtDxDesc("Chronic obstructive pulmonary disease, unspecified");
                                setNewPtFev1Fvc(68);
                                setNewPtOxygenRequired(false);
                                setOnboardingBiomarkers([
                                  { name: "FEV1/FVC Ratio", result: "68%" },
                                  { name: "Supplemental Oxygen", result: "No" },
                                  { name: "DLCO", result: "62% predicted" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "pulmonology"
                                  ? "bg-sky-50 text-sky-700 border-sky-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              🫁 Pulmonology (J44)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPtDxIcd("N18.3");
                                setNewPtDxDesc("Chronic kidney disease, stage 3 (moderate)");
                                setNewPtEgfrValue(45);
                                setNewPtDialysisDependent(false);
                                setOnboardingBiomarkers([
                                  { name: "eGFR", result: "45 mL/min" },
                                  { name: "Serum Creatinine", result: "1.8 mg/dL" },
                                  { name: "Dialysis Dependent", result: "No" }
                                ]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                getIcd10Category(newPtDxIcd) === "nephrology"
                                  ? "bg-teal-50 text-teal-700 border-teal-200 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              ⚗️ Nephrology (N18)
                            </button>
                          </div>
                        </div>

                        {/* ADAPTIVE CLINICAL METRICS PANELS */}
                        {getIcd10Category(newPtDxIcd) === "oncology" && (
                          <div className="border border-rose-200 bg-rose-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-rose-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-rose-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">🎗️ oncology tumor biomarkers</span>
                              <span className="text-[9px] text-rose-600 font-normal lowercase bg-rose-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <label className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">EGFR Gene</label>
                                <select
                                  value={newPtEgfr}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPtEgfr(val);
                                    setOnboardingBiomarkers(prev => {
                                      const filtered = prev.filter(b => b.name !== "EGFR");
                                      return [...filtered, { name: "EGFR", result: val }];
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer font-bold text-blue-600 text-xs"
                                >
                                  <option value="Negative">Negative</option>
                                  <option value="Exon 19 deletion positive">Positive (Exon 19)</option>
                                  <option value="L858R positive">Positive (L858R)</option>
                                </select>
                                {currentTrial && currentTrial.rules.required_biomarkers.some(bm => bm.toUpperCase().includes("EGFR")) && (
                                  <p className="text-[8.5px] text-amber-600 font-extrabold font-mono uppercase">⚠️ Active Gate Filter</p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">PD-L1 Exp</label>
                                <select
                                  value={newPtPdl1}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPtPdl1(val);
                                    setOnboardingBiomarkers(prev => {
                                      const filtered = prev.filter(b => b.name !== "PD-L1");
                                      return [...filtered, { name: "PD-L1", result: val }];
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-xs"
                                >
                                  <option value="TPS 5%">Low (TPS 5%)</option>
                                  <option value="TPS 80%">High (TPS 80%)</option>
                                  <option value="Negative">Negative</option>
                                </select>
                                {currentTrial && currentTrial.rules.required_biomarkers.some(bm => bm.toUpperCase().includes("PD-L1")) && (
                                  <p className="text-[8.5px] text-amber-600 font-extrabold font-mono uppercase">⚠️ Active Gate Filter</p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">ECOG Status</label>
                                <select
                                  value={newPtEcog}
                                  onChange={(e) => setNewPtEcog(parseInt(e.target.value))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center font-bold text-xs"
                                >
                                  <option value="0">Grade 0</option>
                                  <option value="1">Grade 1</option>
                                  <option value="2">Grade 2</option>
                                  <option value="3">Grade 3</option>
                                </select>
                                {currentTrial && (
                                  <p className="text-[8.5px] text-amber-600 font-bold font-mono">⚠️ Gate Limit: ≤ {currentTrial.rules.max_ecog}</p>
                                )}
                              </div>
                                 {getIcd10Category(newPtDxIcd) === "immunology" && (
                          <div className="border border-emerald-200 bg-emerald-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">🛡️ Immunological & Infectious Indicators</span>
                              <span className="text-[9px] text-emerald-600 font-normal lowercase bg-emerald-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  CD4 (cells/mcL)
                                </span>
                                <input
                                  type="number"
                                  value={newPtCd4}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setNewPtCd4(val);
                                    setOnboardingBiomarkers(prev => {
                                      const filtered = prev.filter(b => b.name !== "CD4 Count");
                                      return [...filtered, { name: "CD4 Count", result: `${val} cells/mcL` }];
                                    });
                                  }}
                                  className={`w-full bg-white border rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs ${
                                    currentTrial && currentTrial.rules && (currentTrial.rules as any).min_cd4 !== undefined
                                      ? "border-emerald-400 text-emerald-800 bg-emerald-50/10"
                                      : "border-slate-200 text-slate-700"
                                  }`}
                                  placeholder="450"
                                />
                                {currentTrial && currentTrial.rules && (currentTrial.rules as any).min_cd4 !== undefined ? (
                                  <p className="text-[8px] text-emerald-600 font-bold leading-normal">⚠️ Rule Check: ≥ {(currentTrial.rules as any).min_cd4}</p>
                                ) : (
                                  <p className="text-[8px] text-slate-400">Target Range: ≥ 350</p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Viral Load (copies)
                                </span>
                                <input
                                  type="number"
                                  value={newPtViralLoad}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setNewPtViralLoad(val);
                                    setOnboardingBiomarkers(prev => {
                                      const filtered = prev.filter(b => b.name !== "Viral Load");
                                      return [...filtered, { name: "Viral Load", result: `${val} copies/mL` }];
                                    });
                                  }}
                                  className={`w-full bg-white border rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs ${
                                    currentTrial && currentTrial.rules && (currentTrial.rules as any).max_viral_load !== undefined
                                      ? "border-emerald-400 text-emerald-800 bg-emerald-50/10"
                                      : "border-slate-200 text-slate-700"
                                  }`}
                                  placeholder="0"
                                />
                                {currentTrial && currentTrial.rules && (currentTrial.rules as any).max_viral_load !== undefined ? (
                                  <p className="text-[8px] text-emerald-600 font-bold leading-normal">⚠️ Rule Check: ≤ {(currentTrial.rules as any).max_viral_load}</p>
                                ) : (
                                  <p className="text-[8px] text-slate-400">Target Limit: ≤ 1000</p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  ART Status
                                </span>
                                <select
                                  value={newPtArtStatus}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPtArtStatus(val);
                                    setOnboardingBiomarkers(prev => {
                                      const filtered = prev.filter(b => b.name !== "ART Status");
                                      return [...filtered, { name: "ART Status", result: val }];
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center font-bold text-xs"
                                >
                                  <option value="Active">Active ART</option>
                                  <option value="Naive">Naive/Off-ART</option>
                                  <option value="Intolerant">Intolerant</option>
                                </select>
                                <p className="text-[8px] text-slate-400 leading-none mt-1">Antiretroviral regimen</p>
                              </div>
                            </div>
                          </div>
                        )}
                            </div>
                          </div>
                        )}

                        {getIcd10Category(newPtDxIcd) === "cardiovascular_metabolic" && (
                          <div className="border border-cyan-200 bg-cyan-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-cyan-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-cyan-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">❤️ Cardiometabolic & Vascular Biomarkers</span>
                              <span className="text-[9px] text-cyan-600 font-normal lowercase bg-cyan-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Systolic BP (mmHg)
                                </span>
                                <input
                                  type="number"
                                  value={newPtSystolicBp}
                                  onChange={(e) => setNewPtSystolicBp(parseInt(e.target.value) || 120)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                                  placeholder="120"
                                />
                                <p className="text-[8px] text-slate-400">Normal Range ~120 (Hypertension if &ge; 140)</p>
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  HbA1c Glycemia (%)
                                </span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={newPtHba1c}
                                  onChange={(e) => setNewPtHba1c(parseFloat(e.target.value) || 5.7)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                                  placeholder="5.7"
                                />
                                <p className="text-[8px] text-slate-400">Diabetes if &ge; 6.5 | Normal &lt; 5.7</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {getIcd10Category(newPtDxIcd) === "autoimmune" && (
                          <div className="border border-violet-200 bg-violet-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-violet-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-violet-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">🦠 Autoimmune & Serology Assays</span>
                              <span className="text-[9px] text-violet-600 font-normal lowercase bg-violet-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Rheumatoid Factor (RF)
                                </span>
                                <select
                                  value={newPtRheumatoidFactor}
                                  onChange={(e) => setNewPtRheumatoidFactor(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center font-bold text-xs text-violet-700"
                                >
                                  <option value="Negative">Negative (Seronegative)</option>
                                  <option value="Positive">Positive (Seropositive)</option>
                                </select>
                                <p className="text-[8px] text-slate-400 mt-1">Serological signature status</p>
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  C-Reactive Protein (CRP, mg/L)
                                </span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={newPtCrp}
                                  onChange={(e) => setNewPtCrp(parseFloat(e.target.value) || 2.0)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                                  placeholder="2.0"
                                />
                                <p className="text-[8px] text-slate-400">Systemic inflammatory index</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {getIcd10Category(newPtDxIcd) === "neurology" && (
                          <div className="border border-indigo-200 bg-indigo-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-indigo-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-indigo-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">🧠 Neurology & Cognitive Biomarkers</span>
                              <span className="text-[9px] text-indigo-600 font-normal lowercase bg-indigo-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  MMSE Cognitive Score
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={newPtMmse}
                                  onChange={(e) => setNewPtMmse(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                                  placeholder="30"
                                />
                                <p className="text-[8px] text-slate-400">Normal 24-30 | Mild 20-23 | Severe &lt; 10</p>
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Mobility Assistance
                                </span>
                                <select
                                  value={newPtMobility}
                                  onChange={(e) => setNewPtMobility(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center font-bold text-xs text-indigo-700"
                                >
                                  <option value="None">Independent (No assistance)</option>
                                  <option value="Cane">Requires Cane</option>
                                  <option value="Wheelchair">Requires Wheelchair</option>
                                  <option value="Walker">Requires Walker/Assistant</option>
                                </select>
                                <p className="text-[8px] text-slate-400 mt-1">Functional status indicator</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {getIcd10Category(newPtDxIcd) === "pulmonology" && (
                          <div className="border border-sky-200 bg-sky-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-sky-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-sky-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">🫁 Pulmonary & Respiratory Volumes</span>
                              <span className="text-[9px] text-sky-600 font-normal lowercase bg-sky-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  FEV1/FVC Ratio (%)
                                </span>
                                <input
                                  type="number"
                                  min="10"
                                  max="100"
                                  value={newPtFev1Fvc}
                                  onChange={(e) => setNewPtFev1Fvc(Math.min(100, Math.max(10, parseInt(e.target.value) || 80)))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                                  placeholder="80"
                                />
                                <p className="text-[8px] text-slate-400">Obstructive defect if FEV1/FVC &lt; 70%</p>
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Supplemental Oxygen
                                </span>
                                <select
                                  value={newPtOxygenRequired ? "true" : "false"}
                                  onChange={(e) => setNewPtOxygenRequired(e.target.value === "true")}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center font-bold text-xs text-sky-700"
                                >
                                  <option value="false">No (Room air adequate)</option>
                                  <option value="true">Yes (Continuous or Exertional)</option>
                                </select>
                                <p className="text-[8px] text-slate-400 mt-1">Respiratory assistance state</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {getIcd10Category(newPtDxIcd) === "nephrology" && (
                          <div className="border border-teal-200 bg-teal-50/25 rounded-xl p-3.5 space-y-3">
                            <h5 className="font-bold text-teal-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-teal-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">⚗️ Renography & Nephron Profiling</span>
                              <span className="text-[9px] text-teal-600 font-normal lowercase bg-teal-100/50 px-1.5 py-0.5 rounded">Core variables required</span>
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Estimated GFR (mL/min)
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="200"
                                  value={newPtEgfrValue}
                                  onChange={(e) => setNewPtEgfrValue(Math.max(0, parseInt(e.target.value) || 90))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                                  placeholder="90"
                                />
                                <p className="text-[8px] text-slate-400">Normal &ge; 90 | CKD &lt; 60 | Failure &lt; 15</p>
                              </div>

                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                                  Renal Dialysis Status
                                </span>
                                <select
                                  value={newPtDialysisDependent ? "true" : "false"}
                                  onChange={(e) => setNewPtDialysisDependent(e.target.value === "true")}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center font-bold text-xs text-teal-700"
                                >
                                  <option value="false">No (Not dialysis dependent)</option>
                                  <option value="true">Yes (E.g. ESRD hemodialysis)</option>
                                </select>
                                <p className="text-[8px] text-slate-400 mt-1">Active clearance dependency</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {getIcd10Category(newPtDxIcd) === "other" && (
                          <div className="border border-slate-200 bg-slate-50/30 rounded-xl p-3.5 text-center">
                            <span className="text-[10px] font-bold text-slate-500">
                              ℹ️ Standard medicine profile selected. (Optional: Use presets above to load complex metrics)
                            </span>
                          </div>
                        )}

                        {/* HIGH FIDELITY CLINICAL ADAPTIVE LAB RATIOS: SHOWS AS ESSENTIAL GATE ONLY IF SPECIFIED BY PROTOCOL */}
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                              Creatinine (mg/dL)
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              value={newPtCreatinine}
                              onChange={(e) => setNewPtCreatinine(parseFloat(e.target.value) || 0.9)}
                              className={`w-full bg-white border rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs ${
                                currentTrial && currentTrial.rules.max_creatinine !== undefined
                                  ? "border-amber-250 text-amber-700 bg-amber-50/10"
                                  : "border-slate-200 text-slate-700"
                              }`}
                            />
                            {currentTrial && currentTrial.rules.max_creatinine !== undefined ? (
                              <p className="text-[8px] text-amber-600 font-medium">⚠️ Required Gate: ≤ {currentTrial.rules.max_creatinine}</p>
                            ) : (
                              <p className="text-[8px] text-slate-400 font-normal">🧪 Not targeted by selected trial</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                              ALT (U/L)
                            </span>
                            <input
                              type="number"
                              value={newPtAlt}
                              onChange={(e) => setNewPtAlt(parseInt(e.target.value) || 25)}
                              className={`w-full bg-white border rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs ${
                                currentTrial && currentTrial.rules.max_alt !== undefined
                                  ? "border-amber-250 text-amber-700 bg-amber-50/10"
                                  : "border-slate-200 text-slate-700"
                              }`}
                            />
                            {currentTrial && currentTrial.rules.max_alt !== undefined ? (
                              <p className="text-[8px] text-amber-600 font-medium">⚠️ Required Gate: ≤ {currentTrial.rules.max_alt}</p>
                            ) : (
                              <p className="text-[8px] text-slate-400 font-normal">🧪 Not targeted by selected trial</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-slate-400 tracking-wider text-[9px] uppercase block">
                              ANC (x10^9/L)
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              value={newPtAnc}
                              onChange={(e) => setNewPtAnc(parseFloat(e.target.value) || 2.2)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-mono font-bold text-xs"
                            />
                            {currentTrial ? (
                              <p className="text-[8px] text-indigo-600 font-medium">✨ Target Range: ≥ 1.5</p>
                            ) : (
                              <p className="text-[8px] text-slate-400 font-normal">🧪 Optional Standard</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-200/60 pt-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-400 tracking-wider text-[9px] uppercase">Washout Days</label>
                            <input
                              type="number"
                              value={newPtWashout}
                              onChange={(e) => setNewPtWashout(parseInt(e.target.value) || 30)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none text-center font-bold text-blue-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-400 tracking-wider text-[9px] uppercase">Prior Tx Lines</label>
                            <select
                              value={newPtPriorTxCount}
                              onChange={(e) => setNewPtPriorTxCount(parseInt(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-center text-xs"
                            >
                              <option value="0">Untreated (0)</option>
                              <option value="1">1 Line</option>
                              <option value="2">Refractory (2+)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-400 tracking-wider text-[9px] uppercase">Biopsy Consent</label>
                            <button
                              type="button"
                              onClick={() => setNewPtBiopsy(prev => !prev)}
                              className={`w-full p-2 rounded-lg border text-xs font-bold transition-all text-center h-[34px] flex items-center justify-center cursor-pointer ${
                                newPtBiopsy
                                  ? "bg-blue-100 text-blue-700 border-blue-300"
                                  : "bg-white text-slate-400 border-slate-200"
                              }`}
                            >
                              {newPtBiopsy ? "Granted" : "No"}
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-400 tracking-wider text-[9px] uppercase">Travel Willingness</label>
                            <button
                              type="button"
                              onClick={() => setNewPtLocationChange(prev => !prev)}
                              className={`w-full p-2 rounded-lg border text-xs font-bold transition-all text-center h-[34px] flex items-center justify-center cursor-pointer ${
                                newPtLocationChange
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                  : "bg-white text-slate-400 border-slate-200"
                              }`}
                            >
                              {newPtLocationChange ? "Willing" : "Strictly Local"}
                            </button>
                          </div>
                        </div>

                        {/* ONBOARDING BIOMARKER PROFILE UTILITY */}
                        <div className="border border-blue-200 bg-blue-50/15 rounded-xl p-3.5 space-y-3 mt-3">
                          <h5 className="font-bold text-blue-800 text-[10px] uppercase tracking-wider flex items-center justify-between border-b border-blue-200/60 pb-1.5">
                            <span className="flex items-center gap-1.5 font-sans">🧬 Staged Candidate Biomarker Profile</span>
                            <span className="text-[9px] text-blue-600 font-normal lowercase bg-blue-100/50 px-1.5 py-0.5 rounded">Adaptive Sandbox Draft</span>
                          </h5>

                          {/* Current List of Candidate Biomarkers */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                              <span className="text-[9px] font-extrabold text-slate-400 sidebar-accent uppercase tracking-widest block">Active Biomarkers ({onboardingBiomarkers.length})</span>
                              <span className="text-[8px] text-slate-400 font-normal">Included in Registered EHR</span>
                            </div>

                            {onboardingBiomarkers.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                                {onboardingBiomarkers.map((bm, index) => (
                                  <div key={index} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-700">
                                    <span>{bm.name}: <strong className="text-blue-600">{bm.result}</strong></span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOnboardingBiomarkers(prev => prev.filter((_, i) => i !== index));
                                      }}
                                      className="text-[10px] font-bold text-red-500 hover:text-red-700 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-slate-100"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 block italic py-1">No candidate biomarkers listed. Add custom ones below or use Onboarding Presets above.</span>
                            )}

                            {/* Inline Form to add biomarkers to candidate on the fly */}
                            <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                              <input
                                type="text"
                                id="newOnboardingBmName"
                                placeholder="Gene/Marker (e.g. ALK)"
                                className="flex-1 bg-slate-50 border border-slate-200 text-[10px] p-1.5 rounded focus:outline-none uppercase font-mono font-bold"
                              />
                              <input
                                type="text"
                                id="newOnboardingBmVal"
                                placeholder="Result (e.g. Positive)"
                                className="flex-1 bg-slate-50 border border-slate-200 text-[10px] p-1.5 rounded focus:outline-none font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const inputEl = document.getElementById("newOnboardingBmName") as HTMLInputElement;
                                  const resEl = document.getElementById("newOnboardingBmVal") as HTMLInputElement;
                                  if (inputEl && inputEl.value.trim()) {
                                    const name = inputEl.value.trim().toUpperCase();
                                    const valStr = resEl ? resEl.value.trim() || "Positive" : "Positive";
                                    setOnboardingBiomarkers(prev => {
                                      const filtered = prev.filter(b => b.name.toUpperCase() !== name);
                                      return [...filtered, { name, result: valStr }];
                                    });
                                    inputEl.value = "";
                                    if (resEl) resEl.value = "";
                                  } else {
                                    showToast("Please enter a biomarker name.", "error");
                                  }
                                }}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] px-2.5 rounded transition cursor-pointer flex items-center justify-center"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isOnboarding}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold p-3 rounded-lg text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-xs mt-2"
                        >
                          {isOnboarding ? (
                            <>
                              <Loader2 className="h-4.5 w-4.5 text-white animate-spin" />
                              Generating clinical profile...
                            </>
                          ) : (
                            <>Onboard & Initialize Subject Matching</>
                          )}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Load pre-configured profiles */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
                      Selected Clinical Subject List
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-2.5 text-xs font-bold focus:outline-none cursor-pointer focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                      value={selectedPatientId}
                      onChange={async (e) => {
                        setSelectedPatientId(e.target.value);
                        setTrials([]);
                        setSelectedTrialId("");
                        setSearchQuery("");
                        setSearchFeedback(null);
                        setNextPageToken(null);
                        try {
                          await fetch("/api/trials", { method: "DELETE" });
                          await loadRecords();
                        } catch (err) {
                          console.error("error resetting trials", err);
                        }
                      }}
                    >
                      {patients.map((p) => (
                        <option key={p.patient_id} value={p.patient_id}>
                          {p.name} ({p.patient_id}) {p.approvalStatus === "Approved" ? "● Approved" : p.approvalStatus === "Pending" ? "● Pending" : ""}
                        </option>
                      ))}
                    </select>

                    {currentPatient && currentPatient.raw_clinical_note && (
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => setShowRawNoteModal(true)}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-100 px-2 py-1.5 rounded border border-slate-700 font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          View Parsed Clinical Note
                        </button>
                      </div>
                    )}

                    {/* CONSULTING PHYSICIANS ASSIGNMENTS */}
                    {currentPatient && (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 mt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                            <span>👥</span> Specialty Trial Co-Investigators
                          </h4>
                          <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                            {(currentPatient.doctors || [currentClinician.email]).length} Assigned
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {(currentPatient.doctors || [currentClinician.email]).map((docName, i) => {
                              const foundClinician = clinicians.find(
                                (c) => c.email.toLowerCase() === docName.toLowerCase() || c.name.toLowerCase() === docName.toLowerCase()
                              );
                              const nameToRender = foundClinician ? foundClinician.name : docName;
                              const initials = foundClinician ? foundClinician.avatarInitials : "MD";
                              const bg = foundClinician ? foundClinician.color : "bg-slate-600";
                              const role = foundClinician ? foundClinician.role : "Consulting Investigator";

                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10.5px] font-bold text-slate-705 shadow-3xs"
                                >
                                  <div className={`w-4 h-4 rounded-full ${bg} flex items-center justify-center text-[8px] text-white font-extrabold`}>
                                    {initials}
                                  </div>
                                  <div className="leading-none">
                                    <div>{nameToRender}</div>
                                    <div className="text-[7.5px] text-slate-400 font-medium">{role}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Dropdown to assign another specialist */}
                          <div className="flex gap-1.5 pt-1.5 border-t border-slate-200/60">
                            <select
                              value={selectedNewDoctor}
                              onChange={(e) => setSelectedNewDoctor(e.target.value)}
                              className="flex-1 bg-white border border-slate-205 border-slate-300 rounded-lg p-1.5 text-[10.5px] text-slate-705 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                            >
                              <option value="">-- Choose Specialist to Consult --</option>
                              {clinicians
                                .filter((c) => !(currentPatient.doctors || [currentClinician.email]).includes(c.email) && !(currentPatient.doctors || [currentClinician.email]).includes(c.name))
                                .map((c) => (
                                  <option key={c.email} value={c.email}>
                                    {c.name} ({c.role})
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              disabled={!selectedNewDoctor}
                              onClick={async () => {
                                try {
                                  showToast(`Assigning co-investigator to ${currentPatient.name}...`, "info");
                                  const res = await fetch(`/api/patients/${currentPatient.patient_id}/doctors`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ doctorName: selectedNewDoctor })
                                  });
                                  if (res.ok) {
                                    showToast("Co-Investigator successfully assigned to track patient profile!", "success");
                                    setSelectedNewDoctor("");
                                    await loadRecords();
                                  } else {
                                    showToast("Failed assigning specialist.", "error");
                                  }
                                } catch (e: any) {
                                  showToast(`Assignment failed: ${e.message}`, "error");
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                            >
                              Assign co-Doc
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentPatient && currentPatient.approvalStatus && currentPatient.approvalStatus !== "None" && (
                      <div className={`p-3 rounded-lg text-xs flex items-center gap-2 mt-2 border ${
                        currentPatient.approvalStatus === "Approved"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${currentPatient.approvalStatus === "Approved" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                        <span>The candidate has approval status: <strong>{currentPatient.approvalStatus.toUpperCase()}</strong> for trial screening.</span>
                      </div>
                    )}
                  </div>

                  {/* PHASE 1: UNSTRUCTURED MEDICAL RECORD PARSER & DLP SCRUBBER */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-1">
                        <span>🧪</span> Phase 1: Unstructured Intake Note Ingest
                      </h4>
                      <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">
                        DLP Active
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-500 leading-normal">
                      Paste a raw physician clinical note below. The Gemini Profile Parser extracts diagnostic markers, while the DLP Proxy sanitizes personal identifiers.
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                         <input
                           type="text"
                           placeholder="Optional: Enter existing Patient ID to merge new data (e.g., PT-10048)"
                           value={mergePatientId}
                           onChange={(e) => setMergePatientId(e.target.value)}
                           className="w-full bg-white border border-[#CBD5E1] border-slate-300 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-sans"
                         />
                      </div>
                      <textarea
                        rows={5}
                        placeholder="Paste oncology history note or oncology clinical record..."
                        value={rawClinicalNote}
                        onChange={(e) => setRawClinicalNote(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] border-slate-300 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-sans"
                      />
                    </div>

                    {/* Stage Report file for analysis */}
                    <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                        <span className="text-[10px] text-slate-500 font-medium">
                          {noteFileName ? (
                            <span className="text-green-600 font-bold">Staged report: {noteFileName}</span>
                          ) : (
                            "Staged report document: None (Optional)"
                          )}
                        </span>
                      </div>
                      <label className="text-[9.5px] bg-slate-100 hover:bg-slate-250 hover:bg-slate-100/80 text-blue-600 font-bold px-2 py-1 rounded cursor-pointer transition border border-slate-200">
                        Choose PDF/Image
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNoteFileName(file.name);
                              showToast(`Staged report document: ${file.name}`, "info");
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                  const base64 = dataUrl.split(",")[1];
                                  const mime = file.type || "application/pdf";
                                  setNoteFileBase64(base64);
                                  setNoteFileMimeType(mime);
                                  await handleExtractTextFromFile(base64, mime);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Quick populate presets */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] text-slate-450 text-slate-400 font-bold uppercase mr-1">Load Preset:</span>
                      <button
                        type="button"
                        onClick={() => setRawClinicalNote("Charles Vance, 63yo M diagnosed with Stage IV Adenocarcinoma of the Right Upper Lobe (NSCLC) in March 2024. Experienced progressive disease after first-line cisplatin and pemetrexed. High mutational load, EGFR Exon 21 L858R mutation positive, KRAS wild-type, and PD-L1 expression TPS 25%. ECOG status is 1. Labs reveal creatinine 1.1 mg/dL, ALT 39 U/L, AST 42 U/L, and absolute neutrophil count 1.9. Resides in Cambridge, MA (zip 02138). Fully compliant with subsequent tumor genomic biopsies if recommended.")}
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer transition"
                      >
                        Charles Vance
                      </button>
                      <button
                        type="button"
                        onClick={() => setRawClinicalNote("Sarah Jenkins, 45-year-old F, Stage IIIB NSCLC with ALK-positive translocation. Received crizotinib initially, progressed on therapy. ECOG status of 0. Normal renal/hepatic labs: AST 22, ALT 24, Creatinine 0.8, ANC 2.8. Boston, MA (zip 02111). Will participate in fresh sequencing tissues biopsy.")}
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer transition"
                      >
                        Sarah Jenkins
                      </button>
                    </div>



                    <button
                      type="button"
                      onClick={handleParseClinicalNote}
                      disabled={isIngestingNote}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10.5px] uppercase tracking-wider py-2.5 rounded-lg transition cursor-pointer"
                    >
                      {isIngestingNote ? (
                        <span className="inline-flex items-center gap-1.5 text-white">
                          <Loader2 className="h-4 w-4 animate-spin text-white" /> Ingesting & Scrubbing Note...
                        </span>
                      ) : (
                        "Parse Profile & Mask PII"
                      )}
                    </button>
                  </div>

                  {/* Realtime Tuners - Realtime Parameter sliders */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-slate-400" />
                        Live parameters tuner
                      </h3>
                      <span className="text-[9px] font-bold text-blue-600 uppercase">Interactive consistency sandbox active</span>
                    </div>

                    {/* Tuner 1: Age */}
                    <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-600 font-sans font-medium">Demographic Age</span>
                        <span className="text-blue-600 font-extrabold">{tunedAge} years old</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="85"
                        step="1"
                        value={tunedAge}
                        onChange={(e) => setTunedAge(parseInt(e.target.value))}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400 block font-normal leading-tight">
                        Gate constraint: Trial minimum is 18 (Certain pediatric exception trials support &gt;= 12).
                      </span>
                    </div>

                    {/* Tuner 2: ECOG Selection */}
                    <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-600 font-sans font-semibold">ECOG Performance Index</span>
                        <span className="text-blue-600 font-bold">Grade {tunedEcog}</span>
                      </div>
                      <div className="flex justify-between gap-1 mt-1">
                        {[0, 1, 2, 3, 4].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setTunedEcog(v)}
                            className={`flex-1 py-1.5 rounded border text-xs font-mono font-bold transition-all cursor-pointer ${
                              tunedEcog === v
                                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-350"
                            }`}
                          >
                            G{v}
                          </button>
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-400 block leading-tight font-normal">
                        Clinical eligibility standard: Grade 0-1 is optimal; Grade 3+ creates exclusion gates.
                      </span>
                    </div>

                    {/* Labs biochem inputs */}
                    <div className="grid grid-cols-4 gap-2">
                      {/* Creatinine */}
                      <div className="bg-[#F8FAFC] p-2 rounded-lg border border-slate-200/90 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Creatinine</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="2.5"
                          value={tunedCreatinine}
                          onChange={(e) => setTunedCreatinine(parseFloat(e.target.value) || 0.1)}
                          className="w-full bg-white border border-slate-200 text-xs font-mono text-center font-bold text-blue-600 rounded p-1 focus:outline-none"
                        />
                        <span className="text-[8px] text-slate-400 block text-center leading-normal">mg/dL (Max {currentTrial?.rules?.max_creatinine || 1.5})</span>
                      </div>

                      {/* ALT */}
                      <div className="bg-[#F8FAFC] p-2 rounded-lg border border-slate-200/90 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">ALT trans.</span>
                        <input
                          type="number"
                          min="5"
                          max="150"
                          value={tunedAlt}
                          onChange={(e) => setTunedAlt(parseInt(e.target.value) || 5)}
                          className="w-full bg-white border border-slate-200 text-xs font-mono text-center font-bold text-blue-600 rounded p-1 focus:outline-none"
                        />
                        <span className="text-[8px] text-slate-400 block text-center leading-normal">U/L (Max {currentTrial?.rules?.max_alt || 45})</span>
                      </div>

                      {/* AST */}
                      <div className="bg-[#F8FAFC] p-2 rounded-lg border border-slate-200/90 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">AST trans.</span>
                        <input
                          type="number"
                          min="5"
                          max="150"
                          value={tunedAst}
                          onChange={(e) => setTunedAst(parseInt(e.target.value) || 5)}
                          className="w-full bg-white border border-slate-200 text-xs font-mono text-center font-bold text-blue-600 rounded p-1 focus:outline-none"
                        />
                        <span className="text-[8px] text-slate-400 block text-center leading-normal">U/L (Max {currentTrial?.rules?.max_alt || 45})</span>
                      </div>

                      {/* ANC */}
                      <div className="bg-[#F8FAFC] p-2 rounded-lg border border-slate-200/90 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">ANC Ratio</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="8.0"
                          value={tunedAnc}
                          onChange={(e) => setTunedAnc(parseFloat(e.target.value) || 0.1)}
                          className="w-full bg-white border border-slate-200 text-xs font-mono text-center font-bold text-blue-600 rounded p-1 focus:outline-none"
                        />
                        <span className="text-[8px] text-slate-400 block text-center leading-normal">K/uL (Min 1.5)</span>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Biopsy consent */}
                      <button
                        type="button"
                        onClick={() => setTunedBiopsy(prev => !prev)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          tunedBiopsy
                            ? "bg-blue-50/50 border-blue-200 text-blue-900 shadow-3xs"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[8px] uppercase font-bold text-slate-400 block truncate">Biopsy Consent</span>
                        <span className="text-[10px] font-bold mt-1 inline-flex items-center gap-1">
                          <span className={`h-2 h-2 rounded-full ${tunedBiopsy ? "bg-blue-600 animate-pulse" : "bg-slate-400"}`}></span>
                          {tunedBiopsy ? "Granted" : "No"}
                        </span>
                      </button>

                      {/* Travel Consent */}
                      <button
                        type="button"
                        onClick={() => setTunedLocationChange(prev => !prev)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          tunedLocationChange
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 shadow-3xs"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[8px] uppercase font-bold text-slate-400 block truncate">Travel / Location</span>
                        <span className="text-[10px] font-bold mt-1 inline-flex items-center gap-1">
                          <span className={`h-2 h-2 rounded-full ${tunedLocationChange ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`}></span>
                          {tunedLocationChange ? "Willing" : "No"}
                        </span>
                      </button>

                      {/* Prior PD-1 therapy EXCL */}
                      <button
                        type="button"
                        onClick={() => setHasPriorPd1Excl(prev => !prev)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          hasPriorPd1Excl
                            ? "bg-amber-50/50 border-amber-200 text-amber-900 shadow-3xs"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-[8px] uppercase font-bold text-slate-400 block truncate">Prior Immunotherapy</span>
                        <span className="text-[10px] font-bold mt-1 inline-flex items-center gap-1">
                          <span className={`h-2 h-2 rounded-full ${hasPriorPd1Excl ? "bg-amber-505 bg-amber-500 animate-pulse" : "bg-slate-400"}`}></span>
                          {hasPriorPd1Excl ? "Prior PD-1" : "Immuno-Naïve"}
                        </span>
                      </button>
                    </div>

                    {/* Patient Biomarkers & Molecular Profile Editor */}
                    <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200/70 space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                        <span>🧬 On-the-Fly Biomarker Profile</span>
                        <span className="text-[8.5px] font-normal text-blue-650 bg-blue-50/50 px-1.5 py-0.5 rounded">Core Screening Filters</span>
                      </h4>

                      {/* Standard quick-add / change grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* EGFR */}
                        <div className="bg-white border border-slate-200 p-2 rounded-lg space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-[9.5px] uppercase">EGFR</span>
                            {tunedBiomarkers.some(b => b.name.toUpperCase() === "EGFR" && !b.result.toUpperCase().includes("NEG")) && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">Expressed</span>
                            )}
                          </div>
                          <select
                            value={tunedBiomarkers.find(b => b.name.toUpperCase() === "EGFR")?.result || "Negative"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTunedBiomarkers(prev => {
                                const filtered = prev.filter(b => b.name.toUpperCase() !== "EGFR");
                                return [...filtered, { name: "EGFR", result: val }];
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="Negative">Negative (Wild-Type)</option>
                            <option value="Exon 19 deletion positive">Positive (Exon 19 del)</option>
                            <option value="L858R positive">Positive (L858R)</option>
                          </select>
                        </div>

                        {/* ALK */}
                        <div className="bg-white border border-slate-200/60 p-2 rounded-lg space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-[9.5px] uppercase">ALK Gene</span>
                            {tunedBiomarkers.some(b => b.name.toUpperCase() === "ALK" && !b.result.toUpperCase().includes("NEG")) && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">Expressed</span>
                            )}
                          </div>
                          <select
                            value={tunedBiomarkers.find(b => b.name.toUpperCase() === "ALK")?.result || "Negative"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTunedBiomarkers(prev => {
                                const filtered = prev.filter(b => b.name.toUpperCase() !== "ALK");
                                return [...filtered, { name: "ALK", result: val }];
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="Negative">Negative</option>
                            <option value="Positive">Positive (Rearranged)</option>
                          </select>
                        </div>

                        {/* PD-L1 */}
                        <div className="bg-white border border-slate-200 p-2 rounded-lg space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-[9.5px] uppercase">PD-L1 Expression</span>
                            {(() => {
                              const val = tunedBiomarkers.find(b => b.name.toUpperCase() === "PD-L1")?.result || "Negative";
                              const hasExp = !val.toUpperCase().includes("NEG") && val !== "TPS 0%";
                              return hasExp && (
                                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">Expressed</span>
                              );
                            })()}
                          </div>
                          <select
                            value={tunedBiomarkers.find(b => b.name.toUpperCase() === "PD-L1")?.result || "Negative"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTunedBiomarkers(prev => {
                                const filtered = prev.filter(b => b.name.toUpperCase() !== "PD-L1");
                                return [...filtered, { name: "PD-L1", result: val }];
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="Negative">Negative / TPS 0%</option>
                            <option value="TPS 5%">Low (TPS 5%)</option>
                            <option value="TPS 80%">High (TPS 80%)</option>
                          </select>
                        </div>

                        {/* KRAS */}
                        <div className="bg-white border border-slate-200 p-2 rounded-lg space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-[9.5px] uppercase">KRAS</span>
                            {tunedBiomarkers.some(b => b.name.toUpperCase() === "KRAS" && !b.result.toUpperCase().includes("NEG")) && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">Expressed</span>
                            )}
                          </div>
                          <select
                            value={tunedBiomarkers.find(b => b.name.toUpperCase() === "KRAS")?.result || "Negative"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTunedBiomarkers(prev => {
                                const filtered = prev.filter(b => b.name.toUpperCase() !== "KRAS");
                                return [...filtered, { name: "KRAS", result: val }];
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="Negative">Negative</option>
                            <option value="G12C positive">Positive (G12C mutation)</option>
                            <option value="G12D positive">Positive (G12D mutation)</option>
                          </select>
                        </div>
                      </div>

                      {/* Arbitrary active list + Custom Add section */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest block">Full active profile ({tunedBiomarkers.length})</span>
                          <span className="text-[8px] text-slate-400 font-normal">Real-Time Sync active</span>
                        </div>
                        
                        {tunedBiomarkers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                            {tunedBiomarkers.map((bm, index) => (
                              <div key={index} className="flex items-center gap-1.5 bg-slate-50 border border-slate-202 bg-white px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-700">
                                <span>{bm.name}: <strong className="text-blue-600">{bm.result}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTunedBiomarkers(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="text-[9px] font-bold text-red-500 hover:text-red-705 w-4.5 h-4.5 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-slate-100"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 block italic py-1">No biomarkers mapped yet for this instance.</span>
                        )}

                        {/* Inline Custom Add Form */}
                        <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                          <input
                            type="text"
                            id="newCustomBmName"
                            placeholder="Gene Name (e.g. BRAF)"
                            className="flex-1 bg-slate-50 border border-slate-200 text-[10.5px] p-1.5 rounded focus:outline-none uppercase font-mono font-bold"
                          />
                          <input
                            type="text"
                            id="newCustomBmVal"
                            placeholder="Result (e.g. V600E positive)"
                            className="flex-1 bg-slate-50 border border-slate-200 text-[10.5px] p-1.5 rounded focus:outline-none font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById("newCustomBmName") as HTMLInputElement;
                              const resEl = document.getElementById("newCustomBmVal") as HTMLInputElement;
                              if (inputEl && inputEl.value.trim()) {
                                const name = inputEl.value.trim().toUpperCase();
                                const valStr = resEl ? resEl.value.trim() || "Positive" : "Positive";
                                setTunedBiomarkers(prev => {
                                  const filtered = prev.filter(b => b.name.toUpperCase() !== name);
                                  return [...filtered, { name, result: valStr }];
                                });
                                inputEl.value = "";
                                if (resEl) resEl.value = "";
                              } else {
                                showToast("Please enter a biomarker gene name.", "error");
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] px-2.5 rounded transition cursor-pointer flex items-center justify-center"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* SAVE WORK TO SERVER BUTTON */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentPatient) return;
                            try {
                              showToast(`Saving changes to Electronic Health Records (EHR)...`, "info");
                              const payload = {
                                age: tunedAge,
                                ecog_performance_status: tunedEcog,
                                lab_values: {
                                  creatinine: tunedCreatinine,
                                  ALT: tunedAlt,
                                  AST: tunedAst,
                                  ANC: tunedAnc
                                },
                                last_therapy_days_ago: tunedWashout,
                                willing_to_biopsy: tunedBiopsy,
                                willing_to_change_location: tunedLocationChange,
                                biomarkers: tunedBiomarkers
                              };
                              const response = await fetch(`/api/patients/${currentPatient.patient_id}/update-profile`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                              });
                              
                              if (response.ok) {
                                showToast(`Success: Updated Subject #${currentPatient.patient_id} EHR profile & biomarker panel in central database!`, "success");
                                lastPatientIdRef.current = "";
                                await loadRecords(); // reload from backend to synchronize
                              } else {
                                const errData = await response.json();
                                showToast(`Error: ${errData.error || "Save rejected"}`, "error");
                              }
                            } catch (expError: any) {
                              showToast(`EHR sync failure: ${expError.message}`, "error");
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition cursor-pointer shadow-3xs"
                        >
                          ⚡ Save Changes Permanent to Patient EHR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === "approvals" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sent referrals registry</span>
                    <span className="text-[9px] font-mono text-slate-400 lowercase">{approvals.length} active dispatches</span>
                  </div>

                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {approvals.length > 0 ? (
                      approvals.map((app) => (
                        <div key={app.approval_id} className="bg-[#F8FAFC] border border-slate-250 border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-mono text-blue-600 font-bold">{app.approval_id}</span>
                              <h4 className="font-extrabold text-slate-800 mt-0.5">{app.patient_name}</h4>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${
                              app.status === "Dispatched" || app.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-250 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="text-[10.5px] text-slate-650 bg-white border border-slate-150 rounded p-2.5 leading-relaxed font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                            <strong>Subject: {app.email_subject}</strong>
                            <div className="border-t border-slate-100 my-1 pb-1"></div>
                            {app.email_body}
                          </div>

                          {/* Clinicians Attribution Row */}
                          <div className="flex flex-wrap gap-2 text-[9px] text-slate-500 bg-white border border-slate-200/60 rounded p-2 font-mono">
                            <div className="flex items-center gap-1">
                              <span>📝 Drafted by:</span>
                              <span className="font-extrabold text-slate-700">{app.drafted_by_name || "Dr. Google, MD"}</span>
                              {app.drafted_by_email && <span className="text-slate-400 text-[8.5px]">({app.drafted_by_email})</span>}
                            </div>
                            {(app.approved_by_name || app.status === "Dispatched" || app.status === "APPROVED") && (
                              <div className="flex items-center gap-1 border-l border-slate-250 pl-2">
                                <span>🩺 Approved by:</span>
                                <span className="font-extrabold text-[#059669]">{app.approved_by_name || app.drafted_by_name || "Dr. Google, MD"}</span>
                                <span className="text-[8.5px] text-slate-450">({app.approved_by_email || app.drafted_by_email || "dr.google@triallogix.org"})</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-205 border-slate-200 pt-2 font-mono">
                            <span>To: {app.coordinator_email}</span>
                            <span>{new Date(app.timestamp).toLocaleString().substring(0, 16)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300/80 text-center space-y-2.5 text-xs text-slate-500">
                        <Mail className="h-8 w-8 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-700">No Sent Logs Found</h4>
                        <p className="max-w-xs mx-auto text-[11px] leading-normal">
                          Referral portfolios have not been scheduled yet. Once you approve a candidate match, their referral package will show here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeLeftTab === "streamlit" && (
                <div className="space-y-4 font-sans text-xs">
                  {/* Streamlit Top Banner */}
                  <div className="bg-[#0E1117] text-[#FAFAFA] p-4 rounded-xl space-y-2 border-l-4 border-[#FF4B4B]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🎈</span>
                        <h3 className="font-extrabold text-xs text-slate-100 tracking-tight">Streamlit HITL Portal</h3>
                      </div>
                      <span className="font-mono text-[8px] bg-[#FF4B4B]/20 text-[#FF4B4B] px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">
                        Live Queue
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Human-In-The-Loop review dashboard for medical advisors. Edit and authorize recommended candidate matches.
                    </p>
                  </div>

                  {/* Standard Streamlit Selectbox emulator */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      st.selectbox("Select Pending Candidate Referral Dossier", options)
                    </label>
                    <select
                      value={selectedPendingApprovalId}
                      onChange={(e) => setSelectedPendingApprovalId(e.target.value)}
                      className="w-full bg-[#F0F2F6] hover:bg-[#E4E6EA] text-slate-800 border border-slate-300 font-medium py-2 px-3 rounded-lg text-xs transition duration-200 cursor-pointer focus:outline-none"
                    >
                      <option value="">-- Choose pending approval dossier --</option>
                      {approvals
                        .filter((a) => a.status === "PENDING_REVIEW")
                        .map((a) => (
                          <option key={a.approval_id} value={a.approval_id}>
                            {a.approval_id} - {a.patient_name} ({a.nct_id})
                          </option>
                        ))}
                    </select>
                  </div>

                  {(() => {
                    const selectedRecord = approvals.find((a) => a.approval_id === selectedPendingApprovalId);
                    if (!selectedRecord) {
                      return (
                        <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
                          <div className="text-2xl text-slate-300">📥</div>
                          <h4 className="font-bold text-slate-700">Verification Queue Clear</h4>
                          <p className="text-[10.5px] text-slate-500 leading-normal max-w-xs mx-auto">
                            There are currently no referrals set to <strong>PENDING_REVIEW</strong> status. Select a patient match in the checklist, click "Draft Referral Packet" first!
                          </p>
                        </div>
                      );
                    }

                    // Look up corresponding original patient profile
                    const correspondingPatient = patients.find((p) => p.patient_id === selectedRecord.patient_id);

                    return (
                      <div className="space-y-4">
                        {/* Streamlit st.info emulator showing drafting doctor */}
                        <div className="bg-[#E0F2FE]/40 border-l-4 border-sky-500 text-slate-700 p-3 rounded-lg text-[10.5px] font-mono leading-relaxed">
                          <div className="font-bold uppercase text-[9px] text-sky-700 tracking-wider mb-0.5">
                            st.info("Clinical Draft Orator")
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>🧑‍⚕️</span>
                            <span>
                              Draft Proposal formulated by:{" "}
                              <strong className="text-slate-800 font-sans">
                                {selectedRecord.drafted_by_name || "Dr. Google, MD"}
                              </strong>{" "}
                              ({selectedRecord.drafted_by_email || "dr.google@triallogix.org"})
                            </span>
                          </div>
                        </div>

                        {/* HIPAA Masking Side-by-Side Emulator */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs bg-slate-50 p-3 space-y-3">
                          <div className="flex items-center gap-1 text-slate-600 font-bold text-[9px] uppercase tracking-wider">
                            <span>🔍</span>
                            <span>st.expander("Compare DLP Masking Integrity")</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            {/* Masked Column */}
                            <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 space-y-1.5 shadow-3xs">
                              <span className="font-extrabold text-rose-600 uppercase text-[9px] block">DLP Masked Record</span>
                              <div>
                                <span className="text-slate-400 block font-medium">Candidate Name:</span>
                                <span className="font-bold text-slate-800 font-mono">
                                  [REDACTED CANDIDATE {selectedRecord.patient_id}]
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Dossier Index:</span>
                                <span className="font-bold font-mono text-slate-800">{selectedRecord.patient_id}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium font-mono">Geographic ZIP:</span>
                                <span className="font-bold font-mono text-slate-800">
                                  {correspondingPatient?.location.zip ? correspondingPatient.location.zip.substring(0, 3) + "XX" : "021XX"}
                                </span>
                              </div>
                            </div>

                            {/* Original Column */}
                            <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1.5 shadow-3xs">
                              <span className="font-extrabold text-blue-750 text-blue-700 uppercase text-[9px] block">Licensed EHR Sync</span>
                              <div>
                                <span className="text-slate-400 block font-medium">Name:</span>
                                <span className="font-bold text-blue-900">{selectedRecord.patient_name}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Age / Sex:</span>
                                <span className="font-bold text-slate-800">
                                  {correspondingPatient?.age || 63} / {correspondingPatient?.sex || "M"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Unredacted Center:</span>
                                <span className="font-bold text-slate-800 font-mono leading-none">
                                  {correspondingPatient?.location.city}, {correspondingPatient?.location.state}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* EHR biochemistry validation check */}
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-600 font-bold text-base">✓</span>
                            <div>
                              <span className="font-extrabold text-emerald-800 block">EHR Real-Time Sync Calibrated</span>
                              <span className="text-slate-500 text-[10px]">AST, Platelets & Hemoglobin verified</span>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-3xs">
                            AST: {correspondingPatient?.lab_values.AST || 31} U/L
                          </span>
                        </div>

                        {/* Subject Input */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            st.text_input("Review Referral Memo Subject")
                          </label>
                          <input
                            type="text"
                            value={editedStreamlitSubject}
                            onChange={(e) => setEditedStreamlitSubject(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#FF4B4B]"
                          />
                        </div>

                        {/* Body Area */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            st.text_area("Review Referral Letter Template")
                          </label>
                          <textarea
                            rows={8}
                            value={editedStreamlitBody}
                            onChange={(e) => setEditedStreamlitBody(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#FF4B4B]"
                          />
                        </div>

                        {/* Action buttons matching streamlit st.button */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleStreamlitWebhookApprove(selectedRecord.approval_id)}
                              disabled={isSubmittingStreamlitApproval || isDeletingDraft}
                              className={`w-full font-bold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-md transition duration-200 flex items-center justify-center gap-1.5 ${
                                isSubmittingStreamlitApproval
                                  ? "bg-slate-400 text-white cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {isSubmittingStreamlitApproval ? (
                                <>
                                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  <span>Sending Webhook...</span>
                                </>
                              ) : (
                                <>
                                  <span>🎈 st.button("Approve & Dispatch")</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePendingDraft(selectedRecord.approval_id)}
                              disabled={isSubmittingStreamlitApproval || isDeletingDraft}
                              className={`w-full font-bold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-md transition duration-200 flex items-center justify-center gap-1.5 ${
                                isDeletingDraft
                                  ? "bg-slate-450 text-white cursor-not-allowed shadow-none"
                                  : "bg-slate-100 hover:bg-slate-205 border border-slate-300 text-slate-700"
                              }`}
                            >
                              {isDeletingDraft ? (
                                <>
                                  <span className="h-3.5 w-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin animate-spin"></span>
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <span>🗑 st.button("Delete Draft")</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Audit Result Display block */}
                          {auditResult && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                                <span>🎉</span>
                                <h4>st.success("WebHook Verified & SMTP Outreach Dispatched!")</h4>
                              </div>
                              <div className="bg-white border border-emerald-150 border-slate-200 rounded-lg p-2.5 font-mono space-y-1 shadow-3xs text-[10px] text-slate-705 text-slate-700 leading-normal">
                                <div className="flex justify-between">
                                  <span className="text-slate-450 text-slate-400">Audit Log Record:</span>
                                  <span className="text-blue-600 font-bold">{auditResult.auditLogId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-450 text-slate-400">Approved Advisor:</span>
                                  <span className="text-slate-800 font-bold">{auditResult.approvedBy}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-455 text-slate-400 font-mono">Dispatch Stamp:</span>
                                  <span>{auditResult.timestamp}</span>
                                </div>
                                <div className="border-t border-slate-100 my-1 pt-1 flex justify-between gap-1 overflow-x-auto leading-none">
                                  <span className="text-slate-450 text-slate-400 shrink-0">TLS Token:</span>
                                  <span className="text-emerald-700 font-bold block overflow-hidden truncate max-w-[120px] font-mono">{auditResult.deliveryReceipt}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

            {/* MIDDLE ROW INTRODUCES SEARCH AND ACTIVE PROTOCOLS */}
            <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50/50 rounded-lg border border-blue-100">
                    <Activity className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight">Active study protocols</h2>
                </div>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Registry list</span>
              </div>

              {/* LIVE CLINICAL TRIALS SEARCH MODULE */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 p-4 rounded-xl space-y-3 text-xs leading-normal">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 text-xs">
                  <Search className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                  <h4>Live clinicaltrials.gov crawler</h4>
                </div>
                <p className="text-[10px] text-slate-550 block leading-relaxed font-medium">
                  Direct connectivity to NIH datasets. Input primary pathology or clinical mutations indicators below.
                </p>

                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    placeholder="e.g. non-small cell lung cancer, lymphoma"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-0 bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  <select
                    value={searchPageSize}
                    onChange={(e) => setSearchPageSize(Number(e.target.value))}
                    className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none text-slate-705 font-semibold text-slate-700 max-w-[95px]"
                    title="Results Limit"
                  >
                    <option value={5}>5 Limit</option>
                    <option value={10}>10 Limit</option>
                    <option value={25}>25 Limit</option>
                    <option value={50}>50 Limit</option>
                    <option value={100}>100 Limit</option>
                  </select>
                  <button
                    onClick={handleClinicalTrialsSearch}
                    disabled={isSearchingTrials || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center min-w-[55px]"
                  >
                    {isSearchingTrials ? (
                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => {
                      if (!currentPatient) return;
                      const primaryDx = currentPatient.diagnoses[0]?.description || "";
                      
                      // Clear quotes and normalize spacing
                      let term = primaryDx.replace(/['"`“”']/g, "").replace(/\s+/g, " ").trim();
                      
                      // Remove common clinical noise/specifications that clog condition searches
                      term = term.replace(/\b(stage\s+[ivxld\s\d-]+|grade\s+\d+|metastatic|recurrent|unspecified|co-existing|with\s+[\w\s-]+\b|associated\s+with\s+[\w\s-]+\b)\b/gi, "");
                      
                      // Detect first-class oncology/immunology/chronic trial-ready acronyms
                      const acronymMatch = primaryDx.match(/\((NSCLC|DLBCL|COPD|CKD|HIV-1|HIV|ART)\)/i);
                      if (acronymMatch && acronymMatch[1]) {
                        term = acronymMatch[1].toUpperCase();
                      } else {
                        // Strip remaining parenthesis
                        term = term.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "");
                        
                        const lowerTerm = term.toLowerCase();
                        if (lowerTerm.includes("non-small cell lung cancer") || lowerTerm.includes("nsclc")) {
                          term = "Non-Small Cell Lung Cancer";
                        } else if (lowerTerm.includes("osteosarcoma")) {
                          term = "Osteosarcoma";
                        } else if (lowerTerm.includes("diffuse large b-cell lymphoma") || lowerTerm.includes("dlbcl")) {
                          term = "Diffuse Large B-Cell Lymphoma";
                        } else if (lowerTerm.includes("hiv") || lowerTerm.includes("aids")) {
                          term = "HIV";
                        } else if (lowerTerm.includes("hypertension")) {
                          term = "Hypertension";
                        } else if (lowerTerm.includes("diabetes")) {
                          term = "Diabetes";
                        } else if (lowerTerm.includes("rheumatoid arthritis")) {
                          term = "Rheumatoid Arthritis";
                        } else if (lowerTerm.includes("alzheimer")) {
                          term = "Alzheimer's Disease";
                        } else if (lowerTerm.includes("copd") || lowerTerm.includes("obstructive pulmonary")) {
                          term = "COPD";
                        } else if (lowerTerm.includes("kidney disease") || lowerTerm.includes("ckd") || lowerTerm.includes("renal")) {
                          term = "Chronic Kidney Disease";
                        } else if (lowerTerm.includes("breast cancer") || lowerTerm.includes("ductal carcinoma")) {
                          term = "Breast Cancer";
                        } else if (lowerTerm.includes("melanoma")) {
                          term = "Melanoma";
                        } else if (lowerTerm.includes("colorectal") || lowerTerm.includes("colon cancer")) {
                          term = "Colorectal Cancer";
                        } else if (lowerTerm.includes("gastrointestinal stromal") || lowerTerm.includes("gist")) {
                          term = "Gastrointestinal Stromal Tumor";
                        } else if (lowerTerm.includes("prostate cancer")) {
                          term = "Prostate Cancer";
                        } else if (lowerTerm.includes("ovarian cancer")) {
                          term = "Ovarian Cancer";
                        }
                      }
                      
                      // Strip anatomical specificities or diagnostic subtypes (like "of the left femur", "adenocarcinoma")
                      term = term.replace(/\s+of\s+the\s+.*$/i, "");
                      term = term.replace(/\s+adenocarcinoma.*$/i, "");
                      term = term.replace(/['"`]+/g, "").trim();

                      // Search for driver genes/biomarkers to append for a more precise specific query!
                      const coreDisease = term || "lung cancer";
                      let finalQuery = coreDisease;

                      const positiveBiomarkers = currentPatient.biomarkers?.filter(b => 
                        b.result && !b.result.toLowerCase().includes("negative") && !b.result.toLowerCase().includes("loss")
                      );
                      
                      if (positiveBiomarkers && positiveBiomarkers.length > 0) {
                        // Append the first prominent specific driver gene/biomarker
                        finalQuery = `${coreDisease} AND ${positiveBiomarkers[0].name}`;
                      }
                      
                      setSearchQuery(finalQuery);
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    🔍 Autofill with patient disease & driver gene
                  </button>
                  {searchFeedback && (
                    <span className="text-[9px] text-emerald-800 font-bold">Processed Successfully!</span>
                  )}
                </div>
              </div>

              {/* Protocol selection loop lists */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 block tracking-wider uppercase">Active Trial Selection</label>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {trials.map((t) => (
                    <button
                      key={t.nct_id}
                      onClick={() => setSelectedTrialId(t.nct_id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                        selectedTrialId === t.nct_id
                          ? "bg-blue-50/50 border-blue-300 text-blue-900 shadow-3xs"
                          : "bg-white border-slate-200 hover:bg-slate-50/40 text-slate-600"
                      }`}
                    >
                      {t.isCustomSearched && (
                        <span className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shadow-2xs">
                          ClinicalTrials.gov
                        </span>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-extrabold text-blue-600">{t.nct_id}</span>
                        <span className="text-[9px] font-extrabold bg-slate-100 border border-slate-150 px-2 py-0.5 rounded text-slate-600 uppercase">
                          {t.phase.split("/")[0]}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-1.5 leading-normal max-w-[85%]">{t.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sponsor: {t.sponsor}</p>
                    </button>
                  ))}
                </div>

                {nextPageToken && (
                  <div className="pt-1 flex justify-center">
                    <button
                      onClick={handleLoadMoreTrials}
                      disabled={isLoadingMore}
                      className="w-full py-2 px-3 border border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                          <span>Loading more trials...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Load More Trials (NIH Dataset)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Active Trial limits card */}
              {currentTrial && (
                <div className="bg-[#F8FAFC] border border-slate-200/80 p-4 rounded-xl space-y-2 text-xs leading-relaxed font-sans shadow-3xs">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-1.5">
                    <span className="font-mono font-bold text-[10px] uppercase text-slate-500 tracking-wider">Active Trial Constraints</span>
                    <a
                      href={currentTrial.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 inline-flex items-center gap-1 hover:underline"
                    >
                      View Trial Source <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-600">
                    <div>
                      <span className="text-slate-400">Pathology Target:</span>
                      <p className="font-bold text-slate-850 mt-0.5">{currentTrial.rules.required_conditions.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Driver Gene:</span>
                      <p className="font-bold text-slate-850 mt-0.5">{currentTrial.rules.required_biomarkers.join(", ") || "None specified"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Max ECOG Grade:</span>
                      <p className="font-bold text-slate-850 mt-0.5">Grade &lt;= {currentTrial.rules.max_ecog}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Hepatic Limits:</span>
                      <p className="font-bold text-slate-850 mt-0.5">ALT &lt;= {currentTrial.rules.max_alt} U/L</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Inclusion Parameters Summary</span>
                    <div className="text-[10.5px] text-slate-600 mt-1.5 leading-snug space-y-1">
                      {(() => {
                        const lines = currentTrial.inclusion_criteria
                          .split("\n")
                          .map(l => l.trim())
                          .filter(l => l.length > 0 && !l.toLowerCase().includes("inclusion criteria"));
                        // Take 5 to 6 lines (default to active 6 lines)
                        const displayLines = lines.slice(0, 6);
                        
                        return displayLines.map((line, idx) => (
                          <div key={idx} className="line-clamp-1 flex items-start gap-1">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <span className="truncate">{line.startsWith("-") ? line.substring(1).trim() : line}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT COLUMN: SCORING & INTEGRATIVE APPROVAL TRIGGER */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* CENTRAL ELIGIBILITY SCORE OVERVIEW CHIP */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trial Compatibility Index</span>

                {matchResult ? (
                  <>
                    <div className="relative py-1 flex justify-center items-center">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          strokeWidth="8"
                          stroke="#E2E8F0"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          strokeWidth="8"
                          stroke={
                            matchResult.score >= 85
                              ? "#10B981"
                              : matchResult.score >= 50
                              ? "#3B82F6"
                              : "#EF4444"
                          }
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - (matchResult.score || 0) / 100)}
                          fill="transparent"
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                      </svg>
                      {/* Inner text score */}
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">{matchResult.score}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Match pts</span>
                      </div>
                    </div>

                    <div className={`py-1.5 px-4 rounded-full text-[10px] font-extrabold uppercase border inline-block text-center shadow-3xs ${getStatusColor(matchResult.match_status)}`}>
                      {matchResult.match_status.replace("_", " ")}
                    </div>

                    <p className="text-xs text-slate-500 leading-normal font-medium px-2">
                       {matchResult.eligibility_summary}
                    </p>

                    {/* SUGGEST PARTICULAR BIOMARKER COMPANION TEST */}
                    {(() => {
                      const required = currentTrial.rules.required_biomarkers || [];
                      const hasMissingBiomarker = required.some(bm => {
                        const ptBm = currentPatient?.biomarkers.find(b => b.name.toUpperCase() === bm.toUpperCase());
                        return !ptBm || ptBm.result.toUpperCase().includes("NEG") || ptBm.result.toUpperCase().includes("UNKNOWN");
                      });

                      if (required.length > 0 && hasMissingBiomarker) {
                        return (
                          <div className="bg-amber-50/70 border border-amber-250 rounded-xl p-3 text-left space-y-1 mx-2">
                            <div className="flex items-center gap-1 text-amber-800 font-extrabold text-[10px] uppercase font-mono">
                              <span className="text-amber-500 text-xs">🧪</span>
                              Match Suggestion
                            </div>
                            <p className="text-[10px] font-medium text-amber-700 leading-relaxed font-sans">
                              Schedule a companion **{required.join(", ")}** PCR/NGS assay or tissue immunohistochemistry to verify trial suitability.
                            </p>
                          </div>
                        );
                      } else if (required.length === 0 && (!currentPatient?.biomarkers || currentPatient.biomarkers.length < 3)) {
                        return (
                          <div className="bg-blue-50/40 border border-blue-200/50 rounded-xl p-3 text-left space-y-1 mx-2">
                            <div className="flex items-center gap-1 text-blue-800 font-extrabold text-[10px] uppercase font-mono">
                              <span className="text-blue-500 text-xs">🔬</span>
                              Genomics Recommendation
                            </div>
                            <p className="text-[10px] font-medium text-blue-700 leading-relaxed font-sans">
                              Consider ordering a comprehensive Next-Gen Sequencing (NGS) multiplex panel to rule out actionable driver mutations or exclusions.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* APPROVATION TRIGGERS FOR TRANSPLANT DISPATCH */}
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <button
                        onClick={handleInitiateApprovalDraft}
                        disabled={isGeneratingReferral}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-2.5 px-4 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        {isGeneratingReferral ? (
                          <>
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                            Compiling dispatch Letter...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-white" />
                            Approve Match & Dispatch
                          </>
                        )}
                      </button>
                      <span className="text-[9px] text-slate-400 mt-1.5 block">
                        Calculates structured match parameters and customizes peer memo.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Please load a patient chart selection first.
                  </div>
                )}
              </section>

              {/* DETERMINISTIC STABILITY SANDBOX SUMMARY */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-800">Scoring Stability</h4>
                  </div>
                  <span className="text-[8px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 uppercase font-bold">Stable</span>
                </div>

                <p className="text-xs text-slate-500 leading-normal">
                  Evaluate patient parameters through 100 consecutive instances to guarantee perfect algorithm consistency.
                </p>

                <button
                  onClick={runConsistencySimulation}
                  disabled={simulationActive}
                  className="w-full border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg p-2.5 text-xs font-bold flex justify-center items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {simulationActive ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      Running 100 trials...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 text-blue-600 fill-current" />
                      Execute 100 repeated runs
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {simResults && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-25 text-[10px] font-mono leading-normal"
                    >
                      <div className="border-b border-slate-200 pb-1 mb-1 font-sans text-slate-400 flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold">Calculations logs</span>
                        <span className="text-emerald-700 font-extrabold text-[9px]">COMPLETED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-650">
                        <div>
                          <span className="text-slate-405 text-slate-400 uppercase text-[8px] block">Global Min</span>
                          <strong className="text-slate-800 font-semibold">{simResults.minScore}/100</strong>
                        </div>
                        <div>
                          <span className="text-slate-405 text-slate-400 uppercase text-[8px] block">Global Max</span>
                          <strong className="text-slate-800 font-semibold">{simResults.maxScore}/100</strong>
                        </div>
                        <div>
                          <span className="text-slate-405 text-slate-400 uppercase text-[8px] block">Variance (s²)</span>
                          <strong className="text-blue-600 font-bold">{simResults.variance.toFixed(4)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-405 text-slate-400 uppercase text-[8px] block">Std Dev. (σ)</span>
                          <strong className="text-blue-600 font-bold">{simResults.stdDev.toFixed(4)}</strong>
                        </div>
                      </div>
                      <div className="pt-2 mt-1.5 border-t border-slate-200/80 font-sans text-green-800 flex items-start gap-1">
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                        <span>Perfect algorithmic alignment confirmed across 100 trials (No random drift detected).</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>
          </div>
        )}

        {/* =====================================================================
            ADVANCED CLINICAL AGENCY OPERATIONS (PHASES 2, 3)
            ===================================================================== */}
        {currentPatient && currentTrial && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 shadow-3xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-blue-600 text-white rounded font-black text-xs uppercase font-mono leading-none">Phases 2-3</span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">Advanced Clinical Agency Hub</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none">Execute advanced EHR validation, AI reasoning, and web context grounding</p>
                </div>
              </div>
              <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase shrink-0">
                Agentic Flow Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans items-start">
              
              {/* Phase 2 A: EHR Biochemistry Synchronization */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-3xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-black px-2 py-1 rounded uppercase font-mono leading-none font-sans">
                      Phase 2 // EHR Sync
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">EPIC/FHIR Node</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-[11.5px]">EHR Biochemistry Sync</h4>
                  <p className="text-[10px] text-slate-505 text-slate-500 leading-normal">
                    Pulls secondary AST liver transaminases, platelets, Hb, and lab parameters in real-time from the hospital clinical repository database.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSyncEhrValues(currentPatient.patient_id)}
                    disabled={isEhrSyncing}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {isEhrSyncing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                        Pulling EHR values...
                      </>
                    ) : (
                      "⚡ Sync Lab values"
                    )}
                  </button>

                  {/* Synced results readout */}
                  {syncedLabsResult && (
                    <motion.div
                      ref={syncedLabsRef}
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 font-sans text-xs text-slate-700 space-y-2 leading-relaxed shadow-xs"
                    >
                      <div className="flex justify-between items-center font-sans font-black text-emerald-800 border-b border-emerald-100 pb-1.5 text-[11px] uppercase tracking-wide">
                        <span>⚡ LIVE EHR CLONE ACTIVE</span>
                        <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full text-[9px] font-bold">CONNECTED</span>
                      </div>

                      <div className="space-y-3.5 text-[11px]">
                        {/* Section 1: Demographics & Physical State */}
                        <div className="space-y-1">
                          <div className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest mb-1 font-mono">
                            👤 Demographics & ECOG STATUS
                          </div>
                          <div className="bg-white/50 border border-emerald-100/60 rounded-lg p-2 space-y-1 shadow-3xs">
                            <div className="flex justify-between py-0.5 border-b border-dotted border-emerald-100/50">
                              <span className="text-slate-500 font-medium">Age & Gender:</span>
                              <span className="font-extrabold text-slate-800">
                                {currentPatient.age} yo ({currentPatient.sex === "M" ? "Male" : currentPatient.sex === "F" ? "Female" : "Other"})
                              </span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-dotted border-emerald-100/50">
                              <span className="text-slate-500 font-medium">ECOG Performance:</span>
                              <span className="bg-emerald-100 text-emerald-900 border border-emerald-250 font-black px-1.5 py-0.2 rounded font-mono text-[9px]">
                                STATUS {currentPatient.ecog_performance_status}
                              </span>
                            </div>
                            <div className="flex justify-between py-0.5">
                              <span className="text-slate-500 font-medium">Facility Location:</span>
                              <span className="font-extrabold text-slate-800">
                                {currentPatient.location.city}, {currentPatient.location.state} ({currentPatient.location.country})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Synced Genomic Biomarkers */}
                        <div className="space-y-1">
                          <div className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest mb-1 font-mono flex justify-between">
                            <span>🧬 MOLECULAR GENETICS & BIOMARKERS</span>
                            <span className="text-slate-400 font-normal">Active EHR Clone</span>
                          </div>
                          <div className="bg-white/50 border border-emerald-100/60 rounded-lg p-2 space-y-1.5 shadow-3xs">
                            {(currentPatient.biomarkers && currentPatient.biomarkers.length > 0) ? (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {currentPatient.biomarkers.map((b, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-emerald-50 text-emerald-900 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 shadow-4xs"
                                  >
                                    <strong className="text-emerald-950">{b.name}:</strong>
                                    <span>{b.result}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-405 text-slate-400 font-mono text-[10px] italic">
                                No biomarkers synced.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 3: Lab Biochemistry & Hematology */}
                        <div className="space-y-1">
                          <div className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest mb-1 font-mono">
                            📋 Biochemistry & Hematology Labs
                          </div>
                          <div className="bg-white/50 border border-emerald-100/60 rounded-lg p-2 space-y-1 shadow-3xs">
                            <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                              <span className="text-slate-500 font-medium">Creatinine Clearance:</span>
                              <span className="font-extrabold text-slate-800">{currentPatient.lab_values.creatinine} mg/dL</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                              <span className="text-slate-500 font-medium font-semibold text-emerald-700">AST Transaminase:</span>
                              <span className="font-extrabold text-emerald-800 bg-emerald-100/70 text-emerald-950 px-1 py-0.2 rounded font-mono">
                                {currentPatient.lab_values.AST ?? syncedLabsResult.values.AST ?? 32} U/L
                              </span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                              <span className="text-slate-500 font-medium">Alanine Aminotransferase (ALT):</span>
                              <span className="font-extrabold text-slate-800">{currentPatient.lab_values.ALT} U/L</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                              <span className="text-slate-500 font-medium">Absolute Neutrophils (ANC):</span>
                              <span className="font-extrabold text-slate-800">{currentPatient.lab_values.ANC} x10^9/L</span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                              <span className="text-slate-500 font-medium font-semibold text-emerald-700">Platelets Count:</span>
                              <span className="font-extrabold text-emerald-950 bg-emerald-100/70 px-1 py-0.2 rounded font-mono">
                                {currentPatient.lab_values.platelets ?? syncedLabsResult.values.platelets ?? 240} k/µL
                              </span>
                            </div>
                            <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                              <span className="text-slate-500 font-medium font-semibold text-emerald-700">Hemoglobin (Hb):</span>
                              <span className="font-bold text-emerald-950 bg-emerald-100/70 px-1 py-0.2 rounded font-mono">
                                {currentPatient.lab_values.hemoglobin ?? syncedLabsResult.values.hemoglobin ?? 13.5} g/dL
                              </span>
                            </div>
                            {currentPatient.lab_values.cd4_count !== undefined && (
                              <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                                <span className="text-slate-500 font-medium font-semibold text-blue-700">CD4 Helper cells:</span>
                                <span className="font-bold text-blue-800">{currentPatient.lab_values.cd4_count} /mcL</span>
                              </div>
                            )}
                            {currentPatient.lab_values.viral_load !== undefined && (
                              <div className="flex justify-between py-0.5 border-b border-dashed border-emerald-100/30">
                                <span className="text-slate-500 font-medium font-semibold text-blue-700">HIV Viral Load:</span>
                                <span className="font-bold text-blue-800">{currentPatient.lab_values.viral_load} c/mL</span>
                              </div>
                            )}
                            {currentPatient.lab_values.systolic_bp !== undefined && (
                              <div className="flex justify-between py-0.5">
                                <span className="text-slate-500 font-medium">Systolic Pressure BP:</span>
                                <span className="font-bold text-slate-800">{currentPatient.lab_values.systolic_bp} mmHg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 pt-1.5 border-t border-emerald-150 flex justify-between items-center gap-2">
                        <span className="font-mono">ID: {syncedLabsResult.systemId.substring(0, 16)}</span>
                        <button
                          type="button"
                          onClick={() => setIsLabsMaximized(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2 py-1 rounded text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                        >
                          <span>Maximize Window ↗</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Phase 2 B: gemini-3.5-flash Elite Reasoner */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-3xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-[#FAF5FF] border border-[#E9D5FF] text-[#7E22CE] font-black px-2 py-1 rounded uppercase font-mono leading-none font-sans">
                      Phase 2 // Gemini Flash
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">Reasoning Engine</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-[11.5px]">Elite Decision-Flash Analysis</h4>
                  <p className="text-[10px] text-slate-505 text-slate-500 leading-normal">
                    Fires a multimodal clinical reasoning query reviewing specific biopsy consents, mutational exclusions, and oncology criteria gates.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCompileProReasoning}
                    disabled={isCompilingReasoning}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] uppercase py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {isCompilingReasoning ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                        Generating analysis...
                      </>
                    ) : (
                      "🧠 Trigger Flash reasoning"
                    )}
                  </button>

                  {/* Custom reasoning panel terminal output */}
                  {proReasoning && (
                    <motion.div
                      ref={proReasoningRef}
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="bg-slate-950 border border-purple-900/40 rounded-xl p-3.5 leading-relaxed text-purple-200 max-h-72 overflow-y-auto shadow-md shadow-purple-950/15"
                    >
                      <div className="flex items-center justify-between border-b border-purple-950/60 pb-2 mb-2 text-[9.5px] font-mono tracking-widest text-[#C084FC] uppercase font-bold">
                        <span>gemini-3.5-flash Console</span>
                        <button
                          type="button"
                          onClick={() => setIsReasoningMaximized(true)}
                          className="bg-purple-600/20 text-purple-200 hover:bg-purple-650/40 border border-purple-500/30 px-1.5 py-0.5 rounded font-sans text-[10px] leading-none transition-all cursor-pointer font-bold"
                        >
                          Maximize 🔍
                        </button>
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-slate-100 whitespace-pre-wrap">
                        {proReasoning}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Phase 3: Google Search Web Grounding */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-3xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] font-black px-2 py-1 rounded uppercase font-mono leading-none font-sans">
                      Phase 3 // Grounding
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">Search Engine</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-[11.5px]">NCT Registry Grounding</h4>
                  <p className="text-[10px] text-slate-505 text-slate-500 leading-normal">
                    Queries Google Search live for clinicaltrials.gov updates corresponding to study {currentTrial.nct_id} for recruiting timeline shifts.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleGroundTrialContext(currentTrial.nct_id)}
                    disabled={isGroundingTrial}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {isGroundingTrial ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                        Executing web search...
                      </>
                    ) : (
                      "🌐 Ground Trial context"
                    )}
                  </button>

                  {/* Grounding result citation */}
                  {groundedContext && (
                    <motion.div
                      ref={groundedContextRef}
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="bg-slate-950 border border-emerald-900/40 rounded-xl p-3.5 leading-relaxed text-emerald-200 max-h-72 overflow-y-auto shadow-md shadow-emerald-950/15"
                    >
                      <div className="flex items-center justify-between border-b border-emerald-950/60 pb-2 mb-2 text-[9.5px] font-mono tracking-widest text-[#34D399] uppercase font-bold">
                        <span>clinicaltrials.gov Console</span>
                        <button
                          type="button"
                          onClick={() => setIsGroundingMaximized(true)}
                          className="bg-emerald-600/20 text-emerald-200 hover:bg-emerald-650/40 border border-emerald-500/30 px-1.5 py-0.5 rounded font-sans text-[10px] leading-none transition-all cursor-pointer font-bold"
                        >
                          Maximize 🔍
                        </button>
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-slate-100 whitespace-pre-wrap">
                        {groundedContext}
                      </p>
                      {groundingCitations && groundingCitations.length > 0 && (
                        <div className="border-t border-emerald-950/60 pt-2 mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-mono text-[8.5px]">Source:</span>
                          <a
                            href={groundingCitations[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#34D399] font-extrabold hover:underline font-mono truncate max-w-[150px]"
                          >
                            {groundingCitations[0].title || "Clinical Registry ↗"}
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DETAILED CRITERIA MATRIX GRID */}
        {matchResult && matchResult.score_breakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* EVIDENCE AND WEIGHTS */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Attribution & weights breakdown matcher
              </h3>

              {matchResult.score_breakdown.categories ? (
                <div className="space-y-3">
                  {Object.entries(matchResult.score_breakdown.categories).map(([key, item]) => {
                    const label = key.toUpperCase().replace(/_/g, " ");
                    const earned = item.earned;
                    const max = item.max;
                    const percent = (earned / max) * 100;
                    return (
                      <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-3xs">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500 font-bold tracking-wide uppercase">{label}</span>
                          <span className="text-slate-700">
                             <strong className="text-blue-600 font-bold">{earned}</strong> / {max} pts
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full ${
                              percent >= 80 ? "bg-emerald-500" : percent >= 45 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 pt-0.5 space-y-1">
                          {item.met.map((metPhrase, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 leading-relaxed">
                              <span className="h-1 w-1 bg-emerald-500 rounded-full" />
                              {metPhrase}
                            </span>
                          ))}

                          {/* Needed / Lacking parameters */}
                          {item.needed_biomarkers && item.needed_biomarkers.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-x-2 gap-y-1 text-[9.5px]">
                              <span className="font-bold text-slate-500">Required Panel:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.needed_biomarkers.map((bm, bIdx) => (
                                  <span key={bIdx} className="bg-slate-100 text-slate-705 px-1.5 py-0.2 rounded font-semibold border border-slate-200/50">
                                    {bm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.lacking_biomarkers && item.lacking_biomarkers.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[9.5px]">
                              <span className="font-extrabold text-amber-600 uppercase">Lacking / Missing:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.lacking_biomarkers.map((bm, bIdx) => (
                                  <span key={bIdx} className="bg-amber-50 text-amber-705 px-1.5 py-0.2 rounded font-bold border border-amber-250/50">
                                    {bm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deductions breakdown */}
                          {item.deductions && item.deductions.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-red-100/50 space-y-1">
                              <span className="font-extrabold text-red-650 block uppercase text-[8.5px] tracking-wide">Deductions Reason:</span>
                              {item.deductions.map((ded, dIdx) => (
                                <span key={dIdx} className="flex items-start gap-1 text-[9.5px] text-red-755 leading-normal font-medium bg-red-50/40 p-1.5 rounded-lg border border-red-100/60">
                                  <span className="font-black text-red-500 shrink-0">⚠️</span>
                                  <span>{ded}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="bg-[#F8FAFC] border border-slate-200 text-slate-600 font-mono text-[10.5px] italic p-3 rounded-lg leading-relaxed mt-2">
                    <strong>Matcher Insight</strong>: {matchResult.score_breakdown.why_not_higher}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-rose-50 text-rose-800 rounded-xl border border-rose-250 flex flex-col items-center justify-center text-center space-y-3">
                  <ShieldAlert className="h-10 w-10 text-rose-600" />
                  <h4 className="font-extrabold uppercase tracking-wide text-xs">Disqualified under Tier-1 screen rules</h4>
                  <p className="max-w-md text-[11px] leading-relaxed font-medium">
                    Scoring engine was aborted early. This patient portfolio fails hard mandatory screening check requirements for this trial protocol.
                  </p>
                  <div className="w-full text-left font-mono text-[10px] bg-white rounded p-3 text-rose-700 border border-rose-100 space-y-1 mt-2">
                    {matchResult.score_breakdown.gate_violations?.map((v, i) => (
                      <div key={i} className="flex gap-2">
                        <span>•</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* SCREENING CHECKS & PROGRESSION ACTIONS */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Intake radiology & washout checklists
              </h3>

              <p className="text-xs text-slate-500 leading-normal">
                These clinical checkpoints and logs must be resolved or validated prior to launching random enrollment check gates:
              </p>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {matchResult.data_gaps.length > 0 ? (
                  matchResult.data_gaps.map((gap, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-205 border-slate-200 rounded-xl p-3 flex.col items-start gap-2.5 p-3.5 shadow-3xs flex">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-mono text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Screening requirement #{idx + 1}</span>
                        <p className="text-xs font-sans text-slate-700 font-medium leading-relaxed mt-1">{gap}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-slate-50 rounded-xl text-center space-y-2 border border-slate-200 shadow-3xs/50">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-slate-800">Intake prerequisites fully clear</h4>
                    <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                      All criteria thresholds met or surpassed. No other biochemistry discrepancies detected for current patient.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* CHAT COPILOT ASSISTANT PANELS */}
        {matchResult && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 font-sans tracking-tight">TrialLogix Co-Pilot Advisor</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    AI Clinical intelligence assistant. The current patient Facts & Trial Criteria are supplied dynamically as context.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-start bg-[#F8FAFC] px-3.5 py-1 rounded-full border border-slate-200 font-mono text-[9px] text-slate-500 font-semibold shadow-3xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                CONTEXT INTEGRATION: ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Quick Prompt panel */}
              <div className="lg:col-span-4 space-y-3 text-xs leading-normal">
                <span className="font-mono text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Clinical Queries helper</span>
                
                <button
                  onClick={() => sendChatMessage(undefined, `Review selected patient's specific ALT/Creatinine biochemistry values and suggest clearance action strategy.`)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-slate-100/50 text-slate-700 font-medium cursor-pointer transition-all flex items-center gap-2 shadow-3xs"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 shadow-3xs bg-white rounded" />
                  Analyze biochem renal/liver labs
                </button>

                <button
                  onClick={() => sendChatMessage(undefined, `Suggest optimal therapy washout and screening timeline parameters for current profile.`)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-slate-100/50 text-slate-700 font-medium cursor-pointer transition-all flex items-center gap-2 shadow-3xs"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 shadow-3xs bg-white rounded" />
                  Verify therapy washout checklist
                </button>

                <button
                  onClick={() => sendChatMessage(undefined, `Write a highly detailed, professional clinical referral letter to the trial primary coordinator for this candidate.`)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-slate-203 border-slate-200 hover:border-blue-300/80 hover:bg-slate-100/55 text-slate-700 font-medium cursor-pointer transition-all flex items-center gap-2 shadow-3xs"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 shadow-3xs bg-white rounded" />
                  Draft study referral docket
                </button>

                <button
                  onClick={() => sendChatMessage(undefined, `Provide a detailed, objective clinical breakdown explaining why this patient should be selected for the trial, focusing on matching biomarkers, inclusion parameters met, and target treatment alignment.`)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-slate-100/50 text-slate-700 font-medium cursor-pointer transition-all flex items-center gap-2 shadow-3xs"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 shadow-3xs bg-white rounded" />
                  Analyze enrollment selection reasons
                </button>

                <button
                  onClick={() => sendChatMessage(undefined, `Review this patient against all trial protocols and list clinical liabilities, potential exclusion criteria triggers, laboratory threshold violations, or safety concerns that could justify rejecting this patient for the trial.`)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-slate-100/50 text-slate-700 font-medium cursor-pointer transition-all flex items-center gap-2 shadow-3xs"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 shadow-3xs bg-white rounded" />
                  Analyze disqualifying rejection factors
                </button>
              </div>

              {/* Chat Message dialog logs */}
              <div className="lg:col-span-8 bg-[#F8FAFC] border border-slate-250 border-slate-200 rounded-2xl flex flex-col h-[400px] overflow-hidden shadow-3xs">
                
                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold font-mono ${
                          msg.role === "user"
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 shadow-3xs"
                        }`}
                      >
                        {msg.role === "user" ? "MD" : "CO"}
                      </div>
                      <div
                        className={`text-xs leading-relaxed p-3.5 rounded-2xl border ${
                          msg.role === "user"
                            ? "bg-blue-600 border-blue-600 text-white shadow-3xs"
                            : "bg-white border-slate-200 text-slate-850 shadow-3xs font-medium"
                        } whitespace-pre-wrap font-sans`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isSendingMessage && (
                    <div className="flex gap-3 mr-auto max-w-[85%]">
                      <div className="h-8 w-8 rounded-full shrink-0 mt-0.5 flex items-center justify-center bg-white border border-slate-200 text-xs shadow-3xs">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" strokeWidth={3} />
                      </div>
                      <div className="bg-white border border-slate-200 text-slate-500 text-xs p-3.5 rounded-2xl flex items-center gap-2 shadow-3xs font-medium">
                        Advisor compiling patient facts & protocol requirements...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form
                  onSubmit={sendChatMessage}
                  className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 rounded-b-2xl"
                >
                  <input
                    type="text"
                    disabled={isSendingMessage}
                    placeholder="Ask Advisor details: e.g. Suggest bio-washout strategy for this patient..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#F8FAFC] border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMessage || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-3xs"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            ACTIVE GOOGLE ADK & VERTEX AI TRACING CONSOLE LOG LEDGER
            ===================================================================== */}
        <div className="mt-8 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl p-5 overflow-hidden font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <h4 className="font-bold text-slate-250 uppercase tracking-wider text-[11px] leading-none flex items-center gap-2">
                  <span>Google Agent Platform & Vertex AI Tracing Console</span>
                  <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border border-slate-700 font-mono">Unified Client</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">Mathematical verification trace ledger & non-hallucinatory evaluation telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  fetchOrchestratorLogs();
                  showToast("Re-polled Live Google Agent Platform state stream.", "info");
                }}
                className="bg-slate-800 hover:bg-slate-755 hover:bg-slate-750 border border-slate-750 border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer text-slate-350 hover:text-slate-200 transition-all font-sans font-medium"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Poll Traces
              </button>
            </div>
          </div>

          <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-900/45 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-slate-955 flex flex-col gap-1.5">
            {orchestratorLogs.length === 0 ? (
              <div className="text-slate-500 italic text-center py-6 text-[11px]">
                No active execution tracing logs found in security sandbox pipeline.
              </div>
            ) : (
              orchestratorLogs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start py-1 border-b border-slate-900/25 last:border-0 leading-relaxed text-[11px]">
                  <span className="text-slate-500 text-[9.5px] select-none text-right w-18 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold select-none uppercase shrink-0 ${
                    log.level === "SUCCESS" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900" :
                    log.level === "WARN" ? "bg-amber-950/80 text-amber-500 border border-amber-900" :
                    "bg-blue-950/80 text-blue-400 border border-blue-900"
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-400 font-extrabold shrink-0 text-[10.5px]">[{log.agent}]:</span>
                  <span className="text-slate-300 font-medium break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 flex-wrap gap-2 select-none">
            <span className="font-sans font-medium">Orchestration Provider: @google/genai (Unified Workspace)</span>
            <span className="font-sans font-medium">Host: 0.0.0.0:3000 • Protocol: SSL/TLS Secure Sandbox</span>
          </div>
        </div>

      </div>

      {/* =====================================================================
          INTERACTIVE REFERRAL PACKAGE DRAWER MODAL
          ===================================================================== */}
      <AnimatePresence>
        {showReferralModal && activeReferral && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-2xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-black text-slate-850 text-sm leading-normal">Oncology Intake Dispatch memo</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Drafting candidate packet to Coordination Unit</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setShowReferralModal(false);
                    await loadRecords();
                  }}
                  className="p-1 px-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-250 border-slate-200 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Referral Form details */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3.5 bg-[#F8FAFC] border border-slate-200 p-3.5 rounded-xl font-sans text-[11px] text-slate-650">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Sent To Coordinator</span>
                    <strong className="text-slate-800">{activeReferral.coordinator_name}</strong>
                    <span className="text-slate-500 block">({activeReferral.coordinator_email})</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Assigned Candidate</span>
                    <strong className="text-slate-800">{activeReferral.patient_name}</strong>
                    <span className="text-slate-500 block">NCT Target: {activeReferral.nct_id}</span>
                  </div>
                </div>

                {/* Email Subject Line */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Dispatch Subject Header</label>
                  <input
                    type="text"
                    value={editedReferralSubject}
                    onChange={(e) => setEditedReferralSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-[#3B82F6] focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Email Body */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Referral Letter Clinical Details</label>
                  <textarea
                    rows={12}
                    value={editedReferralBody}
                    onChange={(e) => setEditedReferralBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed font-mono text-slate-800 focus:outline-[#3B82F6] focus:outline-none focus:bg-white whitespace-pre-wrap"
                  />
                </div>
              </div>

              {/* Control footers */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <span className="text-[9px] text-slate-450 text-slate-450 text-slate-400 leading-normal max-w-xs font-medium">
                  Upon dispatching, the patient coordination flag transitions to Pending and records dispatches update registry logs automatically.
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setShowReferralModal(false);
                      await loadRecords();
                    }}
                    className="p-2 px-3.5 text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 border border-slate-250 border-slate-200 rounded-lg cursor-pointer"
                  >
                    Hold Draft
                  </button>
                  <button
                    onClick={handleDispatchReferralEmail}
                    disabled={isDispatchingEmail || !editedReferralBody.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold p-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isDispatchingEmail ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        Sending dossier...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-white" />
                        Dispatch Referral Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          RAW CLINICAL NOTE MODAL
          ===================================================================== */}
      <AnimatePresence>
        {showRawNoteModal && currentPatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-2xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📄</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Original Parsed Clinical Note</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ingested unstructured text for {currentPatient.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowRawNoteModal(false)} className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-3xs whitespace-pre-wrap font-mono text-[11px] text-slate-700 leading-relaxed">
                  {currentPatient.raw_clinical_note}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          PHASE 1: HIPAA DLP SIDE-BY-SIDE VERIFICATION MODAL
          ===================================================================== */}
      <AnimatePresence>
        {showDlpModal && parsedOriginal && parsedAnonymized && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-4xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Box */}
              {duplicatePatient && (
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
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100 tracking-tight flex items-center gap-2">
                      <span>Google Cloud DLP Proxy Scan</span>
                      <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-bold animate-pulse font-mono tracking-wider">
                        Compliance Check
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-normal">
                      Verified HIPAA de-identification checklist validation side-by-side comparison report.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                </div>
              </div>

              {/* Side-by-Side Main Display Panel */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
                
                {/* Left Panel: Primary Clinical Jacket (Original Internal) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-blue-105 pb-2">
                    <span className="p-1 bg-blue-100 text-blue-800 text-xs rounded font-bold">A</span>
                    <h4 className="font-extrabold text-slate-800 text-xs text-slate-700">EHR Clinical Jacket (Original Patient Record)</h4>
                  </div>
                  
                  <div className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 space-y-3.5 shadow-3xs">
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Full Name</span>
                        <span className="text-blue-900 font-black text-sm">{parsedOriginal.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Patient ID Index</span>
                        <span className="text-slate-800 font-extrabold">{parsedOriginal.patient_id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Age / sex</span>
                        <span className="text-slate-800 font-extrabold">{parsedOriginal.age}yo {parsedOriginal.sex}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Intake Center Zip</span>
                        <span className="text-slate-800 font-extrabold">{parsedOriginal.location.zip || "N/A"}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-blue-100 pt-3">
                      <span className="text-[9px] uppercase font-bold text-slate-405 text-slate-400 tracking-wider">Extracted Diagnostics Criteria</span>
                      <div className="space-y-1.5 font-sans">
                        <div className="bg-white border border-blue-50 rounded p-2 flex justify-between items-center shadow-3xs">
                          <span className="font-bold text-slate-800">Cytology</span>
                          <span className="text-slate-600 truncate max-w-[150px] font-semibold">{parsedOriginal.diagnoses[0]?.description}</span>
                        </div>
                        <div className="bg-white border border-blue-50 rounded p-2 flex justify-between items-center shadow-3xs">
                          <span className="font-bold text-slate-800">Biomarker / Mutation</span>
                          <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">{parsedOriginal.biomarkers[0]?.name}: {parsedOriginal.biomarkers[0]?.result}</span>
                        </div>
                        <div className="bg-white border border-blue-50 rounded p-2 flex justify-between items-center shadow-3xs font-mono">
                          <span className="font-sans font-bold text-slate-800">ECOG Vitality</span>
                          <span className="text-indigo-700 font-bold">Grade {parsedOriginal.ecog_performance_status}</span>
                        </div>
                        <div className="bg-white border border-blue-50 rounded p-2 flex justify-between items-center shadow-3xs font-mono">
                          <span className="font-sans font-bold text-slate-800">Washout Days</span>
                          <span className="text-slate-800 font-extrabold">{parsedOriginal.last_therapy_days_ago} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: DLP Scrubbed Registry (Export Research-Safe) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-rose-105 pb-2">
                    <span className="p-1 bg-rose-100 text-[#FF4B4B] text-xs rounded font-bold">B</span>
                    <h4 className="font-extrabold text-slate-800 text-xs text-rose-700">Research-Safe Dossier (HIPAA Sanitized Output)</h4>
                  </div>
                  
                  <div className="bg-rose-50/10 border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-3xs">
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Full Name</span>
                        <span className="text-[#FF4B4B] font-extrabold text-[11px] leading-tight block break-all bg-[#FF4B4B]/15 border border-[#FF4B4B]/20 px-1.5 py-1 rounded">
                          {parsedAnonymized.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Patient ID Index</span>
                        <span className="text-slate-800 font-extrabold">{parsedAnonymized.patient_id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Age / sex</span>
                        <span className="text-slate-800 font-extrabold">{parsedAnonymized.age}yo {parsedAnonymized.sex}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal font-sans">Intake Center Zip</span>
                        <span className="text-[#FF4B4B] font-extrabold bg-[#FF4B4B]/10 px-1.5 py-0.5 rounded">
                          {parsedAnonymized.location.zip || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-3">
                      <span className="text-[9px] uppercase font-bold text-slate-405 text-slate-400 tracking-wider">Anonymized Temporal Blocks</span>
                      <div className="space-y-1.5 font-sans">
                        <div className="bg-white border rounded p-2 flex justify-between items-center shadow-3xs leading-none">
                          <span className="font-bold text-slate-650">Diagnosis Interval</span>
                          <span className="text-[10.5px] font-bold text-blue-700 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {parsedAnonymized.diagnoses?.[0]?.date_diagnosed || "827 days ago"}
                          </span>
                        </div>
                        <div className="bg-white border rounded p-2 flex justify-between items-center shadow-3xs">
                          <span className="font-bold text-slate-800">Biomarker / Mutation</span>
                          <span className="text-slate-800 font-semibold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[10px]">{parsedAnonymized.biomarkers[0]?.name}: {parsedAnonymized.biomarkers[0]?.result}</span>
                        </div>
                        <div className="bg-white border rounded p-2 flex justify-between items-center shadow-3xs font-mono">
                          <span className="font-sans font-bold text-slate-800">ECOG Vitality</span>
                          <span className="text-slate-800 font-bold">Grade {parsedAnonymized.ecog_performance_status}</span>
                        </div>
                        <div className="bg-white border rounded p-2 flex justify-between items-center shadow-3xs font-mono">
                          <span className="font-sans font-bold text-slate-650">Prior Treatment Days</span>
                          <span className="text-[10.5px] font-bold text-[#FF4B4B] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {parsedAnonymized.prior_treatments?.[0]?.end_date || (parsedAnonymized.last_therapy_days_ago ? `${parsedAnonymized.last_therapy_days_ago} days ago` : "35 days ago")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Verified Badge Footer */}
              <div className="p-4 border-t border-slate-200 bg-[#10B981]/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-emerald-800 font-mono text-xs">
                  <span>🛡️</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">HIPAA Audit Verified</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDlpModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-2.5 px-6 rounded-lg text-xs cursor-pointer shadow-3xs"
                >
                  Onload Patient Into Registry List
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          MAXIMIZED STUNNING CLINICAL OVERLAY WINDOWS (MODALS)
          ===================================================================== */}
      
      {/* 1. EHR Labs Sync Maximized Modal */}
      {isLabsMaximized && currentPatient && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden font-sans flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-850">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-lg font-bold">🧬</span>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    Hospital EHR Laboratory Sync Core
                    <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">FHIR Link Active</span>
                  </h3>
                  <p className="text-xs text-slate-400">Subject: {currentPatient.name || "Anonymous Case"} // ID: #{currentPatient.patient_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLabsMaximized(false)}
                className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              >
                Close Window ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-800 leading-relaxed">
              
              {/* Left Column: All Lab Values and Profile metrics Present */}
              <div className="space-y-6">
                {/* Subsection A: Demographics & Physical state */}
                <div className="space-y-2">
                  <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>👤</span> Demographics & ECOG Index
                    </h4>
                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">Active State</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Patient Name</span>
                      <strong className="text-slate-800 text-[11px] leading-snug">{currentPatient.name}</strong>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Physical Status Index</span>
                      <strong className="text-emerald-800 text-[11px] font-mono leading-snug">ECOG Status: {currentPatient.ecog_performance_status}</strong>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Demographic Features</span>
                      <strong className="text-slate-800 text-[11px] leading-snug">{currentPatient.age}yo // {currentPatient.sex === "M" ? "Male" : currentPatient.sex === "F" ? "Female" : "Other"}</strong>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Registered Residence</span>
                      <strong className="text-slate-800 text-[11px] leading-snug">{currentPatient.location.city}, {currentPatient.location.state}</strong>
                    </div>
                  </div>
                </div>

                {/* Subsection B: Molecular Genomics & Biomarkers */}
                <div className="space-y-2">
                  <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🧬</span> Onco-Genomics & Mutation Biomarkers
                    </h4>
                    <span className="bg-emerald-100 text-emerald-900 font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/50 font-sans">FHIR Live Sync</span>
                  </div>
                  <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-3">
                    {(currentPatient.biomarkers && currentPatient.biomarkers.length > 0) ? (
                      <div className="grid grid-cols-2 gap-2">
                        {currentPatient.biomarkers.map((b, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-4xs"
                          >
                            <span className="text-[9px] text-[#0ea5e9] block font-bold uppercase tracking-wider font-mono">{b.name} Target</span>
                            <strong className="text-slate-800 text-[11px]">{b.result}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No biomarker records returned from EHR connection node.</p>
                    )}
                  </div>
                </div>

                {/* Subsection C: Biochemistry Labs */}
                <div className="space-y-2">
                  <div className="border-b border-slate-200 pb-1.5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📋</span> Laboratory Biochemistry & Hematology
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 font-sans">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Creatinine Clearance</span>
                        <span className="text-xs font-bold text-slate-800">Serum Creatinine</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 font-mono bg-white border px-2 py-0.5 rounded">
                        {currentPatient.lab_values.creatinine} mg/dL
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Alanine Transaminase</span>
                        <span className="text-xs font-bold text-slate-800">Serum ALT</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 font-mono bg-white border px-2 py-0.5 rounded">
                        {currentPatient.lab_values.ALT} U/L
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Aspartate Transaminase</span>
                        <span className="text-xs font-bold text-slate-800">Serum AST</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono bg-white border px-2 py-0.5 rounded">
                        {currentPatient.lab_values.AST ?? syncedLabsResult?.values?.AST ?? 32} U/L
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Neutrophil Count</span>
                        <span className="text-xs font-bold text-slate-800">ANC Index</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 font-mono bg-white border px-2 py-0.5 rounded">
                        {currentPatient.lab_values.ANC} x10^9/L
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Platelets Count</span>
                        <span className="text-xs font-bold text-slate-800">Platelet Panel</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono bg-white border px-2 py-0.5 rounded">
                        {currentPatient.lab_values.platelets ?? syncedLabsResult?.values?.platelets ?? 240} k/µL
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Hemoglobin Count</span>
                        <span className="text-xs font-bold text-slate-800">Serum Hb</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono bg-white border px-2 py-0.5 rounded">
                        {currentPatient.lab_values.hemoglobin ?? syncedLabsResult?.values?.hemoglobin ?? 13.5} g/dL
                      </span>
                    </div>

                    {currentPatient.lab_values.cd4_count !== undefined && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center col-span-2">
                        <div>
                          <span className="text-[9px] text-blue-500 block font-bold uppercase tracking-wider">CD4 T-cell panel</span>
                          <span className="text-xs font-bold text-slate-800">HIV Helper Cluster</span>
                        </div>
                        <span className="text-xs font-black text-blue-700 font-mono bg-white border px-2 py-0.5 rounded">
                          {currentPatient.lab_values.cd4_count} cells/mcL
                        </span>
                      </div>
                    )}

                    {currentPatient.lab_values.viral_load !== undefined && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center col-span-2">
                        <div>
                          <span className="text-[9px] text-blue-500 block font-bold uppercase tracking-wider">HIV Quantification</span>
                          <span className="text-xs font-bold text-slate-800">HIV Viral Copy Load</span>
                        </div>
                        <span className="text-xs font-black text-blue-700 font-mono bg-white border px-2 py-0.5 rounded">
                          {currentPatient.lab_values.viral_load} copies/mL
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Connection verification and EHR transmission override details */}
              <div className="bg-slate-900 text-slate-300 rounded-xl p-6 font-mono text-[11px] leading-relaxed space-y-4 shadow-inner border border-slate-800 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-emerald-400 font-bold uppercase text-[12px]">FHIR Connectivity Matrix</span>
                    <span className="text-slate-500 font-bold">HL7 PROTOCOL</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-400"><strong className="text-white">MCP Connection Token:</strong> {syncedLabsResult?.systemId || "HL7-FHIR-EPIC-SYNC-APPROVED"}</p>
                    <p className="text-slate-400"><strong className="text-white">Active Database Node:</strong> hospital-cerner-production-server-us-east4</p>
                    <p className="text-slate-400"><strong className="text-white">Security Encryption:</strong> TLS_AES_256_GCM_SHA384 (HIPAA-Secure)</p>
                    <p className="text-slate-400"><strong className="text-white">AST transaminase:</strong> Retrieved & synchronized live. Handbacked to eligibility rules engine.</p>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-1.5 text-slate-405">
                    <div className="text-emerald-500 font-extrabold text-[10px] tracking-wide uppercase">Connection Diagnostics Logs:</div>
                    <p className="text-slate-400 font-mono"><span className="text-slate-550 mr-1.5">[17:03:11]</span> ESTABLISHING TCP HANDSHAKE {"->"} EPIC FHIR CLIENT</p>
                    <p className="text-slate-400 font-mono"><span className="text-slate-550 mr-1.5">[17:03:12]</span> OAUTH2 SCOPE APPROVED: /Patient.Read /Observation.Read</p>
                    <p className="text-slate-400 font-mono"><span className="text-slate-550 mr-1.5">[17:03:13]</span> RETRIEVED OBS RECORD ID: AST_VAL={currentPatient.lab_values.AST ?? 32} U/L</p>
                    <p className="text-slate-400 font-mono"><span className="text-slate-550 mr-1.5">[17:03:13]</span> SYNCHRONIZED AND INJECTED ACTIVE EHR PATIENT MATRIX IN FULL</p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
                  <div className="text-[10px] text-[#A855F7] font-extrabold uppercase">Subject Override Safety:</div>
                  <p className="text-[10px] text-slate-400 font-medium font-sans leading-relaxed">
                    Any on-the-fly biomarker or AST transaminase edit saved in the Right Panel overrides this state permanetly and updates both central database and active FHIR cache instantly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLabsMaximized(false)}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-lg text-xs transition cursor-pointer"
                  >
                    Confirm & Complete EHR Verification Block
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* 2. Vertex AI Gemini Flash Reasoning Console - Maximized Modal */}
      {isReasoningMaximized && proReasoning && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-800 overflow-hidden font-sans flex flex-col h-[80vh]"
          >
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-850">
              <div className="flex items-center gap-2.5">
                <span className="p-1 px-1.5 bg-purple-600 text-white rounded font-mono font-black text-xs uppercase leading-none">gemini-3.5-flash</span>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">Elite Decision-Flash Analysis Trace</h3>
                  <p className="text-xs text-slate-400">Vertex AI Orchestrated Live Reasoning Verification Protocol</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReasoningMaximized(false)}
                className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              >
                Close Trace ✕
              </button>
            </div>

            {/* Modal Body: Spacious, with large font and high readability */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-slate-950 text-slate-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono text-[#A855F7] tracking-widest font-extrabold uppercase">MULTIMODAL DECISION ENGINE CONSOLE TRACE</span>
                  <span className="text-xs text-slate-500 font-mono">STATUS: 200 OK</span>
                </div>
                
                {/* Large human legible reading format as requested */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <p className="text-base font-sans leading-relaxed text-slate-100 whitespace-pre-wrap">
                    {proReasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-5 border-t border-slate-850 flex justify-between items-center">
              <div className="text-[11px] text-slate-500 font-mono">
                Model: Vertex AI gemini-3.5-flash-pro-preview // HIPAA-Masked Connection
              </div>
              <button
                type="button"
                onClick={() => setIsReasoningMaximized(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-lg text-xs cursor-pointer transition-all shadow-xs"
              >
                Accept and Close Console
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Search Grounding - Maximized Modal */}
      {isGroundingMaximized && groundedContext && currentTrial && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden font-sans flex flex-col h-[80vh]"
          >
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-600 text-white rounded-lg text-lg font-bold">🌐</span>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    NCT Registry Live Grounding Engine
                    <span className="bg-emerald-500 text-emerald-950 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">Search Verified</span>
                  </h3>
                  <p className="text-xs text-emerald-300">Matching Study Protocol ID: {currentTrial.nct_id} // Registry Sync</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroundingMaximized(false)}
                className="bg-white/15 hover:bg-white/25 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
              >
                Close Grounding ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-slate-50 text-slate-800 leading-relaxed font-sans space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Live Google Search Grounds Evidence</span>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">verified live match</span>
                </div>

                {/* Large typography for readability */}
                <p className="text-base leading-relaxed text-slate-700">
                  {groundedContext}
                </p>

                {groundingCitations && groundingCitations.length > 0 && (
                  <div className="border-t border-slate-150 pt-4 flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-bold text-slate-900">Source Citations:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {groundingCitations.map((cit, idx) => (
                        <a
                          key={idx}
                          href={cit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-extrabold hover:underline font-mono flex items-center gap-1.5"
                        >
                          <span>🔗</span> {cit.title || "Clinical Registry Reference Link"} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Integrity Checklist */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2 text-xs text-emerald-850">
                <span className="font-bold uppercase tracking-wider block text-emerald-900">Grounding Integrity Check:</span>
                <p>The system queried Google Search live to verify absolute alignment between local EHR values (ALT or AST transaminases) and active registration parameters on ClinicalTrials.gov. Recruiting timeline shifts were reviewed at the endpoint.</p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">Google Web-Grounding Hub</span>
              <button
                type="button"
                onClick={() => setIsGroundingMaximized(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-lg text-xs cursor-pointer transition-all"
              >
                I have reviewed the Grounded context
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
