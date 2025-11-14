# Alternative app.py that works with Python 3.14
# Uses wave module instead of pydub for audio handling

import difflib
import json
from flask import Flask, request, jsonify, send_from_directory, send_file
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
import base64
import io
import requests
from werkzeug.security import generate_password_hash, check_password_hash
warnings.filterwarnings('ignore')

# TTS imports
try:
    from gtts import gTTS
    TTS_AVAILABLE = True
    print("✓ gTTS available for text-to-speech")
except ImportError:
    TTS_AVAILABLE = False
    print("⚠ gTTS not installed. Install with: pip install gtts")

# Audio analysis imports
try:
    import librosa
    import numpy as np
    LIBROSA_AVAILABLE = True
    print("✓ librosa available for expression analysis")
except ImportError:
    LIBROSA_AVAILABLE = False
    print("⚠ librosa not installed. Install with: pip install librosa")

# Phonetic matching imports for Miscue Analysis
try:
    import phonetics
    from metaphone import doublemetaphone
    PHONETICS_AVAILABLE = True
    print("✓ Phonetic Miscue Engine available")
except ImportError:
    PHONETICS_AVAILABLE = False
    print("⚠ Phonetics library not installed. Install with: pip install phonetics metaphone")

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
db = None
reports_collection = None
passages_collection = None
students_collection = None
users_collection = None
mongo_connected = False

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()
    db = client['akshara']
    reports_collection = db['reports']
    passages_collection = db['passages']
    students_collection = db['students']
    users_collection = db['users']
    mongo_connected = True
    print("✓ MongoDB connection successful.")
    
    # Check if passages collection is empty and seed it
    passage_count = passages_collection.count_documents({})
    if passage_count == 0:
        print("📚 Seeding passages collection with default stories...")
        default_passages = [
            {"level": "Grade 1", "title": "The Cat", "text": "The cat sat on the mat. The cat was fat. The cat wore a hat."},
            {"level": "Grade 2", "title": "The Fox", "text": "The quick brown fox jumps over the lazy dog. The fox runs fast in the woods."},
            {"level": "Grade 3", "title": "Reading is Fun", "text": "Reading helps us learn new things and explore different worlds. Books take us on amazing adventures."},
            {"level": "Grade 4", "title": "The Ocean", "text": "The ocean is home to many wonderful creatures. Dolphins swim gracefully through the blue water. Colorful fish dart between coral reefs."},
            {"level": "Grade 5", "title": "Space Adventure", "text": "The astronauts prepared for their journey to the stars. They checked their equipment carefully before entering the spacecraft. The mission would take them to explore distant planets and galaxies."}
        ]
        passages_collection.insert_many(default_passages)
        print(f"✓ Successfully seeded {len(default_passages)} passages into MongoDB")
    else:
        print(f"✓ Found {passage_count} passages in MongoDB")
        
except Exception as e:
    print(f"✗ MongoDB connection failed: {e}")
    print("  ⚠ Running without MongoDB - reports won't be saved")
    mongo_connected = False

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
    # Enable word timestamps for word-level analysis
    asr_pipeline = pipeline(
        "automatic-speech-recognition", 
        model="openai/whisper-base.en",
        return_timestamps="word"  # Enable word-level timestamps
    )
    print("✓ ASR Model loaded successfully with word-level timestamps.")
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


def build_word_analysis(ground_truth_words, asr_words, word_chunks, sequence_matcher):
    """
    Build word-level analysis for interactive playback.
    Maps each ground truth word to its status, timestamps, and student pronunciation.
    """
    word_analysis = []
    
    # Create a mapping of asr words to their timestamps
    asr_word_map = {}
    for chunk in word_chunks:
        word = chunk.get("text", "").strip().lower()
        timestamp = chunk.get("timestamp", [0, 0])
        if word:
            if word not in asr_word_map:
                asr_word_map[word] = []
            asr_word_map[word].append({
                "start": timestamp[0] if timestamp[0] is not None else 0,
                "end": timestamp[1] if timestamp[1] is not None else 0
            })
    
    # Analyze each ground truth word
    asr_index = 0
    for i, gt_word in enumerate(ground_truth_words):
        word_data = {
            "index": i,
            "word": gt_word,
            "status": "skipped",  # correct, incorrect, approximate, skipped
            "confidence": 0,
            "student_start": None,
            "student_end": None,
            "student_word": None
        }
        
        # Find matching operation in sequence matcher
        for tag, i1, i2, j1, j2 in sequence_matcher.get_opcodes():
            if i >= i1 and i < i2:
                if tag == 'equal':
                    # Correct word
                    word_data["status"] = "correct"
                    word_data["confidence"] = 100
                    if j1 + (i - i1) < len(asr_words):
                        student_word = asr_words[j1 + (i - i1)]
                        word_data["student_word"] = student_word
                        # Get timestamp
                        if student_word in asr_word_map and asr_word_map[student_word]:
                            timestamps = asr_word_map[student_word].pop(0)
                            word_data["student_start"] = timestamps["start"]
                            word_data["student_end"] = timestamps["end"]
                elif tag == 'replace':
                    # 🎯 PHONETIC MISCUE ENGINE - Advanced error analysis
                    if j1 + (i - i1) < len(asr_words):
                        student_word = asr_words[j1 + (i - i1)]
                        word_data["student_word"] = student_word
                        
                        # First: Check for exact equivalence (like "8" vs "eight")
                        if words_match(gt_word, student_word):
                            word_data["status"] = "correct"
                            word_data["confidence"] = 100
                            word_data["error_type"] = "none"
                        else:
                            # Second: Run Phonetic Miscue Engine
                            phonetic_match = phonetic_similarity(gt_word, student_word)
                            
                            if phonetic_match['is_similar']:
                                # PHONETIC MATCH - "Good Error"
                                word_data["status"] = "phonetic_match"
                                word_data["confidence"] = phonetic_match['confidence']
                                word_data["error_type"] = "phonetic"
                                word_data["phonetic_analysis"] = {
                                    "match_type": phonetic_match['match_type'],
                                    "algorithms": phonetic_match.get('algorithms', []),
                                    "teaching_moment": True,
                                    "note": f"Student applied phonics: '{student_word}' sounds like '{gt_word}'"
                                }
                                print(f"   🎯 PHONETIC MATCH: '{student_word}' → '{gt_word}' (Confidence: {phonetic_match['confidence']}%)")
                            else:
                                # True substitution error
                                word_data["status"] = "incorrect"
                                word_data["confidence"] = 30
                                word_data["error_type"] = "substitution"
                        
                        # Get timestamp
                        if student_word in asr_word_map and asr_word_map[student_word]:
                            timestamps = asr_word_map[student_word].pop(0)
                            word_data["student_start"] = timestamps["start"]
                            word_data["student_end"] = timestamps["end"]
                elif tag == 'delete':
                    # Skipped word
                    word_data["status"] = "skipped"
                    word_data["confidence"] = 0
                break
        
        word_analysis.append(word_data)
    
    return word_analysis


def normalize_word(word):
    """
    Normalize words to handle common variations:
    - Numbers to words (8 -> eight, 1 -> one)
    - Words to numbers (eight -> 8, one -> 1)
    - Common phonetic equivalents
    - Remove punctuation
    """
    # Remove punctuation and convert to lowercase
    word_clean = word.lower().strip().rstrip('.,!?;:')
    
    # Number to word mapping (both directions)
    number_word_map = {
        '0': 'zero', 'zero': '0',
        '1': 'one', 'one': '1',
        '2': 'two', 'two': '2',
        '3': 'three', 'three': '3',
        '4': 'four', 'four': '4',
        '5': 'five', 'five': '5',
        '6': 'six', 'six': '6',
        '7': 'seven', 'seven': '7',
        '8': 'eight', 'eight': '8',
        '9': 'nine', 'nine': '9',
        '10': 'ten', 'ten': '10',
        '11': 'eleven', 'eleven': '11',
        '12': 'twelve', 'twelve': '12',
        '13': 'thirteen', 'thirteen': '13',
        '14': 'fourteen', 'fourteen': '14',
        '15': 'fifteen', 'fifteen': '15',
        '16': 'sixteen', 'sixteen': '16',
        '17': 'seventeen', 'seventeen': '17',
        '18': 'eighteen', 'eighteen': '18',
        '19': 'nineteen', 'nineteen': '19',
        '20': 'twenty', 'twenty': '20',
    }
    
    # Return list of possible normalized forms
    variations = [word_clean]
    
    if word_clean in number_word_map:
        variations.append(number_word_map[word_clean])
    
    return variations


def words_match(word1, word2):
    """
    Check if two words match, considering variations like numbers/words.
    Returns True if words are equivalent.
    """
    # Get all variations of both words
    variations1 = normalize_word(word1)
    variations2 = normalize_word(word2)
    
    # Check if any variation matches
    for v1 in variations1:
        for v2 in variations2:
            if v1 == v2:
                return True
    
    return False


def phonetic_similarity(word1, word2):
    """
    🎯 PHONETIC MISCUE ENGINE
    
    Analyzes if two words sound similar using multiple phonetic algorithms.
    This identifies "good errors" where students are applying phonics correctly.
    
    Examples:
        - 'boot' vs 'boat' → Phonetically similar (good error)
        - 'cat' vs 'dog' → Not similar (substitution error)
        - 'running' vs 'runing' → Similar (spelling variation)
    
    Returns:
        dict with similarity score and analysis
    """
    if not PHONETICS_AVAILABLE:
        return {
            'is_similar': False,
            'confidence': 0,
            'match_type': 'none',
            'message': 'Phonetic engine not available'
        }
    
    # Clean words
    w1 = word1.lower().strip().rstrip('.,!?;:')
    w2 = word2.lower().strip().rstrip('.,!?;:')
    
    # Exact match
    if w1 == w2:
        return {
            'is_similar': True,
            'confidence': 100,
            'match_type': 'exact',
            'algorithms': []
        }
    
    matches = []
    algorithms_used = []
    
    # 1. Soundex (American English phonetics)
    try:
        soundex1 = phonetics.soundex(w1)
        soundex2 = phonetics.soundex(w2)
        if soundex1 == soundex2:
            matches.append('soundex')
            algorithms_used.append(f"Soundex: {soundex1}")
    except:
        pass
    
    # 2. Metaphone (Better for English pronunciation)
    try:
        metaphone1 = phonetics.metaphone(w1)
        metaphone2 = phonetics.metaphone(w2)
        if metaphone1 == metaphone2:
            matches.append('metaphone')
            algorithms_used.append(f"Metaphone: {metaphone1}")
    except:
        pass
    
    # 3. Double Metaphone (Most accurate for English)
    try:
        dm1 = doublemetaphone(w1)
        dm2 = doublemetaphone(w2)
        # Check both primary and secondary encodings
        if (dm1[0] == dm2[0] and dm1[0]) or (dm1[1] == dm2[1] and dm1[1]):
            matches.append('double_metaphone')
            algorithms_used.append(f"DoubleMetaphone: {dm1[0]}/{dm2[0]}")
    except:
        pass
    
    # 4. NYSIIS (New York State Identification and Intelligence System)
    try:
        nysiis1 = phonetics.nysiis(w1)
        nysiis2 = phonetics.nysiis(w2)
        if nysiis1 == nysiis2:
            matches.append('nysiis')
            algorithms_used.append(f"NYSIIS: {nysiis1}")
    except:
        pass
    
    # Calculate confidence based on number of algorithms that matched
    num_matches = len(matches)
    
    if num_matches >= 3:
        # 3+ algorithms agree → High confidence phonetic match
        return {
            'is_similar': True,
            'confidence': 95,
            'match_type': 'strong_phonetic',
            'algorithms': algorithms_used,
            'matches': matches
        }
    elif num_matches == 2:
        # 2 algorithms agree → Moderate confidence
        return {
            'is_similar': True,
            'confidence': 75,
            'match_type': 'moderate_phonetic',
            'algorithms': algorithms_used,
            'matches': matches
        }
    elif num_matches == 1:
        # 1 algorithm matches → Weak phonetic similarity
        return {
            'is_similar': True,
            'confidence': 50,
            'match_type': 'weak_phonetic',
            'algorithms': algorithms_used,
            'matches': matches
        }
    else:
        # No phonetic match
        return {
            'is_similar': False,
            'confidence': 0,
            'match_type': 'none',
            'algorithms': [],
            'matches': []
        }


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
    PAUSE_THRESHOLD = 0.08  # seconds - meaningful pause (80ms - very sensitive for AI-read passages)
    
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
    # NEW APPROACH: Match ASR words to ground truth words to find punctuation
    pauses = []
    matched_pauses = 0
    total_significant_pauses = 0
    
    # Build mapping: for each word_chunk, find its position in ground truth
    print(f"🔍 Matching {len(word_chunks)} ASR words to {len(ground_truth_words)} ground truth words...")
    
    # Create a mapping of ASR word index to ground truth word index
    asr_to_gt_mapping = {}
    gt_index = 0
    
    for asr_idx, chunk in enumerate(word_chunks):
        asr_word = chunk.get('text', '').lower().strip()
        
        # Try to find matching ground truth word (with smart matching)
        found = False
        for offset in range(max(0, gt_index - 2), min(len(ground_truth_words), gt_index + 3)):
            gt_word_raw = ground_truth_words[offset]
            
            # Use smart word matching (handles "8" vs "eight", etc.)
            if words_match(asr_word, gt_word_raw):
                asr_to_gt_mapping[asr_idx] = offset
                gt_index = offset + 1
                found = True
                break
        
        if not found:
            # Word not found or mispronounced - skip mapping
            asr_to_gt_mapping[asr_idx] = -1
    
    print(f"✓ Mapped {len([v for v in asr_to_gt_mapping.values() if v >= 0])} ASR words to ground truth")
    print(f"📊 ASR to GT mapping sample: {dict(list(asr_to_gt_mapping.items())[:5])}")
    
    # Now analyze pauses and check if they align with punctuation
    print(f"\n⏱️  Analyzing pauses (threshold: {PAUSE_THRESHOLD}s = {PAUSE_THRESHOLD*1000}ms)...")
    all_pauses_log = []
    
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
        
        # Log ALL pauses for debugging
        asr_word_text = current_word.get('text', '')
        gt_idx = asr_to_gt_mapping.get(i, -1)
        has_punct = False
        
        if gt_idx >= 0:
            for punct in punctuation_positions:
                if punct['word_index'] == gt_idx:
                    has_punct = True
                    break
        
        all_pauses_log.append({
            'word': asr_word_text,
            'pause_ms': round(pause_duration * 1000, 1),
            'has_punct': has_punct,
            'gt_idx': gt_idx
        })
        
        # Only consider significant pauses
        if pause_duration >= PAUSE_THRESHOLD:
            total_significant_pauses += 1
            
            # Check if current ASR word corresponds to a ground truth word with punctuation
            has_punctuation = False
            expected_punct = None
            
            # Get ground truth index for current ASR word
            gt_idx = asr_to_gt_mapping.get(i, -1)
            
            # Debug: log this pause
            asr_word_text = current_word.get('text', '')
            print(f"   ⏸️  Pause detected: ASR[{i}]='{asr_word_text}' → GT[{gt_idx}] ({pause_duration:.2f}s)")
            
            if gt_idx >= 0:
                # Check if this ground truth word has punctuation
                for punct in punctuation_positions:
                    if punct['word_index'] == gt_idx:
                        has_punctuation = True
                        expected_punct = punct
                        print(f"      ✓ GT word '{punct['word']}' has punctuation '{punct['char']}'")
                        break
                
                if not has_punctuation:
                    gt_word = ground_truth_words[gt_idx] if gt_idx < len(ground_truth_words) else 'N/A'
                    print(f"      ✗ GT word '{gt_word}' has NO punctuation")
            
            pause_info = {
                'asr_word_index': i,
                'gt_word_index': gt_idx,
                'word': asr_word_text,
                'pause_duration': round(pause_duration, 2),
                'has_punctuation': has_punctuation,
                'punctuation': expected_punct['char'] if expected_punct else None
            }
            
            if has_punctuation:
                matched_pauses += 1
                pause_info['matched'] = True
                print(f"      🎯 MATCHED!")
            else:
                pause_info['matched'] = False
            
            pauses.append(pause_info)
    
    # Calculate score based on total expected punctuation marks
    total_expected = len(punctuation_positions)
    punctuation_score = 0
    if total_expected > 0:
        punctuation_score = (matched_pauses / total_expected) * 100
    
    # Detailed pause analysis logging
    print(f"\n📊 PAUSE ANALYSIS SUMMARY:")
    print(f"   Total punctuation marks expected: {total_expected}")
    print(f"   Pauses above threshold ({PAUSE_THRESHOLD*1000}ms): {total_significant_pauses}")
    print(f"   Matched pauses at punctuation: {matched_pauses}")
    print(f"   Score: {round(punctuation_score, 1)}%")
    
    # Show all pauses at punctuation locations (even if too short)
    print(f"\n📍 Pauses at punctuation locations:")
    for log in all_pauses_log:
        if log['has_punct']:
            status = "✓ COUNTED" if log['pause_ms'] >= PAUSE_THRESHOLD * 1000 else "✗ TOO SHORT"
            print(f"   '{log['word']}': {log['pause_ms']}ms {status}")
    
    print(f"✅ Punctuation Score: {matched_pauses}/{total_expected} = {round(punctuation_score, 1)}%\n")
    
    return {
        "punctuation_score": round(punctuation_score, 1),
        "matched_pauses": matched_pauses,
        "total_expected_pauses": total_expected,
        "total_pauses_detected": total_significant_pauses,
        "pause_locations": pauses[:10]  # Send first 10 for debugging
    }


def analyze_expression_and_tone(audio_path):
    """
    Analyze vocal expression, pitch variation, energy, and emotional tone.
    
    This measures how expressively the student reads - monotone vs. dynamic reading.
    
    Returns:
        dict with expression metrics including pitch variation, energy dynamics, 
        emotional engagement score, and reading style assessment
    """
    if not LIBROSA_AVAILABLE:
        return {
            "expression_score": "N/A",
            "pitch_variation": 0,
            "energy_variation": 0,
            "emotional_engagement": "N/A",
            "reading_style": "Unable to analyze",
            "message": "Audio analysis library not available"
        }
    
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=None)
        
        # 1. PITCH ANALYSIS (Fundamental Frequency)
        # Extract pitch using librosa's piptrack
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr, fmin=75, fmax=400)
        
        # Get pitch values where magnitude is highest
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:  # Only non-zero pitches
                pitch_values.append(pitch)
        
        if len(pitch_values) == 0:
            pitch_variation = 0
            avg_pitch = 0
        else:
            pitch_values = np.array(pitch_values)
            avg_pitch = np.mean(pitch_values)
            pitch_std = np.std(pitch_values)
            # Normalize variation (coefficient of variation)
            pitch_variation = (pitch_std / avg_pitch * 100) if avg_pitch > 0 else 0
        
        # 2. ENERGY ANALYSIS (RMS - Root Mean Square)
        rms = librosa.feature.rms(y=y)[0]
        energy_variation = np.std(rms) / np.mean(rms) * 100 if np.mean(rms) > 0 else 0
        
        # 3. SPECTRAL FEATURES (Richness of voice)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_variation = np.std(spectral_centroid) / np.mean(spectral_centroid) * 100
        
        # 4. ZERO CROSSING RATE (Voice dynamics)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        zcr_variation = np.std(zcr) / np.mean(zcr) * 100 if np.mean(zcr) > 0 else 0
        
        # 5. CALCULATE EXPRESSION SCORE (0-100)
        # Weighted combination of variations
        expression_score = (
            pitch_variation * 0.4 +      # Pitch variation is most important
            energy_variation * 0.3 +      # Energy dynamics
            spectral_variation * 0.2 +    # Voice richness
            zcr_variation * 0.1           # Voice dynamics
        )
        
        # Cap at 100 and ensure non-negative
        expression_score = max(0, min(100, expression_score))
        
        # 6. EMOTIONAL ENGAGEMENT ASSESSMENT
        if expression_score < 15:
            emotional_engagement = "Monotone"
            reading_style = "Very flat, minimal expression"
        elif expression_score < 30:
            emotional_engagement = "Somewhat Flat"
            reading_style = "Limited vocal variation"
        elif expression_score < 50:
            emotional_engagement = "Moderate"
            reading_style = "Some expression, could be more dynamic"
        elif expression_score < 70:
            emotional_engagement = "Expressive"
            reading_style = "Good vocal variation and tone"
        else:
            emotional_engagement = "Highly Expressive"
            reading_style = "Excellent expression and emotional engagement"
        
        print(f"🎭 Expression Analysis:")
        print(f"   Expression Score: {round(expression_score, 1)}/100")
        print(f"   Pitch Variation: {round(pitch_variation, 1)}%")
        print(f"   Energy Variation: {round(energy_variation, 1)}%")
        print(f"   Engagement: {emotional_engagement}")
        
        return {
            "expression_score": round(expression_score, 1),
            "pitch_variation": round(pitch_variation, 1),
            "energy_variation": round(energy_variation, 1),
            "spectral_variation": round(spectral_variation, 1),
            "emotional_engagement": emotional_engagement,
            "reading_style": reading_style,
            "avg_pitch_hz": round(avg_pitch, 1) if avg_pitch > 0 else 0
        }
        
    except Exception as e:
        print(f"⚠️ Error in expression analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "expression_score": "Error",
            "pitch_variation": 0,
            "energy_variation": 0,
            "emotional_engagement": "Error",
            "reading_style": "Unable to analyze",
            "message": str(e)
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
        # Use return_timestamps="word" to get word-level timestamps for punctuation analysis and word playback
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

    # 2. ACCURACY (Miscue Analysis with smart word matching)
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
    
    # Normalize both word lists (handle numbers, variations)
    # But keep originals for display purposes
    ground_truth_normalized = []
    asr_normalized = []
    
    for word in ground_truth_words:
        variations = normalize_word(word)
        ground_truth_normalized.append(variations[0])  # Use primary variation
    
    for word in asr_words:
        variations = normalize_word(word)
        asr_normalized.append(variations[0])  # Use primary variation
    
    # Use normalized words for comparison
    s = difflib.SequenceMatcher(None, ground_truth_normalized, asr_normalized)
    
    # 🎯 PHONETIC MISCUE ENGINE - Advanced accuracy calculation
    correct_matches = 0
    phonetic_matches = 0
    phonetic_details = []
    
    for tag, i1, i2, j1, j2 in s.get_opcodes():
        if tag == 'equal':
            correct_matches += (i2 - i1)
        elif tag == 'replace':
            # Check replaced words with Phonetic Miscue Engine
            for gt_idx, asr_idx in zip(range(i1, i2), range(j1, j2)):
                if gt_idx < len(ground_truth_words) and asr_idx < len(asr_words):
                    gt_word = ground_truth_words[gt_idx]
                    asr_word = asr_words[asr_idx]
                    
                    # First: Check exact equivalence (like "8" vs "eight")
                    if words_match(gt_word, asr_word):
                        correct_matches += 1
                    else:
                        # Second: Check phonetic similarity
                        phonetic_match = phonetic_similarity(gt_word, asr_word)
                        if phonetic_match['is_similar']:
                            # Count phonetic matches as partial credit
                            phonetic_matches += 1
                            phonetic_details.append({
                                'expected': gt_word,
                                'said': asr_word,
                                'confidence': phonetic_match['confidence'],
                                'type': phonetic_match['match_type']
                            })
                            print(f"   🎯 Phonetic Match: '{asr_word}' → '{gt_word}' ({phonetic_match['match_type']})")
    
    # Calculate accuracy: 100% for correct, 80% credit for phonetic matches
    total_correct_score = correct_matches + (phonetic_matches * 0.8)
    accuracy_percent = (total_correct_score / len(ground_truth_words) * 100) if len(ground_truth_words) > 0 else 0
    
    print(f"✓ Exact matches: {correct_matches}/{len(ground_truth_words)}")
    print(f"🎯 Phonetic matches: {phonetic_matches} (good errors - applying phonics)")
    print(f"📊 Total accuracy: {round(accuracy_percent, 1)}%")
    
    # Still use original SequenceMatcher for opcodes (visual display)
    s = difflib.SequenceMatcher(None, ground_truth_words, asr_words)
    accuracy_percent_display = s.ratio() * 100
    
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
    
    # 6. EXPRESSION & TONE ANALYSIS (NEW!)
    # Measures vocal expression, pitch variation, emotional engagement
    print("🎤 Analyzing Expression & Tone...")
    expression_analysis = analyze_expression_and_tone(audio_path)
    
    print("✅ Analysis complete.")
    
    # Build word-level analysis for interactive playback
    word_analysis = build_word_analysis(ground_truth_words, asr_words, word_chunks, s)

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
        # NEW: Expression & Tone Analysis
        "expression_score": expression_analysis["expression_score"],
        "expression_details": {
            "pitch_variation": expression_analysis["pitch_variation"],
            "energy_variation": expression_analysis["energy_variation"],
            "emotional_engagement": expression_analysis["emotional_engagement"],
            "reading_style": expression_analysis["reading_style"],
            "spectral_variation": expression_analysis.get("spectral_variation", 0),
            "avg_pitch_hz": expression_analysis.get("avg_pitch_hz", 0)
        },
        # 🎯 PHONETIC MISCUE ENGINE - "Good Errors" Analysis
        "phonetic_matches": phonetic_matches,
        "phonetic_details": phonetic_details,
        "exact_matches": correct_matches,
        "miscue_analysis": {
            "total_errors": len(ground_truth_words) - correct_matches - phonetic_matches,
            "phonetic_errors": phonetic_matches,  # Good errors - applying phonics
            "substitution_errors": len(ground_truth_words) - correct_matches - phonetic_matches,  # True errors
            "teaching_moments": phonetic_details  # Detailed list for teacher review
        },
        "word_analysis": word_analysis,  # New: word-level data for interactive playback
        "audio_path": audio_path,  # Store audio path for word extraction
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
                
                # Convert prosody_score string to numeric value
                prosody_score_str = report.get('prosody_score', 'Good')
                prosody_map = {
                    'Very Choppy': 20,
                    'Choppy': 40,
                    'Good': 60,
                    'Fluent': 80,
                    'Very Fast': 70  # Fast but might not be ideal
                }
                fluency = prosody_map.get(prosody_score_str, 60)  # Default to 60
                
                # Get current student level
                student = students_collection.find_one({"name": student_name})
                if student:
                    current_level = int(student.get('current_level', 1))
                    
                    # Level up if both accuracy and fluency are good (>=90% accuracy, >=70 fluency)
                    if accuracy >= 90 and fluency >= 70:
                        new_level = min(current_level + 1, 4)  # Max level 4
                        if new_level != current_level:
                            students_collection.update_one(
                                {"name": student_name},
                                {"$set": {"current_level": new_level, "updated_at": datetime.now()}}
                            )
                            print(f"📈 Student level increased: {current_level} → {new_level}")
                    
                    # Level down if performance is poor (accuracy <70% or fluency <40)
                    elif (accuracy < 70 or fluency < 40) and current_level > 1:
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


@app.route('/api/passages', methods=['GET'])
def get_passages():
    """
    Fetches all reading passages from the database.
    """
    try:
        print("📖 GET /api/passages - Fetching passages...")
        
        if not mongo_connected or passages_collection is None:
            print("⚠ MongoDB not available, returning error")
            return jsonify({"error": "Database not connected. Please check MongoDB."}), 500
        
        passages = []
        for passage in passages_collection.find():
            passage['_id'] = str(passage['_id'])
            passages.append(passage)
        
        print(f"✓ Returning {len(passages)} passages from MongoDB")
        return jsonify(passages)
    except Exception as e:
        print(f"✗ Error in get_passages: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/passages/custom', methods=['POST'])
def add_custom_passage():
    """
    Add a new custom passage to the database.
    """
    try:
        print("📝 POST /api/passages/custom - Adding new passage...")
        
        if not mongo_connected or passages_collection is None:
            print("⚠ MongoDB not available, returning error")
            return jsonify({"error": "Database not connected. Please check MongoDB."}), 500
        
        data = request.get_json()
        title = data.get('title', '').strip()
        level = data.get('level', 'Level 1').strip()
        text = data.get('text', '').strip()
        
        if not title or not text:
            return jsonify({"error": "Title and text are required"}), 400
        
        # Create passage document
        passage = {
            'title': title,
            'level': level,
            'text': text,
            'created_at': datetime.now()
        }
        
        result = passages_collection.insert_one(passage)
        passage['_id'] = str(result.inserted_id)
        
        print(f"✓ Added new passage: {title} ({level})")
        return jsonify({"message": "Passage added successfully", "passage": passage}), 201
        
    except Exception as e:
        print(f"✗ Error in add_custom_passage: {e}")
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


@app.route('/api/students', methods=['GET'])
def get_students():
    """
    Get all students with their latest assessment metrics.
    Groups reports by student_name and returns summary data.
    """
    try:
        # Aggregate to get latest assessment per student
        pipeline = [
            {
                '$match': {
                    'student_name': {'$exists': True, '$ne': None, '$ne': ''}
                }
            },
            {
                '$sort': {'created_at': -1}
            },
            {
                '$group': {
                    '_id': '$student_name',
                    'lastTestDate': {'$first': '$created_at'},
                    'wcpm': {'$first': '$wcpm'},
                    'accuracy': {'$first': '$accuracy_percent'},
                    'prosody': {'$first': '$prosody_score'},
                    'studentId': {'$first': '$student_id'},
                    'grade': {'$first': '$student_grade'},
                    'totalAssessments': {'$sum': 1}
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'name': '$_id',
                    'studentId': 1,
                    'grade': 1,
                    'lastTestDate': 1,
                    'wcpm': 1,
                    'accuracy': 1,
                    'prosody': 1,
                    'totalAssessments': 1
                }
            },
            {
                '$sort': {'name': 1}
            }
        ]
        
        students = list(reports_collection.aggregate(pipeline))
        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/students/<student_name>/assessments', methods=['GET'])
def get_student_assessments(student_name):
    """
    Get all assessments for a specific student.
    """
    try:
        assessments = []
        for report in reports_collection.find({
            'student_name': student_name
        }).sort("created_at", 1):
            report['_id'] = str(report['_id'])
            if 'passage_id' in report:
                report['passage_id'] = str(report['passage_id'])
            assessments.append(report)
        
        return jsonify(assessments)
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
        print('DEBUG auth_login: received data ->', data)
        if data is None:
            print('DEBUG auth_login: missing JSON body')
            return jsonify({"error": "Invalid or missing JSON body."}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        print(f'DEBUG auth_login: email={email}, password_length={len(password)}')
        
        if not email or not password:
            print('DEBUG auth_login: email or password missing')
            return jsonify({"error": "Email and password are required."}), 400

        if not mongo_connected:
            print('DEBUG auth_login: MongoDB not connected')
            return jsonify({"error": "Database not available."}), 500

        user = users_collection.find_one({"email": email})
        print(f'DEBUG auth_login: user found = {user is not None}')
        
        if not user:
            print(f'DEBUG auth_login: No user found with email {email}')
            return jsonify({"error": "Invalid credentials."}), 401
        
        # Defensive: handle old user documents that might not have password_hash
        if 'password_hash' not in user:
            print(f'WARNING: User {email} has no password_hash field - old document?')
            return jsonify({"error": "Invalid credentials."}), 401

        # Verify password
        try:
            password_valid = check_password_hash(user['password_hash'], password)
            print(f'DEBUG auth_login: password valid = {password_valid}')
            if not password_valid:
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
    3. Calculate total students (including uploaded roster), avg WCPM, and avg accuracy across class
    """
    try:
        teacher_id = request.args.get('teacher_id', 'default_teacher')
        
        # Get total students from roster (includes students who haven't taken tests yet)
        total_roster_students = students_collection.count_documents({"teacher_id": teacher_id})
        
        # Get unique students from reports who have taken tests
        pipeline = [
            # Step 1: Sort by created_at descending to prioritize recent reports
            {"$sort": {"created_at": -1}},
            
            # Step 2: Group by student_name, get first (most recent) report's wcpm and accuracy
            {"$group": {
                "_id": "$student_name",
                "wcpm": {"$first": "$wcpm"},
                "accuracy_percent": {"$first": "$accuracy_percent"}
            }},
            
            # Step 3: Calculate class-level statistics for students with assessments
            {"$group": {
                "_id": None,
                "studentsWithAssessments": {"$sum": 1},
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
            
            # Total students includes both roster students and any students from reports not in roster
            # Get students from reports not in roster
            roster_student_names = set(s['name'] for s in students_collection.find({"teacher_id": teacher_id}, {"name": 1}))
            report_student_names = reports_collection.distinct("student_name")
            additional_students = len([name for name in report_student_names if name and name not in roster_student_names])
            
            stats['totalStudents'] = total_roster_students + additional_students
            stats['studentsWithAssessments'] = stats.get('studentsWithAssessments', 0)
            return jsonify(stats)
        else:
            # No assessments yet, but may have roster students
            return jsonify({
                "totalStudents": total_roster_students,
                "studentsWithAssessments": 0,
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


@app.route('/api/students/list', methods=['GET'])
def get_students_list():
    """Get all students for a teacher - combines uploaded roster and students from reports"""
    try:
        teacher_id = request.args.get('teacher_id', 'default_teacher')
        
        # Get students from uploaded roster
        roster_students = list(students_collection.find(
            {"teacher_id": teacher_id}
        ).sort("name", 1))
        
        # Convert ObjectId to string
        for student in roster_students:
            student['_id'] = str(student['_id'])
        
        # Get unique students from reports collection (those who have taken tests)
        # Use aggregation to get distinct student names from reports
        report_students_pipeline = [
            {"$match": {"student_name": {"$exists": True, "$ne": ""}}},
            {"$group": {
                "_id": "$student_name",
                "name": {"$first": "$student_name"},
                "grade": {"$first": "$student_grade"},
                "student_id": {"$first": "$student_id"}
            }},
            {"$sort": {"name": 1}}
        ]
        
        report_students = list(reports_collection.aggregate(report_students_pipeline))
        
        # Combine both lists, avoiding duplicates
        students_map = {}
        
        # Add roster students first (they have priority if duplicate)
        for student in roster_students:
            students_map[student['name']] = student
        
        # Add report students if not already in roster
        for student in report_students:
            student_name = student['name']
            if student_name not in students_map:
                # Create a student record from report data
                students_map[student_name] = {
                    '_id': str(student['_id']),
                    'name': student_name,
                    'grade': student.get('grade', ''),
                    'student_id': student.get('student_id', ''),
                    'teacher_id': teacher_id,
                    'source': 'reports'  # Indicate this came from reports, not roster
                }
        
        # Convert map back to list and sort
        combined_students = sorted(students_map.values(), key=lambda x: x['name'])
        
        return jsonify(combined_students)
        
    except Exception as e:
        print(f"ERROR in get_students: {e}")
        import traceback
        traceback.print_exc()
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




@app.route('/api/word/pronounce/<word>', methods=['GET', 'OPTIONS'])
def pronounce_word(word):
    """
    Generate TTS pronunciation for a word
    """
    if request.method == 'OPTIONS':
        return '', 200
        
    if not TTS_AVAILABLE:
        print("✗ TTS not available - gTTS not installed")
        return jsonify({"error": "TTS not available. Please install gTTS: pip install gtts"}), 500
    
    try:
        print(f"🔊 Generating pronunciation for word: '{word}'")
        
        # Generate speech using gTTS
        tts = gTTS(text=word, lang='en', slow=False)
        
        # Save to bytes buffer
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        print(f"✓ Successfully generated pronunciation for: '{word}'")
        return send_file(mp3_fp, mimetype='audio/mpeg', as_attachment=False, download_name=f'{word}.mp3')
    except Exception as e:
        print(f"✗ TTS Error for word '{word}': {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/word/image/<word>', methods=['GET'])
def get_word_image(word):
    """
    Get a pictorial representation of a word.
    Uses Noun Project API or similar. For now, returns a placeholder.
    """
    try:
        # For demo: Use DuckDuckGo Image Search or Unsplash API
        # Simplified: Return a simple icon URL from a CDN
        # You can integrate with APIs like:
        # - Noun Project API
        # - Unsplash API
        # - Local image database
        
        # For now, return emoji-based representation or placeholder
        word_lower = word.lower()
        
        # Simple word-to-emoji mapping for common words
        emoji_map = {
            "cat": "🐱", "dog": "🐶", "fox": "🦊", "bird": "🐦",
            "book": "📖", "read": "📚", "sun": "☀️", "moon": "🌙",
            "tree": "🌳", "flower": "🌸", "water": "💧", "ocean": "🌊",
            "star": "⭐", "rocket": "🚀", "astronaut": "👨‍🚀",
            "dolphin": "🐬", "fish": "🐠", "coral": "🪸",
            "hat": "🎩", "mat": "🧘", "jump": "🤸", "run": "🏃"
        }
        
        emoji = emoji_map.get(word_lower, "📝")  # Default to pencil emoji
        
        return jsonify({
            "word": word,
            "emoji": emoji,
            "imageUrl": f"https://via.placeholder.com/150?text={emoji}",
            "definition": f"The word '{word}'"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/word/extract-audio', methods=['POST'])
def extract_word_audio():
    """
    Extract a specific word's audio segment from the full recording
    """
    try:
        data = request.json
        audio_path = data.get('audio_path')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if not all([audio_path, start_time is not None, end_time is not None]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        if not os.path.exists(audio_path):
            return jsonify({"error": "Audio file not found"}), 404
        
        # Load the full audio
        audio_data, sample_rate = sf.read(audio_path)
        
        # Extract the segment
        start_sample = int(start_time * sample_rate)
        end_sample = int(end_time * sample_rate)
        
        # Ensure bounds
        start_sample = max(0, start_sample)
        end_sample = min(len(audio_data), end_sample)
        
        word_audio = audio_data[start_sample:end_sample]
        
        # Save to temporary file and return
        temp_path = f"temp_word_{os.getpid()}.wav"
        sf.write(temp_path, word_audio, sample_rate)
        
        # Read as base64
        with open(temp_path, 'rb') as f:
            audio_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify({
            "audio": f"data:audio/wav;base64,{audio_base64}"
        })
    except Exception as e:
        print(f"✗ Word extraction error: {e}")
        return jsonify({"error": str(e)}), 500


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
