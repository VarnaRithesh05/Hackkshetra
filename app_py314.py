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
users_collection = db['users']

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

# AI Model Loading
print("Loading ASR (Whisper) model. This may take a moment...")
print("⏳ First time: This will download ~290MB model...")
try:
    # Import transformers after setting ffmpeg path
    asr_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-base.en")
    print("✓ ASR Model loaded successfully.")
except Exception as e:
    print(f"✗ Error loading ASR model: {e}")
    asr_pipeline = None


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


def analyze_audio_simple(audio_path, ground_truth_text):
    """
    Simplified analysis function
    """
    if asr_pipeline is None:
        raise Exception("ASR model is not loaded. Cannot perform analysis.")
        
    print(f"📝 Analyzing audio file: {audio_path}")
    print(f"📖 Ground truth: {ground_truth_text[:50]}...")

    # 1. ASR (Automatic Speech Recognition)
    print("🎤 Running ASR...")
    try:
        # Load audio with soundfile first (avoids ffmpeg dependency)
        audio_data, sample_rate = sf.read(audio_path)
        
        # Pass numpy array directly to Whisper instead of file path
        # Use return_timestamps=True to support audio longer than 30 seconds
        asr_result = asr_pipeline(
            {"raw": audio_data, "sampling_rate": sample_rate},
            return_timestamps=True
        )
        asr_transcript = asr_result["text"].strip().lower()
        print(f"📝 ASR Transcript: {asr_transcript[:50]}...")
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
    
    # Create custom HTML diff with kid-friendly styling
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
    
    print("✅ Analysis complete.")

    return {
        "wcpm": round(wcpm, 2),
        "accuracy_percent": round(accuracy_percent, 2),
        "prosody_score": prosody_score,
        "diff_html": diff_html,
        "articulation_rate": round(speaking_rate, 2),
        "pause_count": 0,
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
