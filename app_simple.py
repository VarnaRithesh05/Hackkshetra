# Simplified version of app.py that works without librosa/myprosody
# This version focuses on getting the core functionality working first

import difflib
from transformers import pipeline
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import os
import soundfile as sf
from pydub import AudioSegment
import warnings
warnings.filterwarnings('ignore')

# Set ffmpeg path for pydub (using imageio-ffmpeg)
try:
    import imageio_ffmpeg
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    AudioSegment.converter = ffmpeg_path
    print(f"✓ FFmpeg configured at: {ffmpeg_path}")
except ImportError:
    print("⚠ Warning: imageio-ffmpeg not installed. Audio conversion may fail.")
except Exception as e:
    print(f"⚠ Warning: Could not configure ffmpeg: {e}")

# Setup App, DB, and AI Model
app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
CORS(app)

# Database Connection
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
try:
    client.server_info()
    print("✓ MongoDB connection successful.")
except Exception as e:
    print(f"✗ Error connecting to MongoDB: {e}")
    print("  Please ensure MongoDB is running or MONGO_URI is set correctly.")

db = client['akshara']
reports_collection = db['reports']
passages_collection = db['passages']

# AI Model Loading
print("Loading ASR (Whisper) model. This may take a moment...")
try:
    asr_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-base.en")
    print("✓ ASR Model loaded successfully.")
except Exception as e:
    print(f"✗ Error loading ASR model: {e}")
    asr_pipeline = None


def analyze_audio_simple(audio_path, ground_truth_text):
    """
    Simplified analysis function that works without librosa/myprosody
    """
    if asr_pipeline is None:
        raise Exception("ASR model is not loaded. Cannot perform analysis.")
        
    print(f"📝 Analyzing audio file: {audio_path}")
    print(f"📖 Ground truth: {ground_truth_text[:50]}...")

    # 1. ASR (Automatic Speech Recognition)
    print("🎤 Running ASR...")
    asr_result = asr_pipeline(audio_path)
    asr_transcript = asr_result["text"].strip().lower()
    print(f"📝 ASR Transcript: {asr_transcript[:50]}...")

    # 2. ACCURACY (Miscue Analysis using difflib)
    print("🔍 Running Miscue Analysis...")
    ground_truth_words = ground_truth_text.lower().split()
    asr_words = asr_transcript.split()
    
    if not asr_words:
        print("⚠ Warning: ASR transcript is empty.")
        return {
            "wcpm": 0,
            "accuracy_percent": 0,
            "prosody_score": "Error",
            "diff_html": "<p>Error: Could not transcribe audio.</p>",
            "articulation_rate": 0,
            "pause_count": 0,
            "duration_seconds": 0,
            "correct_words": 0,
            "total_words": len(ground_truth_words),
            "created_at": datetime.utcnow()
        }
        
    s = difflib.SequenceMatcher(None, ground_truth_words, asr_words)
    accuracy_percent = s.ratio() * 100
    diff_html = difflib.HtmlDiff(wrapcolumn=80).make_table(
        ground_truth_words, 
        asr_words, 
        "Original Passage", 
        "Student's Reading"
    )
    
    # 3. SPEED (WCPM - Words Correct Per Minute)
    print("⏱ Calculating WCPM...")
    
    # Get audio duration using soundfile (doesn't require librosa)
    try:
        audio_data, sample_rate = sf.read(audio_path)
        duration_sec = len(audio_data) / sample_rate
    except Exception as e:
        print(f"⚠ Warning: Could not read audio duration: {e}")
        duration_sec = 60  # Default to 60 seconds
    
    correct_words = 0
    for tag, i1, i2, j1, j2 in s.get_opcodes():
        if tag == 'equal':
            correct_words += (i2 - i1)
    
    wcpm = 0
    if duration_sec > 0:
        wcpm = (correct_words / duration_sec) * 60
    else:
        print("⚠ Warning: Audio duration is zero.")
    
    # 4. PROSODY (Simplified - based on speaking rate and pauses)
    print("🎭 Analyzing Prosody...")
    
    # Simple prosody estimation without myprosody
    speaking_rate = len(asr_words) / duration_sec if duration_sec > 0 else 0
    
    # Estimate prosody based on speaking rate
    # Typical reading rates: 
    # - Slow/Choppy: < 1.5 words/second
    # - Normal: 1.5-2.5 words/second  
    # - Fast: > 2.5 words/second
    
    if speaking_rate < 1.0:
        prosody_score = "Very Choppy"
    elif speaking_rate < 1.5:
        prosody_score = "Choppy"
    elif speaking_rate < 2.5:
        prosody_score = "Good"
    elif speaking_rate < 3.5:
        prosody_score = "Fluent"
    else:
        prosody_score = "Very Fast"
    
    print("✅ Analysis complete.")

    return {
        "wcpm": round(wcpm, 2),
        "accuracy_percent": round(accuracy_percent, 2),
        "prosody_score": prosody_score,
        "diff_html": diff_html,
        "articulation_rate": round(speaking_rate, 2),
        "pause_count": 0,  # Placeholder - would need advanced audio analysis
        "duration_seconds": round(duration_sec, 2),
        "correct_words": correct_words,
        "total_words": len(ground_truth_words),
        "created_at": datetime.utcnow()
    }


# API Routes

@app.route('/api/analyze', methods=['POST'])
def handle_analysis():
    """
    Main endpoint for analyzing an audio file.
    """
    print("\n" + "="*60)
    print("📥 NEW ANALYSIS REQUEST RECEIVED")
    print("="*60)
    
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file part"}), 400
    if 'passage' not in request.form:
        return jsonify({"error": "No passage text part"}), 400
    if 'passage_id' not in request.form:
        return jsonify({"error": "No passage_id part"}), 400

    audio_file = request.files['audio']
    ground_truth_text = request.form['passage']
    passage_id = request.form['passage_id']

    print(f"📝 Passage ID: {passage_id}")
    print(f"📄 Passage length: {len(ground_truth_text)} characters")
    print(f"🎵 Audio file: {audio_file.filename}")

    # Use unique temp paths
    temp_webm_path = f"temp_audio_{passage_id}.webm"
    temp_wav_path = f"temp_audio_{passage_id}.wav"
    
    audio_file.save(temp_webm_path)
    print(f"💾 Saved webm file: {temp_webm_path}")

    try:
        # Audio Conversion
        print("🔄 Converting webm to wav...")
        
        try:
            audio = AudioSegment.from_file(temp_webm_path, format="webm")
            audio = audio.set_channels(1)  # Mono
            audio = audio.set_frame_rate(16000)  # 16kHz for speech
            audio.export(temp_wav_path, format="wav")
            print("✓ Conversion complete.")
        except Exception as conv_error:
            print(f"✗ Audio conversion error: {conv_error}")
            raise Exception(
                "Audio conversion failed. FFmpeg is required. "
                "Install with: pip install imageio-ffmpeg"
            )
        
        # Run Analysis
        print("🔬 Starting analysis...")
        report = analyze_audio_simple(temp_wav_path, ground_truth_text)
        
        # Save to DB
        print("💾 Saving report to database...")
        report['passage_id'] = ObjectId(passage_id) 
        
        # Insert into MongoDB
        result = reports_collection.insert_one(report.copy())
        report['_id'] = str(result.inserted_id)
        report['passage_id'] = str(report['passage_id'])
        
        print(f"✓ Report saved with ID: {report['_id']}")
        print("="*60)
        print("✅ ANALYSIS COMPLETE - SENDING RESPONSE")
        print("="*60 + "\n")
        
        return jsonify(report)
        
    except Exception as e:
        print(f"✗ ERROR during analysis: {str(e)}")
        print("="*60 + "\n")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
        
    finally:
        # Cleanup temp files
        if os.path.exists(temp_webm_path):
            os.remove(temp_webm_path)
            print(f"🗑 Cleaned up: {temp_webm_path}")
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
            print(f"🗑 Cleaned up: {temp_wav_path}")


@app.route('/api/passages', methods=['GET'])
def get_passages():
    """
    Fetches all reading passages from the database.
    """
    try:
        passages = []
        for passage in passages_collection.find():
            passage['_id'] = str(passage['_id'])
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
        for report in reports_collection.find().sort("created_at", -1).limit(50):
            report['_id'] = str(report['_id'])
            if 'passage_id' in report:
                report['passage_id'] = str(report['passage_id'])
            reports.append(report)
        return jsonify(reports)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def serve():
    """Serve the React app"""
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting Akshara Flask Server")
    print("="*60)
    print("Server will run on: http://127.0.0.1:5000")
    print("API endpoints:")
    print("  - POST /api/analyze")
    print("  - GET  /api/passages")
    print("  - GET  /api/reports")
    print("="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
