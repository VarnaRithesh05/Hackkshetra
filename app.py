# 1. Import Libraries
import librosa
import myprosody
import difflib
from transformers import pipeline
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId # Import for handling Mongo ObjectIDs
from datetime import datetime
import os
import soundfile as sf # Use soundfile for broader compatibility
import pydub

# 2. Setup App, DB, and AI Model
app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
CORS(app) # Enable CORS for all routes

# --- Database Connection ---
# Assumes MongoDB is running locally on default port
# For production, use your MongoDB Atlas URI
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
try:
    client.server_info() # Test connection
    print("MongoDB connection successful.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    print("Please ensure MongoDB is running or MONGO_URI is set correctly.")

db = client['akshara'] # Database name
reports_collection = db['reports']
passages_collection = db['passages']


# --- AI Model Loading ---
# Load the ASR model once when the server starts.
# This is a large model, so it will be loaded into memory.
print("Loading ASR (Whisper) model. This may take a moment...")
try:
    asr_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-base.en")
    print("ASR Model loaded successfully.")
except Exception as e:
    print(f"Error loading ASR model: {e}")
    asr_pipeline = None

# 3. AI Analysis Function
def analyze_audio(audio_path, ground_truth_text):
    """
    This function contains all your core analysis logic.
    """
    if asr_pipeline is None:
        raise Exception("ASR model is not loaded. Cannot perform analysis.")
        
    print(f"Analyzing audio file: {audio_path}")
    print(f"Ground truth: {ground_truth_text}")

    # --- F1: ASR (Accuracy Base) ---
    print("Running ASR...")
    asr_result = asr_pipeline(audio_path)
    asr_transcript = asr_result["text"].strip().lower()
    print(f"ASR Transcript: {asr_transcript}")

    # --- F2: ACCURACY (Miscue Analysis) ---
    print("Running Miscue Analysis (difflib)...")
    ground_truth_words = ground_truth_text.lower().split()
    asr_words = asr_transcript.split()
    
    # Handle empty transcript
    if not asr_words:
        print("Warning: ASR transcript is empty.")
        return {
            "wcpm": 0,
            "accuracy_percent": 0,
            "prosody_score": "Error",
            "diff_html": "<p>Error: Could not transcribe audio.</p>",
            "articulation_rate": 0,
            "pause_count": 0,
            "created_at": datetime.utcnow()
        }
        
    s = difflib.SequenceMatcher(None, ground_truth_words, asr_words)
    accuracy_percent = s.ratio() * 100
    diff_html = difflib.HtmlDiff(wrapcolumn=80).make_table(ground_truth_words, asr_words, "Original Passage", "Student's Reading")
    
    # --- F1 (cont.): SPEED (WCPM) ---
    print("Calculating WCPM...")
    duration_sec = librosa.get_duration(filename=audio_path)
    correct_words = 0
    for tag, i1, i2, j1, j2 in s.get_opcodes():
        if tag == 'equal':
            correct_words += (i2 - i1)
    
    wcpm = 0
    if duration_sec > 0:
        wcpm = (correct_words / duration_sec) * 60
    else:
        print("Warning: Audio duration is zero.")
    
    # --- F3: PROSODY (Expression) ---
    print("Analyzing Prosody (myprosody)...")
    # myprosody might be sensitive to file paths, use absolute
    p = os.path.abspath(audio_path)
    
    try:
        # Note: myprosody prints to stdout, this is normal
        analysis = myprosody.myprosody(p) 
        pause_count = analysis.get_data()["number_of_pauses"]
        articulation_rate = analysis.get_data()["articulation_rate_(syllables/sec)"]
    except Exception as e:
        print(f"Error during myprosody analysis: {e}. Setting prosody metrics to 0.")
        pause_count = 0
        articulation_rate = 0

    # Simple heuristic for a qualitative score
    prosody_score = "Good"
    if articulation_rate == 0:
        prosody_score = "Unknown"
    elif articulation_rate < 2.5:
        prosody_score = "Choppy"
    elif pause_count > (len(ground_truth_words) / 10):
        prosody_score = "Hesitant"

    print("Analysis complete.")

    # 5. Return the Report as a dictionary
    return {
        "wcpm": wcpm,
        "accuracy_percent": accuracy_percent,
        "prosody_score": prosody_score,
        "diff_html": diff_html,
        "articulation_rate": articulation_rate,
        "pause_count": pause_count,
        "created_at": datetime.utcnow()
    }


# 4. Define API Routes

@app.route('/api/analyze', methods=['POST'])
def handle_analysis():
    """
    Main endpoint for analyzing an audio file.
    """
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file part"}), 400
    if 'passage' not in request.form:
        return jsonify({"error": "No passage text part"}), 400
    if 'passage_id' not in request.form:
        return jsonify({"error": "No passage_id part"}), 400

    audio_file = request.files['audio']
    ground_truth_text = request.form['passage']
    passage_id = request.form['passage_id']

    # Use a unique temp path
    temp_webm_path = "temp_audio.webm"
    temp_wav_path = "temp_audio.wav"
    audio_file.save(temp_webm_path)

    try:
        # --- Audio Conversion ---
        # Convert webm (from browser) to wav (for analysis libs)
        print("Converting webm to wav...")
        audio = pydub.AudioSegment.from_file(temp_webm_path, format="webm")
        audio.export(temp_wav_path, format="wav")
        print("Conversion complete.")
        
        # --- Run Analysis ---
        report = analyze_audio(temp_wav_path, ground_truth_text)
        
        # --- Save to DB ---
        # Add the passage ID to the report
        report['passage_id'] = ObjectId(passage_id) 
        
        # Save the complete report to MongoDB
        reports_collection.insert_one(report.copy()) # Send a copy to avoid BSON issues
        
        # --- Prep Response ---
        # Convert MongoDB ObjectIds to strings for JSON
        report['_id'] = str(report['_id'])
        report['passage_id'] = str(report['passage_id']) 
        
        return jsonify(report)
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": str(e)}), 500
        
    finally:
        # --- Cleanup ---
        if os.path.exists(temp_webm_path):
            os.remove(temp_webm_path)
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)

@app.route('/api/passages', methods=['GET'])
def get_passages():
    """
    Fetches all reading passages from the database.
    """
    try:
        passages = []
        for passage in passages_collection.find():
            passage['_id'] = str(passage['_id']) # Convert ObjectId to string
            passages.append(passage)
        return jsonify(passages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """
    Fetches all past reports from the database.
    """
    try:
        reports = []
        # Get newest 50 first
        for report in reports_collection.find().sort("created_at", -1).limit(50):
            report['_id'] = str(report['_id'])
            if 'passage_id' in report:
                report['passage_id'] = str(report['passage_id'])
            reports.append(report)
        return jsonify(reports)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 5. Serve React App (Handles all other routes)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# 6. Run the App
if __name__ == '__main__':
    # Set debug=False for production
    app.run(debug=True, port=5000)