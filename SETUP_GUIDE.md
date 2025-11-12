# Akshara - Setup & Troubleshooting Guide

## 🔧 Current Issues & Solutions

### ❌ Problem: Python 3.14 Compatibility
The current virtual environment is using Python 3.14, which is **too new** for several required libraries:
- `numba` (required by `librosa`) only supports Python 3.10-3.13
- This causes the Flask backend to fail

### ✅ Solution Options:

#### Option 1: Install Python 3.11 (RECOMMENDED)
1. Download Python 3.11 from https://www.python.org/downloads/
2. Install it (make sure to check "Add to PATH")
3. Create a new virtual environment:
```powershell
# Remove old venv
Remove-Item -Recurse -Force .venv

# Create new venv with Python 3.11
python3.11 -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
pip install imageio-ffmpeg
```

#### Option 2: Use the Simplified Backend (CURRENT)
I've created `app_simple.py` that works without librosa/myprosody but still provides:
- ✅ Automatic Speech Recognition (Whisper)
- ✅ Accuracy calculation (word-by-word comparison)
- ✅ Speed (WCPM) calculation
- ✅ Simplified prosody estimation
- ✅ Full report generation

To use it:
```powershell
# Make sure you have Python 3.10 or 3.11
# Install dependencies (if not already done)
pip install flask flask-cors pymongo transformers torch soundfile pydub imageio-ffmpeg sentencepiece accelerate

# Run the simplified backend
python app_simple.py
```

## 📋 Complete Setup Steps

### 1. Backend Setup (Flask + MongoDB)

#### Start MongoDB
```powershell
# If MongoDB is installed as a service, it should already be running
# Check if it's running:
netstat -ano | findstr :27017

# If not running, start it:
# - Open MongoDB Compass, or
# - Start the MongoDB service from Windows Services
```

#### Seed the Database
```powershell
python seed_db.py
```

#### Start Flask Server
```powershell
# Option A: Use simplified version (works now)
python app_simple.py

# Option B: Use full version (requires Python 3.11)
python app.py
```

You should see:
```
✓ FFmpeg configured
✓ MongoDB connection successful
✓ ASR Model loaded successfully
🚀 Starting Akshara Flask Server
```

### 2. Frontend Setup (React)

```powershell
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm start
```

Frontend will open at: http://localhost:3000

## 🎨 Improved Frontend

I've created an enhanced UI in `frontend/src/app_improved.jsx` with:

### New Features:
- ✅ **Professional Design** - Modern gradient header, card-based layout
- ✅ **Real-time Timer** - Shows recording duration prominently
- ✅ **Better Workflow** - Clear step-by-step process
- ✅ **Visual Feedback** - Loading states, animations, status indicators
- ✅ **Metric Cards** - Beautiful display of Speed, Accuracy, Prosody
- ✅ **Assessment History** - Clean table view of past assessments
- ✅ **Error Handling** - Clear error messages with dismissible alerts
- ✅ **60-second Warning** - Alerts teacher when reaching 60 seconds
- ✅ **Responsive Design** - Works on tablets and laptops

### To Use the Improved Frontend:
```powershell
cd frontend/src

# Backup old file
Copy-Item app.jsx app_old.jsx

# Replace with improved version
Copy-Item app_improved.jsx app.jsx
```

Then refresh your browser!

## 🐛 Common Error Solutions

### Error: "Cannot install on Python version 3.14"
**Solution:** Install Python 3.11 (see Option 1 above)

### Error: "FFmpeg not found"
**Solution:** Already installed via `imageio-ffmpeg`! Just make sure it's in requirements:
```powershell
pip install imageio-ffmpeg
```

### Error: "Could not load passages"
**Causes:**
1. Flask backend not running
2. MongoDB not running
3. Database not seeded

**Solution:**
```powershell
# Check Flask
netstat -ano | findstr :5000

# Check MongoDB
netstat -ano | findstr :27017

# Seed database
python seed_db.py
```

### Error: "Analysis failed" or timeout
**Causes:**
1. First-time Whisper model download (3-4 minutes)
2. Audio conversion issues
3. Python version incompatibility

**Solution:**
- Wait for initial model download
- Check Flask terminal for detailed errors
- Verify ffmpeg is configured

### Error: "Could not start recording"
**Solution:** Grant microphone permissions in browser
- Chrome: Settings → Privacy → Site Settings → Microphone
- Allow http://localhost:3000

## 🔄 Current Workflow

### For Teachers:
1. Open http://localhost:3000
2. Select reading level from dropdown
3. Student sees passage on screen
4. Click "Start Recording"  
5. Student reads for ~60 seconds
6. Click "Stop Recording"
7. Click "Analyze Reading"
8. Wait 30-60 seconds (AI processing)
9. View comprehensive 3-factor report:
   - **Speed:** Words Correct Per Minute (WCPM)
   - **Accuracy:** Percentage + word-by-word comparison
   - **Prosody:** Fluency rating
10. View history tab for past assessments

## 📊 What the Analysis Provides

### Speed (WCPM)
- Industry-standard metric for reading fluency
- Calculates words read correctly per minute
- Adjusts for audio duration

### Accuracy
- Uses difflib for sequence matching
- Identifies omissions, substitutions, insertions
- Provides color-coded word-by-word comparison
- Shows percentage match

### Prosody (Expression)
- Simplified version: Based on speaking rate
  - Very Choppy: < 1.0 words/sec
  - Choppy: 1.0-1.5 words/sec
  - Good: 1.5-2.5 words/sec
  - Fluent: 2.5-3.5 words/sec
  - Very Fast: > 3.5 words/sec
  
- Full version (requires myprosody): Analyzes pitch, rhythm, pauses

## 🚀 Next Steps

### To Get Full Functionality:
1. **Install Python 3.11** (instead of 3.14)
2. **Reinstall all packages**
3. **Use original `app.py`** for full prosody analysis

### To Deploy:
1. **Build frontend:**
   ```powershell
   cd frontend
   npm run build
   ```

2. **Configure production MongoDB**
3. **Set environment variables**
4. **Deploy to cloud** (Heroku, AWS, Azure, etc.)

## 💡 Tips for Teachers

### Recording Best Practices:
- Use a quiet room
- Position microphone 6-12 inches from student
- Use headset mic for best quality
- Let student practice reading passage first
- Aim for 60 seconds of reading

### Interpreting Results:
- **WCPM Benchmarks (Grade 1-3):**
  - Grade 1 End of Year: 40-60 WCPM
  - Grade 2 End of Year: 80-100 WCPM
  - Grade 3 End of Year: 100-120 WCPM

- **Accuracy:**
  - 95%+ = Independent level
  - 90-94% = Instructional level
  - <90% = Frustration level

- **Prosody:**
  - Good/Fluent = Comprehending
  - Choppy = Still decoding
  - Very Fast = May be skipping/guessing

## 📞 Still Having Issues?

Check the Flask terminal output - it shows detailed error messages with emoji indicators:
- ✓ = Success
- ⚠ = Warning
- ✗ = Error
- 📝/🎤/🔍/⏱/🎭 = Progress indicators

The simplified backend (`app_simple.py`) provides extensive logging to help diagnose issues.
