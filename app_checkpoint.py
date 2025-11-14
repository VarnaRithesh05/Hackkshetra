# Akshara - 7 Hour Checkpoint Demo
# Core AI Pipeline: Whisper ASR + difflib Analysis + Basic Metrics

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import whisper
import datetime
import difflib
import os
import json

app = Flask(__name__)
CORS(app)

# MongoDB connection
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['akshara']
    passages_collection = db['passages']
    reports_collection = db['reports']
    print("✓ MongoDB connection successful")
except Exception as e:
    print(f"✗ MongoDB connection failed: {e}")

# Load Whisper model
print("Loading Whisper ASR model...")
print("⏳ This will download ~290MB on first run...")
model = whisper.load_model("base")
print("✓ Whisper model loaded successfully")

# Convert ObjectId to string for JSON serialization
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime.datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

app.json_encoder = JSONEncoder

@app.route('/api/passages', methods=['GET'])
def get_passages():
    """Fetch all reading passages"""
    try:
        passages = list(passages_collection.find())
        for passage in passages:
            passage['_id'] = str(passage['_id'])
        return jsonify(passages), 200
    except Exception as e:
        print(f"❌ Error fetching passages: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_reading():
    """
    Main analysis endpoint - 7 Hour Checkpoint Demo
    Core Pipeline: Whisper ASR → difflib word matching → WCPM calculation
    """
    try:
        print("\n" + "="*60)
        print("📥 NEW ANALYSIS REQUEST")
        print("="*60)
        
        audio_file = request.files.get('audio')
        passage_text = request.form.get('passage')
        passage_id = request.form.get('passage_id')

        if not audio_file or not passage_text:
            return jsonify({'error': 'Missing audio or passage text'}), 400

        # Save audio temporarily
        temp_path = f"temp_audio_{passage_id}.wav"
        audio_file.save(temp_path)
        print(f"💾 Audio saved: {temp_path}")

        # STEP 1: Whisper ASR Transcription
        print("\n🎤 STEP 1: Running Whisper ASR...")
        result = model.transcribe(temp_path, language='en')
        transcript = result['text'].lower().strip()
        duration = result['segments'][-1]['end'] if result['segments'] else 0
        print(f"   Transcript: '{transcript}'")
        print(f"   Duration: {duration:.2f}s")

        # STEP 2: difflib Word Matching
        print("\n📊 STEP 2: Analyzing with difflib...")
        ground_truth = passage_text.lower().strip().split()
        asr_words = transcript.split()
        
        print(f"   Expected words: {len(ground_truth)}")
        print(f"   Transcribed words: {len(asr_words)}")

        sm = difflib.SequenceMatcher(None, ground_truth, asr_words)
        opcodes = list(sm.get_opcodes())

        # Calculate accuracy
        matches = 0
        for tag, i1, i2, j1, j2 in opcodes:
            if tag == 'equal':
                matches += (i2 - i1)
        
        accuracy = (matches / len(ground_truth) * 100) if ground_truth else 0
        print(f"   Correct words: {matches}/{len(ground_truth)}")
        print(f"   Accuracy: {accuracy:.1f}%")

        # STEP 3: Calculate WCPM
        print("\n⚡ STEP 3: Calculating WCPM...")
        wcpm = (matches / duration * 60) if duration > 0 else 0
        print(f"   WCPM: {wcpm:.1f}")

        # STEP 4: Basic Prosody Score (Simple heuristic)
        print("\n🎭 STEP 4: Prosody Assessment...")
        if accuracy >= 90:
            prosody_score = "Fluent"
        elif accuracy >= 80:
            prosody_score = "Good"
        elif accuracy >= 70:
            prosody_score = "Choppy"
        else:
            prosody_score = "Very Choppy"
        print(f"   Prosody: {prosody_score}")

        # Generate colored HTML for word breakdown
        diff_html = generate_diff_html(ground_truth, asr_words, opcodes)

        # Build report
        report = {
            'passage_id': ObjectId(passage_id),
            'transcript': transcript,
            'ground_truth_words': ground_truth,
            'asr_words': asr_words,
            'wcpm': round(wcpm, 2),
            'accuracy_percent': round(accuracy, 2),
            'prosody_score': prosody_score,
            'duration_seconds': round(duration, 2),
            'correct_words': matches,
            'total_words': len(ground_truth),
            'diff_html': diff_html,
            'opcodes': opcodes,
            'created_at': datetime.datetime.now()
        }

        # Save to database
        print("\n💾 Saving report to MongoDB...")
        result_id = reports_collection.insert_one(report)
        report['_id'] = str(result_id.inserted_id)
        report['passage_id'] = str(report['passage_id'])
        print(f"✅ Report saved with ID: {report['_id']}")

        print("\n" + "="*60)
        print("✅ ANALYSIS COMPLETE!")
        print(f"📊 Results: WCPM={wcpm:.1f} | Accuracy={accuracy:.1f}% | Prosody={prosody_score}")
        print("="*60 + "\n")

        return jsonify(report), 200

    except Exception as e:
        print(f"\n❌ ERROR during analysis: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def generate_diff_html(ground_truth, asr_words, opcodes):
    """
    Generate colored HTML for word-by-word comparison
    Green = Correct, Red = Wrong/Missed
    """
    html_parts = []
    
    # Header with legend
    html_parts.append('''
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
    ''')
    
    # Word-by-word breakdown
    for tag, i1, i2, j1, j2 in opcodes:
        if tag == 'equal':
            for word in ground_truth[i1:i2]:
                html_parts.append(f'<span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.5rem; border-radius: 0.5rem; margin: 0.125rem; display: inline-block; font-weight: 600;">{word}</span> ')
        elif tag == 'replace' or tag == 'delete':
            for word in ground_truth[i1:i2]:
                html_parts.append(f'<span style="background: #fee2e2; color: #991b1b; padding: 0.25rem 0.5rem; border-radius: 0.5rem; margin: 0.125rem; display: inline-block; font-weight: 600; text-decoration: line-through;">{word}</span> ')
    
    # Footer
    html_parts.append('''
            </div>
        </div>
        <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: #78716c; font-weight: 700;">
            💡 Green = Correct • Red = Wrong • Yellow = Skipped
        </div>
    </div>
    ''')
    
    return ''.join(html_parts)

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 AKSHARA - 7 HOUR CHECKPOINT SERVER")
    print("="*60)
    print("📊 Core Pipeline:")
    print("   1. Whisper ASR (Speech-to-Text)")
    print("   2. difflib (Word Matching)")
    print("   3. WCPM Calculation (Speed)")
    print("   4. Accuracy Percentage")
    print("   5. Prosody Score (Fluency)")
    print("="*60)
    print("🌐 Server starting on http://127.0.0.1:5000")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000)
