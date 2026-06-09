import React from "react";

export const ArchitectureDiagram: React.FC = () => {
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 880" width="100%" height="100%" style="background-color: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
  <defs>
    <!-- Shadows -->
    <filter id="shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.05" />
    </filter>
    <filter id="shadow-md" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.07" />
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.04" />
    </filter>

    <!-- Gradients for Pipeline Nodes -->
    <linearGradient id="grad-parser" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0fdf4" />
      <stop offset="100%" stop-color="#dcfce7" />
    </linearGradient>
    <linearGradient id="grad-masker" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0fdfa" />
      <stop offset="100%" stop-color="#ccfbf1" />
    </linearGradient>
    <linearGradient id="grad-search" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff" />
      <stop offset="100%" stop-color="#e0f2fe" />
    </linearGradient>
    <linearGradient id="grad-matcher" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faf5ff" />
      <stop offset="100%" stop-color="#f3e8ff" />
    </linearGradient>
    <linearGradient id="grad-enricher" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eef2ff" />
      <stop offset="100%" stop-color="#e0e7ff" />
    </linearGradient>
    <linearGradient id="grad-drafter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ecfdf5" />
      <stop offset="100%" stop-color="#d1fae5" />
    </linearGradient>

    <!-- Marker Arrowheads -->
    <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
    </marker>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ea580c" />
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#16a34a" />
    </marker>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#991b1b" />
    </marker>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7c3aed" />
    </marker>
  </defs>

  <!-- BACKGROUND DECORRATION GRID -->
  <path d="M0,40 H1140 M0,80 H1140 M0,120 H1140 M0,160 H1140 M0,200 H1140 M0,240 H1140 M0,280 H1140 M0,320 H1140 M0,360 H1140 M0,400 H1140 M0,440 H1140 M0,480 H1140 M0,520 H1140 M0,560 H1140 M0,600 H1140 M0,640 H1140 M0,680 H1140 M0,720 H1140 M0,760 H1140 M0,800 H1140 M0,840 H1140" stroke="#f1f5f9" stroke-width="1" />
  <path d="M40,0 V880 M80,0 V880 M120,0 V880 M160,0 V880 M200,0 V880 M240,0 V880 M280,0 V880 M320,0 V880 M360,0 V880 M400,0 V880 M440,0 V880 M480,0 V880 M520,0 V880 M560,0 V880 M600,0 V880 M640,0 V880 M680,0 V880 M720,0 V880 M760,0 V880 M800,0 V880 M840,0 V880 M880,0 V880 M920,0 V880 M960,0 V880 M1000,0 V880 M1040,0 V880 M1080,0 V880 M1120,0 V880" stroke="#f1f5f9" stroke-width="1" />

  <!-- TITLE HEADER -->
  <g transform="translate(40, 35)">
    <!-- Main Title -->
    <text x="0" y="0" font-size="24" font-weight="800" fill="#0f172a" letter-spacing="-0.03em">TrialLogix — System Architecture Diagram</text>
    <!-- Subtitle -->
    <text x="0" y="18" font-size="12" font-weight="500" fill="#64748b" letter-spacing="-0.01em">Google for Startups AI Agent Challenge · Track 1 · google-adk + MCP + Cloud Run (Human-in-the-Loop Implementation)</text>
  </g>

  <!-- ========================================== -->
  <!-- GOOGLE CLOUD PLATFORM CONTAINER (BLUE SHIELD) -->
  <!-- ========================================== -->
  <g>
    <rect x="20" y="80" width="750" height="730" fill="#f8fafc" fill-opacity="0.6" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="6,4" rx="16" />
    <rect x="30" y="90" width="180" height="25" fill="#e0e7ff" rx="4" />
    <text x="40" y="106" font-size="10" font-weight="700" fill="#4338ca" letter-spacing="0.05em">GOOGLE CLOUD PLATFORM</text>
  </g>

  <!-- ========================================== -->
  <!-- CLOUD RUN: BACKEND ADK ORCHESTRATOR (PURPLE) -->
  <!-- ========================================== -->
  <g transform="translate(210, 110)">
    <rect x="0" y="0" width="240" height="495" fill="#fafafa" fill-opacity="0.95" stroke="#7c3aed" stroke-width="1.2" stroke-dasharray="4,4" rx="12" />
    <rect x="10" y="10" width="185" height="20" fill="#f3e8ff" rx="4" />
    <text x="16" y="23" font-size="9" font-weight="700" fill="#6d28d9" letter-spacing="0.05em">ADK — SequentialAgent (Backend)</text>
  </g>

 

  <!-- PIPELINE STREAMS & DATA FLOW (STEPS 1 to 5) -->

  <!-- 1. Profile Parser -->
  <g transform="translate(230, 160)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="52" fill="url(#grad-parser)" stroke="#22c55e" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#15803d">1. Profile Parser [Phase 1]</text>
    <text x="12" y="32" font-size="9" font-weight="500" fill="#166534">gemini-3.5-flash</text>
    <text x="12" y="43" font-size="8" font-style="italic" fill="#15803d">Extracts structured clinical JSON</text>
  </g>

  <!-- 1.5 PII Masker -->
  <g transform="translate(230, 235)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="52" fill="url(#grad-masker)" stroke="#0d9488" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#0f766e">1.5 PII Masker [Phase 1]</text>
    <text x="12" y="32" font-size="9" font-weight="500" fill="#115e59">gemini-3.5-flash / Cloud DLP proxy</text>
    <text x="12" y="43" font-size="8" font-style="italic" fill="#0f766e">Anonymize identifiers &amp; dates</text>
  </g>

  <!-- 2. Trial Search -->
  <g transform="translate(230, 310)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="52" fill="url(#grad-search)" stroke="#0284c7" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#0369a1">2. Trial Search [Phase 2]</text>
    <text x="12" y="32" font-size="9" font-weight="500" fill="#075985">gemini-3.5-flash</text>
    <text x="12" y="43" font-size="8" font-style="italic" fill="#0369a1">Search &amp; parse ClinicalTrials.gov</text>
  </g>

  <!-- 3. Eligibility Matcher -->
  <g transform="translate(230, 385)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="52" fill="url(#grad-matcher)" stroke="#7c3aed" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#6d28d9">3. Eligibility Matcher [Phase 2]</text>
    <text x="12" y="32" font-size="9" font-weight="500" fill="#5b21b6">gemini-3.5-flash / Deterministic Engine</text>
    <text x="12" y="43" font-size="8" font-style="italic" fill="#6d28d9">Logic validation &amp; score breakdown</text>
  </g>

  <!-- 4. Context Enricher -->
  <g transform="translate(230, 460)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="52" fill="url(#grad-enricher)" stroke="#4f46e5" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#3730a3">4. Context Enricher [Phase 2]</text>
    <text x="12" y="32" font-size="9" font-weight="500" fill="#3730a3">clinicaltrials.gov API</text>
    <text x="12" y="43" font-size="8" font-style="italic" fill="#4338ca">Bypasses search limits via direct registry lookup
</text>
  </g>

  <!-- 5. Referral Drafter -->
  <g transform="translate(230, 535)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="52" fill="url(#grad-drafter)" stroke="#059669" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#065f46">5. Referral Drafter [Phase 3]</text>
    <text x="12" y="32" font-size="9" font-weight="500" fill="#065f46">gemini-3.5-flash</text>
    <text x="12" y="43" font-size="8" font-style="italic" fill="#047857">Drafts clinical letter JSON payload</text>
  </g>

  <!-- Connective Arrows Inside SequentialAgent -->
  <path d="M330,212 V235" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow-gray)" />
  <path d="M330,287 V310" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow-gray)" />
  <path d="M330,362 V385" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow-gray)" />
  <path d="M330,437 V460" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow-gray)" />
  <path d="M330,512 V535" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow-gray)" />

  <!-- PATIENT REFERRAL (PHYSICIAN INPUT) -->
  <g transform="translate(40, 160)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="140" height="65" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" rx="8" />
    <text x="10" y="18" font-size="11" font-weight="700" fill="#334155">Patient referral</text>
    <text x="10" y="32" font-size="8.5" fill="#475569">Free text / FHIR / PDF</text>
    <text x="10" y="46" font-size="8.5" font-weight="600" fill="#0f172a">Physician Clinical Input</text>
    <rect x="6" y="52" width="128" height="1" fill="#cbd5e1" />
  </g>
  <path d="M180,185 H230" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow-gray)" />


  <!-- ========================================== -->
  <!-- CLOUD FIRESTORE DB & FINGERPRINT GUARD (GREEN LIVE SYNC) -->
  <!-- ========================================== -->
  <g transform="translate(225, 610)" filter="url(#shadow-md)">
    <rect x="0" y="0" width="210" height="62" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" rx="8" />
    <text x="12" y="16" font-size="10.5" font-weight="700" fill="#15803d">Cloud Firestore (Live Sync)</text>
    <text x="12" y="28" font-size="8.5" font-weight="700" fill="#166534">✓ EHR Fingerprint Guard Active</text>
    <text x="12" y="39" font-size="7.5" fill="#475569">[Name, Age, Sex, ZIP, Diagnosis Code]</text>
    <text x="12" y="52" font-size="8.5" font-weight="800" fill="#15803d">STATUS: SYNCED &amp; DEDUPLICATED</text>
    <circle cx="192" cy="31" r="4" fill="#22c55e" />
    <circle cx="192" cy="31" r="7" fill="none" stroke="#22c55e" stroke-width="1" stroke-dasharray="2,2" />
  </g>
  <path d="M330,587 V610" fill="none" stroke="#16a34a" stroke-width="1.5" marker-end="url(#arrow-green)" />


  <!-- ========================================== -->
  <!-- CLOUD RUN: FRONTEND + EXECUTION FRAME (GOLD) -->
  <!-- ========================================== -->
  <g transform="translate(210, 680)">
    <rect x="0" y="0" width="540" height="110" fill="#fefdf0" fill-opacity="0.9" stroke="#ca8a04" stroke-width="1" stroke-dasharray="4,4" rx="12" />
    <rect x="10" y="10" width="190" height="18" fill="#fef9c3" rx="4" />
    <text x="16" y="22" font-size="9" font-weight="700" fill="#854d0e" letter-spacing="0.05em">Cloud Run (Frontend + Execution)</text>
  </g>

  <!-- Connect DB to Frontend -->
  <path d="M330,672 V700" fill="none" stroke="#16a34a" stroke-width="1.5" marker-end="url(#arrow-green)" />

  <!-- Physician Dashboard (React Native Web UI) -->
  <g transform="translate(230, 715)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="60" fill="#fffbeb" stroke="#d97706" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#b45309">Physician Dashboard</text>
    <text x="12" y="32" font-size="9" font-style="italic" fill="#78350f">High-Fidelity React Theme</text>
    <text x="12" y="46" font-size="8.5" font-weight="600" fill="#92400e">Manual XAI Review &amp; Tuning</text>
  </g>

  <!-- Execute Endpoint (/approve Webhook) -->
  <g transform="translate(505, 715)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="200" height="60" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.2" rx="8" />
    <text x="12" y="18" font-size="11" font-weight="700" fill="#15803d">Execute Endpoint</text>
    <text x="12" y="32" font-size="9" font-family="monospace" fill="#166534">/api/webhook/streamlit-approve</text>
    <text x="12" y="46" font-size="8.5" font-weight="600" fill="#14532d">Final Handoff trigger</text>
  </g>

  <path d="M430,745 H505" fill="none" stroke="#ca8a04" stroke-width="1.5" marker-end="url(#arrow-orange)" />


  <!-- ========================================== -->
  <!-- MCP SERVERS BINDING BOUND BOX (SALMON)     -->
  <!-- ========================================== -->
  <g>
    <rect x="790" y="80" width="330" height="730" fill="#fafafa" fill-opacity="0.8" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="6,4" rx="16" />
    <rect x="800" y="90" width="160" height="25" fill="#ffe4e6" rx="4" />
    <text x="810" y="106" font-size="10" font-weight="700" fill="#9f1239" letter-spacing="0.05em">MCP SERVERS (STDIO)</text>
  </g>

  <!-- 1. EHR Connector -->
  <g transform="translate(810, 140)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="290" height="65" fill="#fff5f5" stroke="#f87171" stroke-width="1.2" rx="8" />
    <text x="14" y="20" font-size="11" font-weight="700" fill="#991b1b">EHR connector</text>
    <text x="14" y="36" font-size="9" font-weight="500" fill="#7f1d1d">FHIR R4 API Integration (Epic / Cerner FHIR)</text>
    <text x="14" y="49" font-size="9.5" font-family="monospace" font-weight="700" fill="#991b1b">ehr_fetch_patient</text>
  </g>

  <!-- 2. ClinicalTrials.gov -->
  <g transform="translate(810, 304)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="290" height="65" fill="#fef7e5" stroke="#f59e0b" stroke-width="1.2" rx="8" />
    <text x="14" y="20" font-size="11" font-weight="700" fill="#92400e">ClinicalTrials.gov</text>
    <text x="14" y="36" font-size="9" fill="#78350f">v2 REST Public API Connector</text>
    <text x="14" y="50" font-size="9.5" font-family="monospace" font-weight="700" fill="#b45309">search_trials · get_trial_details</text>
  </g>

  <!-- 3. Google Search -->
  <g transform="translate(810, 460)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="290" height="65" fill="#f0f9ff" stroke="#38bdf8" stroke-width="1.2" rx="8" />
    <text x="14" y="20" font-size="11" font-weight="700" fill="#0369a1">Google Search</text>
    <text x="14" y="36" font-size="9" fill="#075985">ClinicalTrials.gov API (NIH Direct Registry v2 Connection)</text>
    <text x="14" y="50" font-size="9.5" font-family="monospace" font-weight="700" fill="#0284c7">Custom built-in search_tool</text>
  </g>

  <!-- 4. Email Outreach -->
  <g transform="translate(810, 712)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="290" height="65" fill="#fff5f5" stroke="#fda4af" stroke-width="1.2" rx="8" />
    <text x="14" y="20" font-size="11" font-weight="700" fill="#9f1239">Email outreach</text>
    <text x="14" y="36" font-size="9" fill="#881337">SMTP / SendGrid Secure Mailer</text>
    <text x="14" y="50" font-size="9.5" font-family="monospace" font-weight="700" fill="#be123c">send_email · get_email_log</text>
  </g>


  <!-- ========================================== -->
  <!-- CROSSLINKING AND INTER-CONTAINER CHANNELS -->
  <!-- ========================================== -->

  <!-- EHR Connector <-> Clinical Ingestion Sync (Dotted Red) -->
  <path d="M430,186 H750 Q780,186 780,150 T810,150" fill="none" stroke="#ef4444" stroke-dasharray="3,3" stroke-width="1.5" marker-end="url(#arrow-red)" />
  <text x="590" y="172" font-size="9" font-weight="600" fill="#b91c1c" text-anchor="middle">Fetch EHR clinical FHIR data (AST/Plt/Hgb)</text>

  <!-- Trial Search <-> ClinicalTrials.gov (Dotted Orange) -->
  <path d="M430,336 H750 Q785,336 785,320 T810,320" fill="none" stroke="#ea580c" stroke-dasharray="3,3" stroke-width="1.5" marker-end="url(#arrow-orange)" />
  <text x="590" y="322" font-size="9" font-weight="600" fill="#c2410c" text-anchor="middle">Recruiting criteria queries (v2 HTTP API)</text>

  <!-- Context enricher <-> Google Search (Dotted Blue) -->
  <path d="M430,486 H750 Q790,486 790,480 T810,480" fill="none" stroke="#0284c7" stroke-dasharray="3,3" stroke-width="1.5" marker-end="url(#arrow-blue)" />
  <text x="590" y="472" font-size="9" font-weight="600" fill="#0369a1" text-anchor="middle">Official study record & site verification (NIH Direct REST API Mapping)</text>

  <!-- Webhook Approved -> Email SMTP/SendGrid MCP (Dotted Green) -->
  <path d="M705,745 H810" fill="none" stroke="#16a34a" stroke-dasharray="3,3" stroke-width="1.5" marker-end="url(#arrow-green)" />
  <text x="758" y="736" font-size="8.5" font-weight="700" fill="#15803d" text-anchor="middle">Dispatched</text>


  <!-- ========================================== -->
  <!-- SYSTEM OUTPUTS & CLOSING FEEDBACK LOOP     -->
  <!-- ========================================== -->
  <g transform="translate(40, 695)" filter="url(#shadow-sm)">
    <rect x="0" y="0" width="140" height="90" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.2" rx="8" />
    <text x="10" y="18" font-size="11" font-weight="700" fill="#15803d">Outputs</text>
    <rect x="10" y="24" width="120" height="1" fill="#bbf7d0" />
    
    <!-- Checklist items of Outputs -->
    <circle cx="15" cy="40" r="2.5" fill="#16a34a" />
    <text x="24" y="43" font-size="8.5" font-weight="500" fill="#14532d">Referral letters sent</text>

    <circle cx="15" cy="56" r="2.5" fill="#16a34a" />
    <text x="24" y="59" font-size="8.5" font-weight="500" fill="#14532d">Audit log written (SSL)</text>

    <circle cx="15" cy="72" r="2.5" fill="#16a34a" />
    <text x="24" y="75" font-size="8.5" font-weight="500" fill="#14532d">Consolidated database</text>
  </g>

  <!-- Arrow from Email Outreach down and left around to Outputs -->
  <!-- Starts at (955, 777), goes down to 835, runs left to 110, then up to Outputs (110, 785) -->
  <path d="M955,777 V835 H110 V785" fill="none" stroke="#ea580c" stroke-width="2" marker-end="url(#arrow-orange)" />
  <text x="530" y="828" font-size="9" font-weight="700" fill="#c2410c" text-anchor="middle">Outreach dispatch and audit execution feedback loop</text>

  <!-- Arrow from Outputs back up to Patient Intake to complete clinical cycle -->
  <path d="M110,695 V225" fill="none" stroke="#16a34a" stroke-dasharray="3,2" stroke-width="1" marker-end="url(#arrow-green)" />
</svg>

`;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
