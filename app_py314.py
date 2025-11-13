# Alternative app.py that works with Python 3.14
# Uses wave module instead of pydub for audio handling

import difflib
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import os
import soundfile as sf
import warnings
import wave
import subprocess
import shutil
from werkzeug.security import generate_password_hash, check_password_hash
warnings.filterwarnings('ignore')

# Configure FFmpeg BEFORE importing transformers
try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    os.environ['PATH'] = os.path.dirname(ffmpeg_exe) + os.pathsep + os.environ.get('PATH', '')
    os.environ['FFMPEG_BINARY'] = ffmpeg_exe
    os.environ['IMAGEIO_FFMPEG_EXE'] = ffmpeg_exe
    print(f"✓ FFmpeg pre-configured at: {ffmpeg_exe}")
except Exception as e:
    print(f"⚠ Warning: Could not pre-configure FFmpeg: {e}")

# Now import transformers
from transformers import pipeline

# Setup App, DB
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
    print("  Please ensure MongoDB is running.")

db = client['akshara']
reports_collection = db['reports']
passages_collection = db['passages']
students_collection = db['students']
users_collection = db['users']

# Titles to hide from the default builtin passages list (case-insensitive)
# Add temporary removals here (e.g. 'my bag')
BLACKLISTED_TITLES = ["my bag"]

# Check for ffmpeg and set environment variable
ffmpeg_path = shutil.which('ffmpeg')
if not ffmpeg_path:
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        # Set environment variable for transformers/librosa to find ffmpeg
        os.environ['PATH'] = os.path.dirname(ffmpeg_path) + os.pathsep + os.environ.get('PATH', '')
        os.environ['FFMPEG_BINARY'] = ffmpeg_path
        print(f"✓ FFmpeg configured at: {ffmpeg_path}")
    except:
        print("⚠ Warning: FFmpeg not found. Audio conversion will fail.")
        print("  Install with: pip install imageio-ffmpeg")
        print("  Or download from: https://ffmpeg.org/download.html")
else:
    print(f"✓ FFmpeg found at: {ffmpeg_path}")

# AI Model Loading (Non-blocking)
asr_pipeline = None
model_loaded = False

def load_model():
    global asr_pipeline, model_loaded
    if model_loaded:
        return
    print("Loading ASR (Whisper) model. This may take a moment...")
    print("⏳ This may take a few minutes on first run...")
    try:
        asr_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-base.en")
        model_loaded = True
        print("✓ ASR Model loaded successfully.")
    except Exception as e:
        print(f"✗ Error loading ASR model: {e}")
        print("  Model will be loaded when analyze endpoint is first called.")
        asr_pipeline = None

# Start model loading in background thread
import threading
model_thread = threading.Thread(target=load_model, daemon=True)
model_thread.start()


def convert_webm_to_wav(input_path, output_path):
    """Convert webm to wav using ffmpeg"""
    if not ffmpeg_path:
        raise Exception("FFmpeg not found. Cannot convert audio.")
    
    try:
        # Use ffmpeg to convert
        cmd = [
            ffmpeg_path,
            '-i', input_path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',  # Overwrite output
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"FFmpeg error: {result.stderr}")
        
        return True
    except Exception as e:
        raise Exception(f"Audio conversion failed: {str(e)}")


def create_word_comparison_html(ground_truth_words, asr_words, sequence_matcher):
    """
    Create a colorful, kid-friendly word-by-word comparison HTML
    """
    html = '''
    <div style="background: linear-gradient(to bottom right, #fef3c7, #fde68a); padding: 1rem; border-radius: 1rem; border: 3px solid #fbbf24;">
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <div style="flex: 1;">
                <div style="background: white; padding: 0.75rem; border-radius: 0.75rem; border: 2px solid #10b981; margin-bottom: 0.5rem;">
                    <div style="font-weight: 900; color: #059669; font-size: 0.875rem; margin-bottom: 0.5rem;">✅ CORRECT</div>
                    <div style="background: #d1fae5; padding: 0.5rem; border-radius: 0.5rem; display: inline-block;">
                        <span style="color: #065f46; font-weight: 700;">word</span>
                    </div>
                </div>
            </div>
            <div style="flex: 1;">
                <div style="background: white; padding: 0.75rem; border-radius: 0.75rem; border: 2px solid #ef4444; margin-bottom: 0.5rem;">
                    <div style="font-weight: 900; color: #dc2626; font-size: 0.875rem; margin-bottom: 0.5rem;">❌ MISTAKE</div>
                    <div style="background: #fee2e2; padding: 0.5rem; border-radius: 0.5rem; display: inline-block;">
                        <span style="color: #991b1b; font-weight: 700; text-decoration: line-through;">wrong</span>
                    </div>
                </div>
            </div>
        </div>
        <div style="background: white; padding: 1rem; border-radius: 1rem; border: 2px solid #fbbf24;">
            <div style="line-height: 2; font-size: 1rem;">
    '''
    
    for tag, i1, i2, j1, j2 in sequence_matcher.get_opcodes():
        if tag == 'equal':
            for i in range(i1, i2):
                word = ground_truth_words[i]
                html += f'<span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.5rem; border-radius: 0.5rem; margin: 0.125rem; display: inline-block; font-weight: 600;">{word}</span> '
        elif tag == 'replace':
            for i in range(i1, i2):
                word = ground_truth_words[i]
                html += f'<span style="background: #fee2e2; color: #991b1b; padding: 0.25rem 0.5rem; border-radius: 0.5rem; margin: 0.125rem; display: inline-block; font-weight: 600; text-decoration: line-through;">{word}</span> '
        elif tag == 'delete':
            for i in range(i1, i2):
                word = ground_truth_words[i]
                html += f'<span style="background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 0.5rem; margin: 0.125rem; display: inline-block; font-weight: 600; border: 2px dashed #f59e0b;">⊘{word}</span> '
    
    html += '''
            </div>
        </div>
        <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: #78716c; font-weight: 700;">
            💡 Green = Correct • Red = Wrong • Yellow = Skipped
        </div>
    </div>
    '''
    
    return html


def calculate_punctuation_awareness(word_chunks, ground_truth_text):
    """
    Calculate punctuation awareness score by analyzing pauses at punctuation marks.
    
    This measures if the student is reading for meaning by checking if they pause
    appropriately at commas and periods.
    
    Args:
        word_chunks: List of word dictionaries with text and timestamp tuples
        ground_truth_text: The original passage text
        
    Returns:
        dict with punctuation_score, matched_pauses, total_expected_pauses, and details
    """
    print("⏸️  Analyzing Punctuation Awareness...")
    
    if not word_chunks or len(word_chunks) < 2:
        print("⚠️  Not enough word chunks for punctuation analysis")
        return {
            "punctuation_score": 0,
            "matched_pauses": 0,
            "total_expected_pauses": 0,
            "total_pauses_detected": 0,
            "details": []
        }
    
    # Constants
    PAUSE_THRESHOLD = 0.3  # seconds - meaningful pause
    
    # Build a map of punctuation positions by analyzing words directly
    ground_truth_words = ground_truth_text.lower().split()
    punctuation_positions = []
    
    for idx, word in enumerate(ground_truth_words):
        # Check if word ends with punctuation
        if word and word[-1] in ['.', ',', '!', '?', ';', ':']:
            punctuation_positions.append({
                'char': word[-1],
                'word_index': idx,
                'word': word,
                'is_major': word[-1] in ['.', '!', '?']  # Period-like punctuation
            })
    
    print(f"📍 Found {len(punctuation_positions)} punctuation marks in passage")
    print(f"   Punctuation locations: {[f'{p['word']}(idx:{p['word_index']})' for p in punctuation_positions[:5]]}")
    
    # If no punctuation found, return zero score with message
    if len(punctuation_positions) == 0:
        print("⚠️  No punctuation marks found in passage - cannot calculate punctuation awareness")
        return {
            "punctuation_score": 0,
            "matched_pauses": 0,
            "total_expected_pauses": 0,
            "total_pauses_detected": 0,
            "pause_locations": [],
            "message": "No punctuation marks in this passage"
        }
    
    # Analyze pauses between words and match with punctuation
    pauses = []
    matched_pauses = 0
    total_significant_pauses = 0
    
    # Create a set of punctuation word indices for faster lookup
    punct_word_indices = {p['word_index'] for p in punctuation_positions}
    
    for i in range(len(word_chunks) - 1):
        current_word = word_chunks[i]
        next_word = word_chunks[i + 1]
        
        # Extract timestamps
        current_timestamp = current_word.get('timestamp', (0, 0))
        next_timestamp = next_word.get('timestamp', (0, 0))
        
        if not isinstance(current_timestamp, tuple) or not isinstance(next_timestamp, tuple):
            continue
            
        current_end = current_timestamp[1]
        next_start = next_timestamp[0]
        
        pause_duration = next_start - current_end
        
        # Only consider significant pauses
        if pause_duration >= PAUSE_THRESHOLD:
            total_significant_pauses += 1
            
            # Check if current word (i) has punctuation
            # We check current word index against punctuation positions
            has_punctuation = i in punct_word_indices
            expected_punct = None
            
            if has_punctuation:
                # Find the punctuation details
                for punct in punctuation_positions:
                    if punct['word_index'] == i:
                        expected_punct = punct
                        break
            
            pause_info = {
                'word_index': i,
                'word': current_word.get('text', ''),
                'pause_duration': round(pause_duration, 2),
                'has_punctuation': has_punctuation,
                'punctuation': expected_punct['char'] if expected_punct else None
            }
            
            if has_punctuation:
                matched_pauses += 1
                pause_info['matched'] = True
            else:
                pause_info['matched'] = False
            
            pauses.append(pause_info)
    
    # Calculate score based on total expected punctuation marks
    total_expected = len(punctuation_positions)
    punctuation_score = 0
    if total_expected > 0:
        punctuation_score = (matched_pauses / total_expected) * 100
    
    print(f"✅ Punctuation Score: {matched_pauses}/{total_expected} expected pauses matched = {round(punctuation_score, 1)}%")
    
    return {
        "punctuation_score": round(punctuation_score, 1),
        "matched_pauses": matched_pauses,
        "total_expected_pauses": total_expected,
        "total_pauses_detected": total_significant_pauses,
        "pause_locations": pauses[:10]  # Send first 10 for debugging
    }


def analyze_audio_simple(audio_path, ground_truth_text):
    """
    Simplified analysis function
    """
    if asr_pipeline is None:
        raise Exception("ASR model is not loaded. Cannot perform analysis.")
        
    print(f"📝 Analyzing audio file: {audio_path}")
    print(f"📖 Ground truth: {ground_truth_text[:50]}...")

    # 1. ASR (Automatic Speech Recognition) with Word-Level Timestamps
    print("🎤 Running ASR with word-level timestamps...")
    try:
        # Load audio with soundfile first (avoids ffmpeg dependency)
        audio_data, sample_rate = sf.read(audio_path)
        
        # Pass numpy array directly to Whisper instead of file path
        # Use return_timestamps="word" to get word-level timestamps for punctuation analysis
        asr_result = asr_pipeline(
            {"raw": audio_data, "sampling_rate": sample_rate},
            return_timestamps="word"
        )
        asr_transcript = asr_result["text"].strip().lower()
        word_chunks = asr_result.get("chunks", [])
        print(f"📝 ASR Transcript: {asr_transcript[:50]}...")
        print(f"📊 Got {len(word_chunks)} word-level timestamps")
    except Exception as e:
        print(f"✗ ASR Error: {e}")
        print(f"   Audio path: {audio_path}")
        print(f"   File exists: {os.path.exists(audio_path)}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Speech recognition failed: {str(e)}")

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
    
    # Get opcodes for React to render interactively
    opcodes = s.get_opcodes()
    
    # Create custom HTML diff with kid-friendly styling (kept for backward compatibility)
    diff_html = create_word_comparison_html(ground_truth_words, asr_words, s)
    
    # 3. SPEED (WCPM - Words Correct Per Minute)
    print("⏱ Calculating WCPM...")
    
    # Get audio duration using soundfile
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
    
    # 4. PROSODY (Simplified - based on speaking rate)
    print("🎭 Analyzing Prosody...")
    
    speaking_rate = len(asr_words) / duration_sec if duration_sec > 0 else 0
    
    # Prosody estimation based on speaking rate
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
    
    # 5. PUNCTUATION AWARENESS (Pro-level metric)
    # Measures if student pauses at commas/periods = reading for meaning
    punctuation_analysis = calculate_punctuation_awareness(word_chunks, ground_truth_text)
    
    print("✅ Analysis complete.")

    return {
        "wcpm": round(wcpm, 2),
        "accuracy_percent": round(accuracy_percent, 2),
        "prosody_score": prosody_score,
        "diff_html": diff_html,
        "opcodes": opcodes,  # For React interactive highlighting
        "ground_truth_words": ground_truth_words,  # Original passage words
        "asr_words": asr_words,  # What student actually said
        "articulation_rate": round(speaking_rate, 2),
        "pause_count": punctuation_analysis["total_pauses_detected"],
        "duration_seconds": round(duration_sec, 2),
        "correct_words": correct_words,
        "total_words": len(ground_truth_words),
        # Pro-level metric: Punctuation Awareness (clearer structure)
        "punctuation_score": punctuation_analysis["punctuation_score"],
        "punctuation_details": {
            "matched_pauses": punctuation_analysis["matched_pauses"],
            "total_expected_pauses": punctuation_analysis["total_expected_pauses"],
            "total_pauses_detected": punctuation_analysis["total_pauses_detected"],
            "pause_locations": punctuation_analysis["pause_locations"]
        },
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
    
    # Get student information
    student_name = request.form.get('student_name', '')
    student_grade = request.form.get('student_grade', '')
    student_id = request.form.get('student_id', '')

    print(f"👤 Student: {student_name} ({student_grade})")
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
            convert_webm_to_wav(temp_webm_path, temp_wav_path)
            print("✓ Conversion complete.")
        except Exception as conv_error:
            print(f"✗ Audio conversion error: {conv_error}")
            raise Exception(f"Audio conversion failed: {str(conv_error)}")
        
        # Run Analysis
        print("🔬 Starting analysis...")
        report = analyze_audio_simple(temp_wav_path, ground_truth_text)
        
        # Save to DB
        print("💾 Saving report to database...")
        report['passage_id'] = ObjectId(passage_id)
        
        # Add student information to report
        report['student_name'] = student_name
        report['student_grade'] = student_grade
        report['student_id'] = student_id
        
        # Insert into MongoDB
        result = reports_collection.insert_one(report.copy())
        report['_id'] = str(result.inserted_id)
        report['passage_id'] = str(report['passage_id'])
        
        print(f"✓ Report saved with ID: {report['_id']}")
        
        # Update student level based on performance
        if student_name:
            try:
                accuracy = float(report.get('accuracy_percent', 0))
                fluency = float(report.get('prosody_score', 0))
                
                # Get current student level
                student = students_collection.find_one({"name": student_name})
                if student:
                    current_level = int(student.get('current_level', 1))
                    
                    # Level up if both accuracy and fluency are good (>=90%)
                    if accuracy >= 90 and fluency >= 80:
                        new_level = min(current_level + 1, 4)  # Max level 4
                        if new_level != current_level:
                            students_collection.update_one(
                                {"name": student_name},
                                {"$set": {"current_level": new_level, "updated_at": datetime.now()}}
                            )
                            print(f"📈 Student level increased: {current_level} → {new_level}")
                    
                    # Level down if performance is poor (accuracy <70% or fluency <50%)
                    elif (accuracy < 70 or fluency < 50) and current_level > 1:
                        new_level = max(current_level - 1, 1)  # Min level 1
                        if new_level != current_level:
                            students_collection.update_one(
                                {"name": student_name},
                                {"$set": {"current_level": new_level, "updated_at": datetime.now()}}
                            )
                            print(f"📉 Student level decreased: {current_level} → {new_level}")
            except Exception as e:
                print(f"⚠ Warning: Could not update student level: {e}")
        
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
        try:
            if os.path.exists(temp_webm_path):
                os.remove(temp_webm_path)
                print(f"🗑 Cleaned up: {temp_webm_path}")
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)
                print(f"🗑 Cleaned up: {temp_wav_path}")
        except Exception as e:
            print(f"⚠ Warning: Could not cleanup temp files: {e}")


@app.route('/api/passages', methods=['GET', 'POST'])
def get_passages():
    """
    GET: Fetches all reading passages from the database.
    POST: Uploads a new custom reading passage.
    """
    try:
        if request.method == 'POST':
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({"error": "Invalid or missing JSON body."}), 400

            level = data.get('level', '').strip()
            title = data.get('title', '').strip()
            text = data.get('text', '').strip()

            if not level or not title or not text:
                return jsonify({"error": "Level, title, and text are required."}), 400

            # Validate text length
            word_count = len(text.split())
            if word_count < 10:
                return jsonify({"error": "Passage must contain at least 10 words."}), 400

            # Create passage document
            passage = {
                "level": level,
                "title": title,
                "text": text,
                "created_at": datetime.utcnow(),
                "source": "custom"
            }

            result = passages_collection.insert_one(passage)
            passage['_id'] = str(result.inserted_id)
            
            return jsonify({"success": True, "passage": passage}), 201

        else:  # GET method -> return only builtin / non-custom passages
            passages = []
            # Exclude user-uploaded custom passages from the default list
            for passage in passages_collection.find({"$or": [{"source": {"$exists": False}}, {"source": {"$ne": "custom"}}]}):
                title = (passage.get('title') or '').strip().lower()
                # Skip blacklisted titles (temporary removal)
                if title in BLACKLISTED_TITLES:
                    continue
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


@app.route('/api/passages/custom', methods=['GET'])
def get_custom_passages():
    """
    Fetches user-uploaded custom passages only.
    """
    try:
        passages = []
        for passage in passages_collection.find({"source": "custom"}):
            passage['_id'] = str(passage['_id'])
            passages.append(passage)
        return jsonify(passages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    try:
        # parse JSON safely - avoid raising BadRequest which bubbles into our 500
        data = request.get_json(silent=True)
        print('DEBUG auth_login: raw data ->', data)
        if data is None:
            print('DEBUG auth_login: missing JSON body')
            return jsonify({"error": "Invalid or missing JSON body."}), 400
        email = data.get('email', '').strip().lower()
        name = data.get('name', '').strip()
        password = data.get('password', '')
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        existing = users_collection.find_one({"email": email})
        if existing:
            return jsonify({"error": "User already exists."}), 400

        pw_hash = generate_password_hash(password)
        user = {
            "email": email,
            "name": name,
            "password_hash": pw_hash,
            "created_at": datetime.utcnow()
        }
        result = users_collection.insert_one(user)
        user['_id'] = str(result.inserted_id)
        return jsonify({"success": True, "user": {"_id": user['_id'], "email": email, "name": name}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Invalid or missing JSON body."}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"error": "Invalid credentials."}), 401
        
        # Defensive: handle old user documents that might not have password_hash
        if 'password_hash' not in user:
            print(f'WARNING: User {email} has no password_hash field - old document?')
            return jsonify({"error": "Invalid credentials."}), 401

        # Verify password
        try:
            if not check_password_hash(user['password_hash'], password):
                return jsonify({"error": "Invalid credentials."}), 401
        except Exception as pw_err:
            print(f'ERROR checking password for {email}:', pw_err)
            return jsonify({"error": "Invalid credentials."}), 401

        # Simple session token (not JWT) - in production use secure JWTs and HTTPS
        token = os.urandom(24).hex()
        users_collection.update_one({"_id": user['_id']}, {"$set": {"last_token": token, "last_login": datetime.utcnow()}})

        return jsonify({"success": True, "user": {"_id": str(user['_id']), "email": user['email'], "name": user.get('name', '')}, "token": token})
    except Exception as e:
        print('ERROR in auth_login:', e)
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/forgot-password', methods=['POST'])
def auth_forgot():
    try:
        data = request.get_json(force=True)
        email = data.get('email', '').strip().lower()
        if not email:
            return jsonify({"error": "Email is required."}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            # don't reveal whether user exists
            return jsonify({"success": True})

        # create a reset token (stored in DB) - no email sending in this simplified version
        token = os.urandom(20).hex()
        users_collection.update_one({"_id": user['_id']}, {"$set": {"pw_reset_token": token, "pw_reset_at": datetime.utcnow()}})
        # In production, send email containing reset link with token
        print(f"Password reset token for {email}: {token}")
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    try:
        token = request.headers.get('Authorization') or request.get_json(silent=True, force=False) and request.get_json().get('token')
        if not token:
            return jsonify({"error": "No token provided."}), 400
        user = users_collection.find_one({"last_token": token})
        if not user:
            return jsonify({"success": True})
        users_collection.update_one({"_id": user['_id']}, {"$unset": {"last_token": ""}})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/update-profile', methods=['POST'])
def auth_update_profile():
    try:
        token = request.headers.get('Authorization')
        data = request.get_json(force=True)
        name = data.get('name', '').strip()
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
        user = users_collection.find_one({"last_token": token})
        if not user:
            return jsonify({"error": "Invalid token"}), 401
        users_collection.update_one({"_id": user['_id']}, {"$set": {"name": name}})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/change-password', methods=['POST'])
def auth_change_password():
    try:
        token = request.headers.get('Authorization')
        data = request.get_json(force=True)
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
        user = users_collection.find_one({"last_token": token})
        if not user:
            return jsonify({"error": "Invalid token"}), 401
        # verify old password
        if not check_password_hash(user.get('password_hash', ''), old_password):
            return jsonify({"error": "Invalid current password."}), 401
        # set new password
        users_collection.update_one({"_id": user['_id']}, {"$set": {"password_hash": generate_password_hash(new_password)}})
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/class_stats', methods=['GET'])
def get_class_stats():
    """
    Get overall class statistics.
    Uses aggregation pipeline to:
    1. Sort by created_at descending
    2. Group by student_name to get most recent report per student
    3. Calculate total students, avg WCPM, and avg accuracy across class
    """
    try:
        pipeline = [
            # Step 1: Sort by created_at descending to prioritize recent reports
            {"$sort": {"created_at": -1}},
            
            # Step 2: Group by student_name, get first (most recent) report's wcpm and accuracy
            {"$group": {
                "_id": "$student_name",
                "wcpm": {"$first": "$wcpm"},
                "accuracy_percent": {"$first": "$accuracy_percent"}
            }},
            
            # Step 3: Calculate class-level statistics
            {"$group": {
                "_id": None,
                "totalStudents": {"$sum": 1},
                "avgWcpm": {"$avg": "$wcpm"},
                "avgAccuracy": {"$avg": "$accuracy_percent"}
            }}
        ]
        
        result = list(reports_collection.aggregate(pipeline))
        
        if result:
            stats = result[0]
            # Round averages to 2 decimal places
            stats['avgWcpm'] = round(stats.get('avgWcpm', 0), 2)
            stats['avgAccuracy'] = round(stats.get('avgAccuracy', 0), 2)
            stats['totalStudents'] = stats.get('totalStudents', 0)
            return jsonify(stats)
        else:
            # No data yet
            return jsonify({
                "totalStudents": 0,
                "avgWcpm": 0,
                "avgAccuracy": 0
            })
    except Exception as e:
        print(f"ERROR in get_class_stats: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/at_risk_students', methods=['GET'])
def get_at_risk_students():
    """
    Get students at risk of reading difficulties.
    Returns top 5 students with lowest accuracy (below 90%).
    Uses aggregation pipeline to get most recent report per student.
    """
    try:
        pipeline = [
            # Step 1: Sort by created_at descending (most recent first)
            {"$sort": {"created_at": -1}},
            
            # Step 2: Group by student_name, get first (most recent) report
            {"$group": {
                "_id": "$student_name",
                "student_name": {"$first": "$student_name"},
                "accuracy_percent": {"$first": "$accuracy_percent"},
                "wcpm": {"$first": "$wcpm"},
                "prosody_score": {"$first": "$prosody_score"},
                "created_at": {"$first": "$created_at"}
            }},
            
            # Step 3: Match reports with accuracy < 90
            {"$match": {"accuracy_percent": {"$lt": 90}}},
            
            # Step 4: Sort by accuracy ascending (lowest first)
            {"$sort": {"accuracy_percent": 1}},
            
            # Step 5: Limit to 5 results
            {"$limit": 5}
        ]
        
        result = list(reports_collection.aggregate(pipeline))
        
        # Convert ObjectId to string for JSON serialization
        for student in result:
            if "_id" in student:
                student["_id"] = str(student["_id"])
        
        return jsonify(result)
    except Exception as e:
        print(f"ERROR in get_at_risk_students: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/reading_groups', methods=['GET'])
def get_reading_groups():
    """
    Classify students into reading groups based on their latest accuracy score.
    Uses aggregation pipeline to get the most recent report for each student,
    then groups them into intervention, instructional, and independent groups.
    """
    try:
        # Aggregation pipeline: get latest report per student
        pipeline = [
            # Step 1: Sort by created_at descending to prioritize recent reports
            {"$sort": {"created_at": -1}},
            
            # Step 2: Group by student_name, get first (most recent) document
            {"$group": {
                "_id": "$student_name",
                "student_name": {"$first": "$student_name"},
                "accuracy_percent": {"$first": "$accuracy_percent"},
                "wcpm": {"$first": "$wcpm"},
                "prosody_score": {"$first": "$prosody_score"},
                "created_at": {"$first": "$created_at"}
            }}
        ]
        
        latest_reports = list(reports_collection.aggregate(pipeline))
        
        # Initialize reading groups
        intervention_group = []      # accuracy < 90
        instructional_group = []     # 90 <= accuracy < 95
        independent_group = []       # accuracy >= 95
        
        # Classify each student into a reading group
        for report in latest_reports:
            student_data = {
                "student_name": report.get("student_name", "Unknown"),
                "accuracy_percent": report.get("accuracy_percent", 0),
                "wcpm": report.get("wcpm", 0),
                "prosody_score": report.get("prosody_score", "N/A")
            }
            
            accuracy = report.get("accuracy_percent", 0)
            
            if accuracy < 90:
                intervention_group.append(student_data)
            elif accuracy < 95:
                instructional_group.append(student_data)
            else:
                independent_group.append(student_data)
        
        # Sort each group by accuracy (ascending for intervention, descending for independent)
        intervention_group.sort(key=lambda x: x["accuracy_percent"])
        instructional_group.sort(key=lambda x: x["accuracy_percent"])
        independent_group.sort(key=lambda x: x["accuracy_percent"], reverse=True)
        
        return jsonify({
            "intervention": intervention_group,
            "instructional": instructional_group,
            "independent": independent_group
        })
    except Exception as e:
        print(f"ERROR in get_reading_groups: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================================
# STUDENT MANAGEMENT ENDPOINTS
# ============================================================

@app.route('/api/students/upload', methods=['POST'])
def upload_students():
    """Upload student list from Excel file"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        teacher_id = request.form.get('teacher_id', 'default_teacher')
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({"error": "File must be Excel format (.xlsx or .xls)"}), 400
        
        # Save temp file
        temp_path = f"temp_roster_{datetime.now().timestamp()}.xlsx"
        file.save(temp_path)
        
        # Parse Excel file
        from openpyxl import load_workbook
        wb = load_workbook(temp_path)
        ws = wb.active
        
        students_added = 0
        students_updated = 0
        
        # Expected columns: Name, Grade, Student ID (optional)
        for row in ws.iter_rows(min_row=2, values_only=True):  # Skip header
            if not row[0]:  # Skip empty rows
                continue
                
            student_name = str(row[0]).strip()
            grade = str(row[1]).strip() if len(row) > 1 and row[1] else ""
            student_id = str(row[2]).strip() if len(row) > 2 and row[2] else None
            
            if not student_name:
                continue
            
            # Create student document
            student_doc = {
                "name": student_name,
                "grade": grade,
                "teacher_id": teacher_id,
                "current_level": 1,  # Start at level 1
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            if student_id:
                student_doc["student_id"] = student_id
            
            # Check if student already exists
            existing = students_collection.find_one({
                "name": student_name,
                "teacher_id": teacher_id
            })
            
            if existing:
                students_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": student_doc}
                )
                students_updated += 1
            else:
                students_collection.insert_one(student_doc)
                students_added += 1
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return jsonify({
            "success": True,
            "students_added": students_added,
            "students_updated": students_updated,
            "total": students_added + students_updated
        })
        
    except Exception as e:
        print(f"ERROR in upload_students: {e}")
        import traceback; traceback.print_exc()
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500


@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students for a teacher"""
    try:
        teacher_id = request.args.get('teacher_id', 'default_teacher')
        
        students = list(students_collection.find(
            {"teacher_id": teacher_id}
        ).sort("name", 1))
        
        # Convert ObjectId to string
        for student in students:
            student['_id'] = str(student['_id'])
            
        return jsonify(students)
        
    except Exception as e:
        print(f"ERROR in get_students: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/students/<student_name>/recommended-passage', methods=['GET'])
def get_recommended_passage(student_name):
    """Get recommended passage for a student based on their current level"""
    try:
        # Find student
        student = students_collection.find_one({"name": student_name})
        
        if not student:
            # If student not found, return level 1 passage
            passage = passages_collection.find_one({"level": "Level 1"})
        else:
            current_level = student.get('current_level', 1)
            # Get passage for current level
            passage = passages_collection.find_one({"level": f"Level {current_level}"})
            
            # If no passage found for level, default to level 1
            if not passage:
                passage = passages_collection.find_one({"level": "Level 1"})
        
        if passage:
            passage['_id'] = str(passage['_id'])
            return jsonify({
                "passage": passage,
                "current_level": student.get('current_level', 1) if student else 1
            })
        else:
            return jsonify({"error": "No passages found"}), 404
            
    except Exception as e:
        print(f"ERROR in get_recommended_passage: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/students/<student_name>/history', methods=['GET'])
def get_student_history(student_name):
    """Get reading history for a specific student"""
    try:
        # Get all reports for this student
        reports = list(reports_collection.find(
            {"student_name": student_name}
        ).sort("timestamp", 1))  # Chronological order
        
        if not reports:
            return jsonify({
                "student_name": student_name,
                "reports": [],
                "stats": {
                    "total_readings": 0,
                    "avg_pronunciation": 0,
                    "avg_fluency": 0,
                    "avg_wcpm": 0,
                    "avg_punctuation": 0
                },
                "trends": {
                    "pronunciation": "stable",
                    "fluency": "stable",
                    "wcpm": "stable",
                    "punctuation": "stable"
                },
                "suggestions": []
            })
        
        # Convert ObjectId to string
        for report in reports:
            report['_id'] = str(report['_id'])
            if 'passage_id' in report:
                report['passage_id'] = str(report['passage_id'])
        
        # Calculate statistics
        total_readings = len(reports)
        
        # Convert all values to float to handle mixed types from database
        pronunciation_scores = [float(r.get('accuracy_percent', 0)) for r in reports]
        fluency_scores = [float(r.get('prosody_score', 0)) for r in reports]
        wcpm_scores = [float(r.get('wcpm', 0)) for r in reports]
        punctuation_scores = [float(r.get('punctuation_details', {}).get('punctuation_score', 0)) for r in reports]
        
        avg_pronunciation = sum(pronunciation_scores) / total_readings if total_readings > 0 else 0
        avg_fluency = sum(fluency_scores) / total_readings if total_readings > 0 else 0
        avg_wcpm = sum(wcpm_scores) / total_readings if total_readings > 0 else 0
        avg_punctuation = sum(punctuation_scores) / total_readings if total_readings > 0 else 0
        
        # Analyze trends (compare last 3 readings to previous 3)
        def calculate_trend(scores):
            if len(scores) < 4:
                return "stable"
            recent = sum(scores[-3:]) / 3
            previous = sum(scores[-6:-3]) / 3 if len(scores) >= 6 else sum(scores[:-3]) / len(scores[:-3])
            if recent > previous + 5:
                return "improving"
            elif recent < previous - 5:
                return "declining"
            return "stable"
        
        trends = {
            "pronunciation": calculate_trend(pronunciation_scores),
            "fluency": calculate_trend(fluency_scores),
            "wcpm": calculate_trend(wcpm_scores),
            "punctuation": calculate_trend(punctuation_scores)
        }
        
        # Generate suggestions based on performance
        suggestions = []
        
        if avg_pronunciation < 85:
            suggestions.append({
                "category": "Pronunciation",
                "priority": "high",
                "suggestion": "Focus on phonics practice. Student struggles with accurate word pronunciation.",
                "activities": ["Sound-symbol correspondence exercises", "Repeated reading of familiar texts"]
            })
        elif avg_pronunciation < 95:
            suggestions.append({
                "category": "Pronunciation",
                "priority": "medium",
                "suggestion": "Continue building decoding skills with challenging vocabulary.",
                "activities": ["Word family exercises", "Multi-syllable word practice"]
            })
        
        if avg_fluency < 70:
            suggestions.append({
                "category": "Fluency",
                "priority": "high",
                "suggestion": "Work on prosody and expression. Practice reading with appropriate pacing.",
                "activities": ["Echo reading", "Choral reading", "Reader's theater"]
            })
        
        if avg_wcpm < 60:
            suggestions.append({
                "category": "Reading Speed",
                "priority": "high",
                "suggestion": "Student reads slowly. Focus on building automaticity with high-frequency words.",
                "activities": ["Timed repeated readings", "Sight word practice"]
            })
        elif avg_wcpm > 150:
            suggestions.append({
                "category": "Reading Speed",
                "priority": "low",
                "suggestion": "Student reads very quickly. Check for comprehension and accuracy.",
                "activities": ["Comprehension questions after reading", "Slow down and focus on expression"]
            })
        
        if avg_punctuation < 60:
            suggestions.append({
                "category": "Punctuation Awareness",
                "priority": "medium",
                "suggestion": "Practice pausing at punctuation marks. Model proper phrasing.",
                "activities": ["Marked text reading", "Punctuation treasure hunt", "Pause and breathe exercises"]
            })
        
        # Trend-based suggestions
        if trends["pronunciation"] == "declining":
            suggestions.append({
                "category": "Alert",
                "priority": "high",
                "suggestion": "⚠️ Pronunciation scores are declining. Schedule intervention time.",
                "activities": ["One-on-one reading support", "Diagnostic assessment"]
            })
        
        if trends["fluency"] == "improving":
            suggestions.append({
                "category": "Positive Progress",
                "priority": "low",
                "suggestion": "🎉 Great progress in fluency! Keep up the good work.",
                "activities": ["Challenge with higher-level texts", "Peer reading partnerships"]
            })
        
        if not suggestions:
            suggestions.append({
                "category": "Overall",
                "priority": "low",
                "suggestion": "✅ Student is performing well across all metrics. Continue current practices.",
                "activities": ["Maintain regular practice", "Introduce more complex texts"]
            })
        
        return jsonify({
            "student_name": student_name,
            "reports": reports,
            "stats": {
                "total_readings": total_readings,
                "avg_pronunciation": round(avg_pronunciation, 1),
                "avg_fluency": round(avg_fluency, 1),
                "avg_wcpm": round(avg_wcpm, 1),
                "avg_punctuation": round(avg_punctuation, 1)
            },
            "trends": trends,
            "suggestions": suggestions,
            "chart_data": {
                "labels": [r.get('timestamp', '') for r in reports],
                "pronunciation": pronunciation_scores,
                "fluency": fluency_scores,
                "wcpm": wcpm_scores,
                "punctuation": punctuation_scores
            }
        })
        
    except Exception as e:
        print(f"ERROR in get_student_history: {e}")
        import traceback; traceback.print_exc()
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
    # Use debug=False to avoid reloader issues with Python 3.14
    app.run(debug=False, host='0.0.0.0', port=5000)
