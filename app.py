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
from pydub import AudioSegment

# Set ffmpeg path for pydub (using imageio-ffmpeg)
try:
    import imageio_ffmpeg
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    AudioSegment.converter = ffmpeg_path
    print(f"FFmpeg configured at: {ffmpeg_path}")
except ImportError:
    print("Warning: imageio-ffmpeg not installed. Audio conversion may fail.")
except Exception as e:
    print(f"Warning: Could not configure ffmpeg: {e}")

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
        
        # Try using soundfile first (doesn't need ffmpeg)
        try:
            import wave
            # For webm, we still need pydub, but we'll give a better error
            audio = pydub.AudioSegment.from_file(temp_webm_path, format="webm")
            audio = audio.set_channels(1)  # Mono
            audio = audio.set_frame_rate(16000)  # 16kHz for speech
            audio.export(temp_wav_path, format="wav")
            print("Conversion complete.")
        except Exception as conv_error:
            print(f"Audio conversion error: {conv_error}")
            raise Exception(
                "Audio conversion failed. FFmpeg is required on Windows. "
                "Please install FFmpeg: https://ffmpeg.org/download.html "
                "Or use Chocolatey: 'choco install ffmpeg'"
            )
        
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

@app.route('/api/analytics/advanced', methods=['GET'])
def get_advanced_analytics():
    """
    Provides comprehensive analytics data including trends, error patterns, 
    struggling words, performance distribution, and time-based analysis.
    """
    try:
        from datetime import timedelta
        
        # Get time filter from query params (default 30 days)
        days = int(request.args.get('days', 30))
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get all reports after cutoff date
        reports = list(reports_collection.find({
            'timestamp': {'$gte': cutoff_date}
        }).sort('timestamp', 1))
        
        if not reports:
            return jsonify({
                'summary': {'total_assessments': 0, 'avg_wcpm': 0, 'avg_accuracy': 0, 'unique_students': 0},
                'trends': [],
                'error_patterns': [],
                'struggling_words': [],
                'performance_distribution': [],
                'time_analysis': []
            })
        
        # Calculate summary stats
        total = len(reports)
        avg_wcpm = sum(r.get('wcpm', 0) for r in reports) / total if total > 0 else 0
        avg_accuracy = sum(r.get('accuracy_percent', 0) for r in reports) / total if total > 0 else 0
        unique_students = len(set(r.get('student_name', '') for r in reports if r.get('student_name')))
        
        # Trends data (daily aggregates)
        trends_dict = {}
        for report in reports:
            timestamp = report.get('timestamp', datetime.now())
            date_key = timestamp.strftime('%Y-%m-%d')
            if date_key not in trends_dict:
                trends_dict[date_key] = {'wcpm': [], 'accuracy': [], 'prosody': []}
            trends_dict[date_key]['wcpm'].append(report.get('wcpm', 0))
            trends_dict[date_key]['accuracy'].append(report.get('accuracy_percent', 0))
            trends_dict[date_key]['prosody'].append(report.get('prosody_score', 0))
        
        trends = [
            {
                'date': date,
                'wcpm': sum(data['wcpm']) / len(data['wcpm']) if data['wcpm'] else 0,
                'accuracy': sum(data['accuracy']) / len(data['accuracy']) if data['accuracy'] else 0,
                'prosody': sum(data['prosody']) / len(data['prosody']) if data['prosody'] else 0
            }
            for date, data in sorted(trends_dict.items())
        ]
        
        # Error patterns
        error_counts = {'substitutions': 0, 'omissions': 0, 'insertions': 0}
        word_errors = {}
        
        for report in reports:
            opcodes = report.get('opcodes', [])
            ground_truth_words = report.get('ground_truth_words', [])
            
            for op in opcodes:
                tag = op[0]
                if tag == 'replace':
                    error_counts['substitutions'] += 1
                    if len(ground_truth_words) > op[1]:
                        word = ground_truth_words[op[1]]
                        if word not in word_errors:
                            word_errors[word] = {'error_count': 0, 'total': 0}
                        word_errors[word]['error_count'] += 1
                        word_errors[word]['total'] += 1
                elif tag == 'delete':
                    error_counts['omissions'] += 1
                    if len(ground_truth_words) > op[1]:
                        word = ground_truth_words[op[1]]
                        if word not in word_errors:
                            word_errors[word] = {'error_count': 0, 'total': 0}
                        word_errors[word]['error_count'] += 1
                        word_errors[word]['total'] += 1
                elif tag == 'insert':
                    error_counts['insertions'] += 1
        
        error_patterns = [
            {'name': 'Substitutions', 'count': error_counts['substitutions']},
            {'name': 'Omissions', 'count': error_counts['omissions']},
            {'name': 'Insertions', 'count': error_counts['insertions']}
        ]
        
        # Struggling words (top 20)
        struggling_words = sorted(
            [{'word': word, 'error_count': data['error_count'], 'total_occurrences': data['total']} 
             for word, data in word_errors.items()],
            key=lambda x: x['error_count'],
            reverse=True
        )[:20]
        
        # Performance distribution by WCPM ranges
        wcpm_ranges = [(0, 30), (30, 60), (60, 90), (90, 120), (120, 200)]
        distribution = []
        for low, high in wcpm_ranges:
            count = sum(1 for r in reports if low <= r.get('wcpm', 0) < high)
            distribution.append({'range': f'{low}-{high}', 'students': count})
        
        # Time of day analysis
        hour_data = {}
        for report in reports:
            timestamp = report.get('timestamp', datetime.now())
            hour = timestamp.hour
            if hour not in hour_data:
                hour_data[hour] = {'scores': [], 'count': 0}
            hour_data[hour]['scores'].append(report.get('wcpm', 0))
            hour_data[hour]['count'] += 1
        
        time_analysis = [
            {
                'hour': f'{hour:02d}:00',
                'avg_score': sum(data['scores']) / len(data['scores']) if data['scores'] else 0,
                'assessments': data['count']
            }
            for hour, data in sorted(hour_data.items())
        ]
        
        return jsonify({
            'summary': {
                'total_assessments': total,
                'avg_wcpm': round(avg_wcpm, 1),
                'avg_accuracy': round(avg_accuracy, 1),
                'unique_students': unique_students
            },
            'trends': trends,
            'error_patterns': error_patterns,
            'struggling_words': struggling_words,
            'performance_distribution': distribution,
            'time_analysis': time_analysis
        })
    except Exception as e:
        print(f"Error in advanced analytics: {e}")
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