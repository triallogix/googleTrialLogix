# Clinical Trial Screener & Orchestrator

## Recent Updates

### FIX 2: Proprietary Asset Formation (`trial_rules_cache.json`)
- **Objective**: Persist standard eligibility rules structuted by Gemini to avoid redundant API calls and build a proprietary dataset of structured trials over time.
- **Implementation**: We implemented a global caching system (`globalTrialRulesCache`) in the orchestrator that stores JSON structures of trial rules keyed by the `nct_id`. This cache is persisted to the local file system at `trial_rules_cache.json` using Node's native `fs` module, ensuring cache durability across server restarts.
- **Vulnerability Checks**: The storage mechanism avoids external network hops or NoSQL injections since it's locally isolated. The file paths are tightly bound to `process.cwd()` without any variable concatenations that could lead to path traversal vulnerabilities.

### FIX 3: Invert the Gemini Rule Extraction Pipeline (Pre-Filtering)
- **Objective**: Prevent the Gemini Vertex AI API from being rate-limited or overwhelmed by running on too many irrelevant trials.
- **Implementation**: Instead of feeding all raw trial pulls from ClinicalTrials.gov straight into the GenAI engine, we placed a deterministic pre-filter step (the "Inverted Pipeline").
- **Mechanics**: 
  - Based on the currently selected patient's age and ECOG performance status, any trial that clearly excludes the patient based on simple regex heuristic checks (e.g., checks for ">= 18" if the patient is under 18, and "ecog 0 or 1" if the patient's ECOG is 3+) is discarded entirely from the processing queue *before* the Gemini call.
  - This ensures Vertex AI tokens are only spent on processing trials that have already passed deterministic baseline requirements.

### FIX 6: Deterministic Screening Connections
- **Objective**: The Referral Memo Generator is now reliably connected to the deterministic matching score, placing the true matching confidence prominently at the top of the memo text rather than hallucinating eligibility estimates.

## Security Posture
- Sanitization mechanisms via `sanitizeInput` are in place to remove null bytes and unexpected characters from user input prior to NIH endpoint calls.
- Trial Cache strictly parses `utf8` directly from file context with graceful `try/catch` fallbacks if JSON stringification or filesystem locking issues occur during the save process.
