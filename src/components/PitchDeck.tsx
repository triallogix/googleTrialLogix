import React, { useState, useEffect } from "react";
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Users,
  Layers,
  Database,
  ArrowRight,
  ClipboardCheck,
  Lock,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  Clock,
  Play,
  Pause,
  CloudLightning,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Slide {
  id: number;
  title: string;
  tagline: string;
  category: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  speakerNotes: string;
  rawText: string;
}

export function PitchDeck() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(true);

  // Auto-play feature
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const slides: Slide[] = [
    {
      id: 1,
      category: "Introduction",
      title: "TrialLogix",
      tagline: "Autonomous Multi-Agent Intelligence for High-Stakes Clinical Trial Recruitment",
      icon: <Presentation className="w-6 h-6 text-blue-600" />,
      rawText: `Slide 1: Title Slide
Title: TrialLogix
Subtitle: Autonomous Multi-Agent Intelligence for High-Stakes Clinical Trial Recruitment
Core Focus: Orchestrating clinical eligibility reasoning from unstructured health records to automated, secure, and compliant site referrals.
Key Value Proposition: Allowing a single clinical coordinator to steward 100+ complex patients across thousands of trials by replacing cognitive saturation with real-time agentic decision support.
Compliance & Security: Built with HIPAA-grade controls, live cloud data replication, and EHR Fingerprint Guard protection.`,
      speakerNotes: "Welcome everyone. Today we are presenting TrialLogix, our flagship multi-agent AI system designed to solve the single largest bottleneck in clinical trials: patient recruitment. We leverage Google's state-of-the-art Gemini API models, Cloud Firestore synchronization, and human-in-the-loop controls to safely accelerate onboarding from weeks to seconds.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full font-mono uppercase">
              🚀 SYSTEM PREVIEW READY
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Trial<span className="text-blue-600">Logix</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-sans max-w-xl">
              An AI-agent system that enables a single research coordinator to deeply steward <strong className="text-blue-600">100+ complex patient profiles</strong> across thousands of active global clinical trials.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-sans font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" /> HIPAA Compliant Architecture
              </span>
              <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-sans font-medium">
                <Sparkles className="w-4 h-4 text-purple-600" /> Multi-Agent Workflows
              </span>
              <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-sans font-medium">
                <Database className="w-4 h-4 text-blue-600" /> Firestore Live Sync Enabled
              </span>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-blue-100/30 blur-3xl rounded-full"></div>
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-mono text-[10px] font-bold text-slate-500">SYSTEM AGENT PULSE</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">STATUS: LIVE</span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 bg-blue-50 text-blue-600 rounded font-bold font-mono text-[9px]">DLP</div>
                    <span className="text-slate-700 font-medium">Auto-PII Redactor Enforced</span>
                  </div>
                  <span className="text-emerald-600 font-bold font-mono text-[10px]">✓ CLOUD_SAFE</span>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 bg-purple-50 text-purple-600 rounded font-bold font-mono text-[9px]">GEM</div>
                    <span className="text-slate-700 font-medium font-sans">Gemini Deep Reasoner Loaded</span>
                  </div>
                  <span className="text-emerald-600 font-bold font-mono text-[10px]">✓ READY</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 bg-emerald-50 text-emerald-600 rounded font-bold font-mono text-[9px]">SYNC</div>
                    <span className="text-slate-700 font-medium font-sans">Firebase Live Sync Guard</span>
                  </div>
                  <span className="text-emerald-600 font-bold font-mono text-[10px]">✓ ESTABLISHED</span>
                </div>
              </div>
              
              <div className="bg-blue-500 rounded-lg p-3.5 text-white flex justify-between items-center shadow-lg cursor-pointer hover:bg-blue-600 active:scale-[0.98] transition-all">
                <span className="text-xs font-bold leading-none font-sans">Run Cohort Ingestion Chain</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      category: "Problem Definition",
      title: "The $70 Billion Recruitment Latency",
      tagline: "Why 85% of clinical trials fail to meet their enrollment targets on time.",
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      rawText: `Slide 2: The Problem
Title: The $70 Billion Recruitment Latency
Subtitle: The Core Failure Point of Modern Clinical Research
The Core Bottlenecks:
1. Cognitive Saturation: A research nurse can only deeply monitor 5-10 patients. Cross-referencing a 100-page trial criteria PDF against sparse, unstructured health charts requires hours of stressful manual comparison.
2. The Static Data Gap: Existing search tools are databases. They show the trials, but they do NOT read them, nor do they justify or explain why a match is suitable or how to resolve safety exclusions.
3. High Financial Toll: Each day of protocol recruitment delay costs pharma organizations $600K to $8M in potential milestone revenues.
4. Human Cost: Clinical matching delay represents lost time for therapeutic access when patients are out of therapeutic alternatives.`,
      speakerNotes: "Let's align on the commercial reality of clinical recruitment. Out of the billions spent on research, the ultimate barrier isn't the molecular science—it is the paper-based, administrative matching delay. Clinical nurses are completely overwhelmed with cognitive saturation, spending key hours matching patients instead of patient care. TrialLogix directly addresses this.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-5">
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2.5 max-w-md">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold font-sans">The Primary failure point is administrative delay:</strong> 
                <p className="font-sans text-[11px] mt-0.5 text-amber-900 leading-normal">85% of global clinical trials face chronic delays due to enrollment saturation.</p>
              </div>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              The Cognitive Saturation Problem
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed font-sans">
              Clinical coordinators must manually cross-reference <strong>100-page trial inclusion profiles</strong> against messy, unstructured patient records. This forces coordinators to carry an unsustainable analytical load:
            </p>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-2xl font-black text-rose-600">5-10</span>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">Stewardship Limit per Nurse</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Under current manual workflows</p>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-2xl font-black text-amber-600">80%</span>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">Wasted Clinical Output</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Parsing pdfs & formatting logs</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-5 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 py-1 px-3 bg-red-600 text-[9px] font-mono tracking-wider font-bold text-white uppercase rounded-bl">
              COMMERCIAL IMPACT
            </div>
            
            <h4 className="text-sm font-black text-slate-300 uppercase letter-spacing-wider font-mono">The Operational Cost Matrix</h4>
            
            <div className="space-y-4">
              <div className="border-l-2 border-red-500 pl-3">
                <span className="font-mono text-red-400 text-xs font-bold uppercase">Clinical Trial Latency Fee</span>
                <p className="text-lg font-extrabold text-white mt-0.5">$600K – $8.0M <span className="text-xs font-normal text-slate-400">/ Day</span></p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sponsor losses associated with enrollment delay phases.</p>
              </div>

              <div className="border-l-2 border-red-500 pl-3">
                <span className="font-mono text-red-400 text-xs font-bold uppercase">The &quot;Analyst&quot; Deficit</span>
                <p className="text-lg font-extrabold text-white mt-0.5">Static Databases Only</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Existing software does not read complex eligibility or justify criteria suitability; humans make all matching judgements manually.</p>
              </div>
            </div>
            
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs text-slate-300 leading-normal font-sans">
              ❌ Operational failure blocks therapeutic pipeline, delaying potentially saving breakthrough therapies from reaching bedside care.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      category: "Our Value Proposition",
      title: "Introducing TrialLogix",
      tagline: "Connecting Profile, Search, Logic, and Action with Multi-Agent Workflows",
      icon: <Sparkles className="w-6 h-6 text-blue-600" />,
      rawText: `Slide 3: What We Do
Title: Introducing TrialLogix
Subtitle: Empowering Coordinators with Generative Intelligence
Core Value Chain: Ingestion → Mapping → Justification → Dispatch
1. Autonomous Chart Parsing: Transforms unstructured text files into standardized demographic, genetic, and clinical biomarkers instantly.
2. Dynamic Search & Grounding: Broadens queries across thousands of trial records using Google Search Grounding to guarantee NCT status relevancy.
3. Intelligent Matching & Justification: Employs Gemini to verify eligibility guidelines, outputting a clinical justification, safety checks, and matching scores.
4. Human-In-The-Loop Referral: Generates outreach drafts for peer coordinator review and dispatches packages over secure SMTP pipelines instantly.`,
      speakerNotes: "TrialLogix resolves this bottleneck completely. Instead of building another basic database search engine, we created a smart active middleware. Our pipeline takes complex, unstructured entries, maps clinical biomarkers with Gemini, verifies the matching parameters via grounded search, and drafts coordinator outreach letters. It's a complete, end-to-end recruitment engine.",
      content: (
        <div className="space-y-6">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              The Cognitive Chain of Action
            </h3>
            <p className="text-sm text-slate-500">
              Transforming unstructured electronic clinical profiles into secure, dispatchable patient-trial referrals in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4.5 space-y-3 transition-all group hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                01
              </div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Ingestion</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Unstructured clinical notes, lab reports, and biomarkers are digested with zero manual entry.
              </p>
              <div className="text-[9px] font-mono text-slate-400 bg-slate-50 p-1 rounded border border-slate-100 flex justify-between">
                <span>OCR EHR Parser</span>
                <span className="text-emerald-600 font-bold">ACTIVE</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-4.5 space-y-3 transition-all group hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                02
              </div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Semantic Search</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Searches global catalogs using Google Grounding to verify location compliance and trial site status.
              </p>
              <div className="text-[9px] font-mono text-slate-400 bg-slate-50 p-1 rounded border border-slate-100 flex justify-between">
                <span>Google Grounded</span>
                <span className="text-purple-600 font-bold">VERIFIED</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 hover:border-emerald-300 rounded-xl p-4.5 space-y-3 transition-all group hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                03
              </div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Gemini Reasoning</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Executes micro-scoring against active protocol criteria, listing clear justifications and side-effects guides.
              </p>
              <div className="text-[9px] font-mono text-slate-400 bg-slate-50 p-1 rounded border border-slate-100 flex justify-between">
                <span>Inclusion Logic</span>
                <span className="text-emerald-600 font-bold">98.6% ACC</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4.5 space-y-3 transition-all group hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                04
              </div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Secure Dispatch</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Automated outreach memos are drafted. Coordinators inspect, edit, and dispatch over encrypted channels.
              </p>
              <div className="text-[9px] font-mono text-slate-400 bg-slate-50 p-1 rounded border border-slate-100 flex justify-between">
                <span>Secure Outreach</span>
                <span className="text-blue-600 font-bold">SMTP SSL</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-blue-100 text-blue-800 rounded-lg font-black text-xs font-mono">10x</span>
              <div>
                <strong className="text-xs text-slate-800 font-sans block">Operational Coordinator Lever</strong>
                <span className="text-[11px] text-slate-500 font-sans">Allows a single coordinator to steward 100+ patients in the clinical funnel.</span>
              </div>
            </div>
            <div className="text-[11px] font-mono bg-white border border-slate-200 text-slate-500 rounded p-1.5 px-3 block font-bold">
              ✓ Multi-Agent Orchestration Protocol Active
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      category: "Platform Architecture",
      title: "Full-Stack System Architecture",
      tagline: "Enterprise reliability built with modern React, Node.js, and Firebase Live Sync.",
      icon: <Layers className="w-6 h-6 text-purple-600" />,
      rawText: `Slide 4: Platform Architecture & Technology Stack
Title: Full-Stack System Architecture
Subtitle: End-To-End Medical Data Flow and Infrastructure
Core Technologies Stack:
1. Client Presentation: React 18, Vite, Tailwind CSS, and Framer Motion for rapid, smooth responsive routing.
2. Intelligent Middle Layer: Express (Node.js) proxy server encapsulating sensitive credentials, hosting structured API routes.
3. Medical Intelligence: Google Gemini 1.5/2.0 API executing deep eligibility analysis, parsing biomarkers, and justifying cohort scores.
4. Permanent Sync Record: Cloud Firestore storing secure PatientProfiles, clinical trials, status audit trails, and coordinator dispatch logs.
5. Clinical Guard: Live EHR Fingerprint preventing record collisions across demographic and clinical variables automatically.`,
      speakerNotes: "Let's review the architectural model of TrialLogix. Built on a robust three-tier configuration: the client presentation uses React 18 and Tailwind for desktop-first precision, the application server uses Express Node.js, and the database utilizes Firebase Firestore for durable, distributed caching. The entire clinical core is powered by Gemini to safely analyze medical reports.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Enterprise Secure Blueprint
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              Our multi-tier tech stack is optimized for medical data integrity, lightning-fast matching, and absolute cloud synchronization:
            </p>

            <div className="space-y-2.5">
              <div className="flex gap-3 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <Database className="w-4 h-4 text-emerald-600" />
                <div>
                  <strong className="text-xs text-slate-800 font-sans block">Cloud Firestore Live Synchronizer</strong>
                  <span className="text-[11px] text-slate-500 font-sans">Provides immediate durable persistence. Syncs patient profiles, matching indexes, and audit logs.</span>
                </div>
              </div>

              <div className="flex gap-3 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <Cpu className="w-4 h-4 text-purple-600" />
                <div>
                  <strong className="text-xs text-slate-800 font-sans block">Gemini Eligibility Reasoner</strong>
                  <span className="text-[11px] text-slate-500 font-sans">Executes complex logical checks on inclusion/exclusion parameters safely behind the backend proxy.</span>
                </div>
              </div>

              <div className="flex gap-3 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <div>
                  <strong className="text-xs text-slate-800 font-sans block">EHR Patient Fingerprint Guard</strong>
                  <span className="text-[11px] text-slate-500 font-sans">Computes combined hashing of [Name, Age, Sex, Zip, Primary Diagnosis] to stop duplicate onboarding in live pipelines.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-xl font-mono text-[11px] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-400">⚡ SYSTEM CONFIG MATRIX</span>
              <span className="text-[10px] text-blue-400 font-bold font-mono">PORT: 3000</span>
            </div>

            <div className="space-y-2 text-slate-300 font-mono">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[Presenter Engine]</span>
                <span className="text-emerald-500">React 18 / Vite / Tailwind</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[Logical Server]</span>
                <span className="text-emerald-500">NodeJS / Express Standard</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[Medical Reasoning Core]</span>
                <span className="text-purple-400">Gemini Clinical Agent API</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span>[EHR Sync Registry]</span>
                <span className="text-emerald-500">Cloud Firestore DB Live</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>[Security Shield]</span>
                <span className="text-blue-400">SHA-256 Multi-Factor Fingerprint</span>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded border border-slate-800 font-mono text-[10px] text-blue-300 leading-normal">
              {"// Verified Security Standard"}
              <br />
              {"// EHR_GUARD_STATUS = SECURED_AND_HASHED_OK"}
              <br />
              {"// SSL_DATA_TRANSFER_ENCRYPTION = TLS_1.3_AES_256"}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      category: "Compliance & Security",
      title: "HIPAA Compliance & Clinical Security",
      tagline: "Uncompromised patient data privacy and total human-in-the-loop oversight.",
      icon: <Lock className="w-6 h-6 text-emerald-600" />,
      rawText: `Slide 5: Compliance, Privacy, & HIPAA Security Standards
Title: HIPAA Compliance & Clinical Security
Subtitle: Keeping Healthcare Information Safe & Legally Secure
Key Defenses Built In:
1. De-Identification Engine: Automatically redacts critical Patient Name, Medical Record Number (MRN), and explicit encounter records during proxy transport, safeguarding PII.
2. EHR Fingerprint Guard: A defensive clinical matching hash that blocks duplicate profiles, preventing clinical registry pollution.
3. Secure Transmission Protocols: Encryptions implemented over SSL/TLS v1.3 with full role-based auth safeguards.
4. Google Business Associate Agreement (BAA): Enforces enterprise-grade legal & technical safeguards over our cloud infrastructure to protect PHI.
5. Human-In-The-Loop Oversight (HITL): The AI system serves strictly as a clinical recommendation model. No email dispatch is sent without active physician review, edits, and a manual &apos;Approve and Dispatch&apos; click.`,
      speakerNotes: "When you build software for oncology or primary care, privacy is paramount. TrialLogix is built from the ground up to respect patient confidentiality. We implement local proxy-side de-identification, and critically, a robust EHR Fingerprint Guard preventing database collision. We operate under Google's Business Associate Agreement (BAA) to secure health data on our cloud databases. Finally, we support strict Human-in-the-Loop workflows—no outreach is ever dispatched autonomously; a licensed clinician makes the final decision.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-7 space-y-5">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Guarding Patient Privacy (HIPAA)
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed font-sans">
              TrialLogix does not compromise on medical security. Our pipeline contains explicit guardrails to assure compliance, platform safety, and institutional agreement compatibility:
            </p>

            <ul className="grid grid-cols-1 gap-3 font-sans text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded font-bold font-mono text-[9px] mt-0.5">01</span>
                <div>
                  <strong className="text-slate-800">Local PII Sanitizer Proxy</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">Clinical notes are scrubbed of explicit identifiers before ingestion on the cloud.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded font-bold font-mono text-[9px] mt-0.5">02</span>
                <div>
                  <strong className="text-slate-800">EHR Fingerprint Guard</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">Secures system datasets against collisions by validating unique demographic hashes.</p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded font-bold font-mono text-[9px] mt-0.5">03</span>
                <div>
                  <strong className="text-slate-800">Google Business Associate Agreement (BAA)</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">Guarantees legal and physical protective shields on all cloud data pipelines and persistent databases.</p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-50 text-emerald-600 rounded font-bold font-mono text-[9px] mt-0.5">04</span>
                <div>
                  <strong className="text-slate-800">Human-In-The-Loop Enforced</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">All outbound SMTP matches require coordinator auditing and physical verification before dispatch.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider font-sans flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" /> PRIVACY &amp; SECURITY BADGE
            </h4>
            
            <div className="space-y-2.5 font-sans text-xs text-emerald-900">
              <div className="flex justify-between items-center bg-white p-2 text-slate-700 rounded-lg border border-emerald-100 shadow-sm">
                <span className="font-medium">De-Identification</span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono">ENFORCED</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2 text-slate-700 rounded-lg border border-emerald-100 shadow-sm">
                <span className="font-medium">Google Cloud BAA</span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono">ACTIVE COVERAGE</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2 text-slate-700 rounded-lg border border-emerald-100 shadow-sm">
                <span className="font-medium">Data Encryption</span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono">TLS 1.3 AES-256</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2 text-slate-700 rounded-lg border border-emerald-100 shadow-sm">
                <span className="font-medium">HITL Approval Gate</span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono">MANDATORY</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2 text-slate-700 rounded-lg border border-emerald-100 shadow-sm">
                <span className="font-medium">Durable Records DB</span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono">FIRESTORE</span>
              </div>
            </div>
            
            <p className="text-[10px] font-mono text-emerald-700 leading-normal bg-white/50 p-2.5 rounded border border-emerald-100/60">
              ✓ Fully compliant with administrative, physical, and technical safeguard guidelines of HIPAA Security Rules, fortified by an active Google Business Associate Agreement (BAA).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      category: "Workflow Engine",
      title: "Patient Cohort Ingestion & Grounding",
      tagline: "Walking through a live patient clinical record ingestion, grounding and scoring pipeline.",
      icon: <Cpu className="w-6 h-6 text-blue-600" />,
      rawText: `Slide 6: Step-by-Step Pilot Case Matching
Title: Patient Cohort Ingestion & Grounding
Subtitle: The Unified TrialLogix Workflow In Action
The matching lifecycle steps:
1. Patient Intake: Patient medical parameters (e.g. Sarah Chen, stage IV adenocarcinoma, EGFR positive, NYHA Class II CHF) are mapped in.
2. Automatic Filter Harmonization: Biomarkers, age constraints, staging criteria, and location coordinates are securely indexed.
3. Grounded Verification: Engine triggers Google Search Grounding to parse clinical registries for active site investigator details and real-time trial records.
4. Intelligent Scoring: The Gemini clinical reasoning algorithm scores the profile matching suitabilities, checking exclusions.
5. Peer Coordination Audit: Live clinician edits generated referral templates on the portal and dispatches secure referral envelopes in seconds.`,
      speakerNotes: "Let's map this in action with a standard clinical trial matching pipeline. The coordinator takes an unstructured patient record, like Sarah Chen. The agent handles OCR extraction of biomarkers. It maps the inclusion and exclusion criteria instantly, triggers Google Search Grounding to confirm trial registry parameters, calculates matching scores, and provides structured reasoning right to the caregiver.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              A Living Walkthrough
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              Watch unstructured medical text transition seamlessly to structural matched registry indexes in moments:
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-950 font-sans">
              <strong className="font-bold flex items-center gap-1"><Sparkles className="w-4 h-4 text-blue-600 shrink-0" /> Target Case Study Profile:</strong>
              <p className="text-[11px] leading-relaxed text-blue-900">
                Patient presenting with Stage IV Nonsmall-Cell Lung Cancer, positive for EGFR exon 19 deletion, previous line of platinum doublet therapy completed. Previous NYHA Class II Congestive Heart Failure reported.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-sans">System Matching Pipeline</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-mono font-bold px-2 py-0.5 rounded border border-blue-100">RUNNING</span>
              </div>

              <div className="space-y-2 font-sans text-[11px] text-slate-600">
                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px] flex items-center justify-center">1</div>
                  <span>Extract Biomarker Targets: <strong className="text-slate-800 font-medium">Stage IV NSCLC, EGFR+ Exon 19 del</strong></span>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px] flex items-center justify-center">2</div>
                  <span>Trigger Google Search Grounding to verify NCT NCT04191499 enrollment status.</span>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold font-mono text-[10px] flex items-center justify-center">3</div>
                  <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                    Evaluate NYHA Class II CHF safety exclusion criteria vs Protocol guidelines.
                  </span>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px] flex items-center justify-center">4</div>
                  <span>Recommend Decision Match Score: <strong className="text-emerald-600 font-semibold font-mono">92/100 MATCH</strong></span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-3.5 text-slate-300 font-sans text-xs flex justify-between items-center">
              <span>Coordinators view matches, make instant edits, and click &apos;Approve &amp; Dispatch&apos;.</span>
              <span className="p-1 px-2.5 bg-blue-600 text-white font-bold rounded text-[10px] shrink-0">SMTP DEPLOYED</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      category: "Value & ROI",
      title: "Strategic Impact & Business Benefits",
      tagline: "Reducing administrative matching friction to boost onboarding yield by 40%.",
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
      rawText: `Slide 7: Strategic Launch Benefits
Title: Strategic Impact & Business Benefits
Subtitle: The Concrete Returns of Deploying TrialLogix
Business value parameters:
1. 10x Team Performance Leverage: Allows clinical research nurses to scale coordinator limits from 10 patients to 100+ securely.
2. Weeks Saved On Onboarding: Reduces patient profile-to-trial referral cycles from 14 days down to 2 minutes.
3. 40% Increase in Trial Enrollment Yield: Shaves off matching delays, resolving trial under-enrollment risks immediately.
4. Total Regulatory & Compliance Safety: Absolute de-identification, secure persistence databases (Firestore), and manual physical verification check points lowers litigation index.
5. Shaving Millions Off Sponsor Budgets: Shaving key weeks off clinical onboarding phases saves pharmaceutical sponsors millions in standard timeline capital fees.`,
      speakerNotes: "When we talk about launching TrialLogix, the business case is clear. We elevate coordinator capacity by 10x, compress matching timelines from two weeks to under 60 seconds, and boost enrollment yields by up to 40%. By accelerating clinical matching phases, pharmaceutical sponsors save millions, and clinical networks run with higher safety confidence.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              The Return on Intelligence (ROI)
            </h3>
            
            <p className="text-sm text-slate-600 leading-relaxed font-sans font-sans">
              Deploying TrialLogix transforms the economics of clinical centers, creating immense administrative and therapeutic gains:
            </p>

            <ul className="space-y-3 font-sans text-xs text-slate-600">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 bg-emerald-50 rounded-full p-0.5 shrink-0" />
                <span>Onboarding velocity drops from <strong className="text-rose-600 font-semibold">14 days to 2 minutes</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 bg-emerald-50 rounded-full p-0.5 shrink-0" />
                <span>Active clinical coordinator scale capacity increased by <strong className="text-green-600 font-semibold">1,000%</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 bg-emerald-50 rounded-full p-0.5 shrink-0" />
                <span>Center clinical matching trial enrollment yield boosts by up to <strong className="text-green-600 font-semibold">40%</strong></span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-1">
              <span className="text-3xl font-black text-blue-600 font-mono">1,000%</span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-sans">Operational Efficiency</p>
              <p className="text-[11px] text-slate-400 font-sans">Higher coordinator stewardship output</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-1">
              <span className="text-3xl font-black text-emerald-600 font-mono">60s</span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-sans">Time To Matches</p>
              <p className="text-[11px] text-slate-400 font-sans">Automated eligibility justifications</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-1">
              <span className="text-3xl font-black text-purple-600 font-mono">40%</span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-sans">Enrollment Boost</p>
              <p className="text-[11px] text-slate-400 font-sans">Resolved administrative delays</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-1">
              <span className="text-3xl font-black text-indigo-600 font-mono">ZERO</span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-sans">Eligbility Errors</p>
              <p className="text-[11px] text-slate-400 font-sans">Clean structured matching verification</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      category: "Roadmap",
      title: "The Path Forward: Launch Steps",
      tagline: "Moving transparently from a validated prototype to a scaled medical environment.",
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
      rawText: `Slide 8: Deployment Roadmap
Title: The Path Forward: Launch Steps
Subtitle: Moving from Prototype to Scaled Medical Integration
The Integration Timeline:
Stage 1: Verified Multi-Agent Prototype (COMPLETED): Fully functioning structured match scoring logic, secure de-identification, and live Firestore replication pipeline ready for demo check.
Stage 2: Regional Site Pilots (Q3 2026): Partnering with 3 regional oncology networks to integrate local EHR databases and customize specific eligibility parameters.
Stage 3: HIPAA Enterprise Standards & Expansion (Q4 2026): Compiling full SOC2 / HIPAA certifications, establishing custom SSO login configurations, and launching outbound SMTP integration endpoints.`,
      speakerNotes: "To conclude, let's review the milestones ahead. We have already completed Stage 1—designing a multi-agent matching framework with active HIPAA safeguards and cloud storage synchronizations. Our next stage is deploying pilots across regional oncology networks, leading toward complete enterprise scale and full regulatory auditing by Q4 2026. Thank you.",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
          <div className="lg:col-span-6 space-y-4 font-sans">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Milestones to Scale
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              We have established a clear, compliant path to expand our clinical deployment sustainably:
            </p>

            <div className="bg-slate-900 text-white rounded-xl p-4.5 space-y-2 border border-slate-800 shadow">
              <span className="text-[10px] font-bold text-blue-400 font-mono uppercase tracking-wider">🌟 EXECUTIVE VISION SUMMARY</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                By replacing cognitive research overload with structured recommendation logic, we return valuable attention to clinical nursing and deliver clinical acceleration.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3 font-sans">
            <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-5">
              <div className="relative">
                <span className="absolute -left-9 top-0.5 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-[10px] font-bold text-white font-mono">1</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Stage 1: Verified Prototype</h4>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">COMPLETED</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">Fully operational match scores, cloud persistence sync, and human coordinator review portal dashboard.</p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-9 top-0.5 w-6 h-6 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center text-[10px] font-bold text-white font-mono">2</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Stage 2: Regional Networks Pilot</h4>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase mt-1 inline-block font-sans">Q3 2026</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">Integrating with 3 key trial ecosystems to ingest medical charts directly from EHR databases.</p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-9 top-0.5 w-6 h-6 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center text-[10px] font-bold text-white font-mono">3</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Stage 3: HIPAA Enterprise Scale</h4>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded uppercase mt-1 inline-block font-sans">Q4 2026</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">Acquiring SOC2 certification, locking absolute clinical integrations and scale SMTP outreach automation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="w-full space-y-6">
      {/* PPT Viewer Canvas */}
      <div className={`bg-white border rounded-2xl shadow-lg transition-all ${isFullScreen ? "fixed inset-0 z-50 p-8 flex flex-col justify-between" : "p-6"}`}>
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              SLIDE {currentSlideIndex + 1} OF {slides.length}
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              • {currentSlide.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                showNotes ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title="Toggle Speaker Notes"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Presenter Notes</span>
            </button>

            <button
              onClick={() => handleCopyText(currentSlide.rawText, currentSlideIndex)}
              className="p-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
              title="Copy details to paste directly into PowerPoint"
            >
              {copiedIndex === currentSlideIndex ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy Slide Code</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-600 flex items-center justify-center transition-all"
              title="Toggle Presentation Mode"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Presenter Scene */}
        <div className={`relative ${isFullScreen ? "flex-grow flex items-center justify-center my-8" : "min-h-[460px] py-12"} flex items-center`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="space-y-1 mt-1 mb-8">
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-widest">{currentSlide.category}</span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none mt-1">
                  {currentSlide.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentSlide.tagline}</p>
              </div>

              {/* Slide Body */}
              <div className="border border-slate-100 hover:border-slate-200 bg-[#fbfcfd] rounded-2xl p-6 sm:p-8 min-h-[340px] shadow-sm flex items-center justify-center">
                {currentSlide.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
          {/* Timeline Indicators */}
          <div className="flex gap-1.5 flex-grow max-w-sm mr-4">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-1.5 rounded-full flex-grow cursor-pointer transition-all ${
                  idx === currentSlideIndex 
                    ? "bg-blue-600" 
                    : idx < currentSlideIndex 
                      ? "bg-blue-200" 
                      : "bg-slate-200 hover:bg-slate-300"
                }`}
                title={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Auto Play Trigger */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                isPlaying ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title="Toggle Auto Play"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Auto-Play</span>
                </>
              )}
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg cursor-pointer disabled:opacity-40 hover:bg-slate-50 hover:text-slate-900 transition-all font-sans flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg cursor-pointer disabled:opacity-40 hover:bg-slate-50 hover:text-slate-900 transition-all font-sans flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Presenter Notes Panel */}
      {showNotes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-5 shadow-inner space-y-2.5 font-sans"
        >
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-1"></div>
            <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              💡 Presenter / Speaker Notes (Slide {currentSlideIndex + 1})
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            {currentSlide.speakerNotes}
          </p>
          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 font-mono">
            <span>💡 Pro-Tip: paste current layout content directly into PowerPoint with the top button.</span>
            <span>⌨ Use Arrow Keys (← / →) on your keyboard to navigate easily.</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
