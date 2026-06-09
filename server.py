import os
import math
from flask import Flask, request, jsonify
from data import patient_profiles, clinical_trials
from matcher import score_trial, run_consistency_simulation

# Initialize Flask Application
app = Flask(__name__)

# Attempt to import Google GenAI SDK if installed, otherwise fallback to mock/requests info
GEMINI_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    pass

# Initialize Google GenAI Client safely using env configuration
def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    if GEMINI_AVAILABLE:
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[Gemini Client Init] Error initializing: {e}")
            return None
    return None

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "engine": "Clinical Trial Matcher Python",
        "gemini_sdk_imported": GEMINI_AVAILABLE,
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEY"))
    })

@app.route("/api/patients", methods=["GET"])
def get_patients():
    return jsonify(patient_profiles)

@app.route("/api/trials", methods=["GET"])
def get_trials():
    return jsonify(clinical_trials)

@app.route("/api/match", methods=["POST"])
def post_match():
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    nct_id = data.get("nct_id")
    
    # Allow passing custom override fields for real-time sandbox tuning
    patient_override = data.get("patient_override")
    
    patient = next((p for p in patient_profiles if p["patient_id"] == patient_id), None)
    trial = next((t for t in clinical_trials if t["nct_id"] == nct_id), None)
    
    if not patient or not trial:
        return jsonify({"error": "Patient or Trial not found"}), 404
        
    # Copy and apply real-time tuned sliders/toggles if present
    eval_patient = dict(patient)
    if patient_override:
        eval_patient.update(patient_override)
        # Ensure nested structures like lab_values are handled
        if "lab_values" in patient_override:
            labs = dict(patient["lab_values"])
            labs.update(patient_override["lab_values"])
            eval_patient["lab_values"] = labs
            
    result = score_trial(eval_patient, trial)
    return jsonify(result)

@app.route("/api/simulate", methods=["POST"])
def post_simulate():
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    nct_id = data.get("nct_id")
    patient_override = data.get("patient_override")
    
    patient = next((p for p in patient_profiles if p["patient_id"] == patient_id), None)
    trial = next((t for t in clinical_trials if t["nct_id"] == nct_id), None)
    
    if not patient or not trial:
        return jsonify({"error": "Patient or Trial not found"}), 404
        
    eval_patient = dict(patient)
    if patient_override:
        eval_patient.update(patient_override)
        if "lab_values" in patient_override:
            labs = dict(patient["lab_values"])
            labs.update(patient_override["lab_values"])
            eval_patient["lab_values"] = labs
            
    sim_results = run_consistency_simulation(eval_patient, trial, runs=100)
    return jsonify(sim_results)

@app.route("/api/chat", methods=["POST"])
def post_chat():
    data = request.get_json() or {}
    messages = data.get("messages")
    
    if not messages or not isinstance(messages, list):
        return jsonify({"error": "Missing or invalid messages array"}), 400
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "error": "Gemini API key is not configured in the active environment settings."
        }), 503
        
    # Attempt to retrieve client
    client = get_gemini_client()
    if not client:
        if not GEMINI_AVAILABLE:
            return jsonify({
                "error": "google-genai library is not installed in the current Python workspace runtime. Please install google-genai using pip."
            }), 501
        return jsonify({"error": "Failed to initialize Gemini Client with provided key."}), 500
        
    try:
        # Convert incoming chat messages to google-genai structure
        contents = []
        for m in messages:
            role = "user" if m.get("role") == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=m.get("text", ""))]
                )
            )
            
        system_instructions = (
            "You are TrialLogix Co-Pilot, an expert clinical research advisor. "
            "Your task is to analyze patient profiles, explain clinical trial matching metrics, and outline screening, "
            "washout, and scheduling approaches based strictly on structured evidence. "
            "Always align your explanations with the deterministic matching scores provided in the context (which total up to 100). "
            "Suggest concrete action items for screening gaps (such as ordering baseline imaging, doing a creatinine clearance check, or scheduling therapy washout). "
            "Be clear, evidence-based, compassionate, and precise. Never fabricate clinical data."
        )
        
        # Call Generate Content
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instructions,
                temperature=0.2
            )
        )
        
        response_text = response.text or "No response text generated."
        return jsonify({"text": response_text})
        
    except Exception as e:
        print(f"[Gemini Proxy Python Error]: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Container default ingress runs on port 3000
    # Note: when running from python command run: python server.py
    port = int(os.environ.get("PORT", 3000))
    print(f"===========================================================")
    print(f" Starting python clinical trial matcher api server...")
    print(f" Listening on http://0.0.0.0:{port}")
    print(f"===========================================================")
    app.run(host="0.0.0.0", port=port, debug=True)
