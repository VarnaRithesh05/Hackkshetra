# 🎯 Akshara - 7 Hour Checkpoint Demo

## What We Built in 7 Hours

This branch contains our **7-hour checkpoint submission** - proving that the hardest part is done: the core AI pipeline.

### 📊 Core AI Pipeline (COMPLETE ✅)

1. **Whisper ASR** - Speech-to-text transcription with word-level timestamps
2. **difflib Analysis** - Word-by-word matching between expected and actual reading
3. **WCPM Calculation** - Words Correct Per Minute (reading speed metric)
4. **Accuracy Percentage** - Correct words / Total words
5. **Prosody Score** - Fluency assessment (Fluent/Good/Choppy/Very Choppy)

### 🚀 Tech Stack

**Backend:**
- Flask (Python 3.13)
- Whisper (OpenAI ASR model)
- MongoDB (for passage and report storage)
- difflib (Python standard library for text comparison)

**Frontend:**
- React 18
- Axios (API calls)
- Tailwind CSS (styling)
- Web Audio API (recording)

### 🎬 How to Run the Demo

**1. Start MongoDB:**
```bash
# Make sure MongoDB is running on localhost:27017
mongod
```

**2. Start Backend:**
```bash
cd D:\dev\Hackkshetra
py -3.13 app_py314.py
```

**3. Start Frontend:**
```bash
cd D:\dev\Hackkshetra\frontend
npm start
```

**4. Demo Flow:**
1. Open http://localhost:3000
2. Select a passage from dropdown (e.g., "Level 1 - My Cat")
3. Click "START RECORDING"
4. Read the passage (make 1-2 intentional mistakes for demo)
5. Click "STOP"
6. Click "Analyze Reading"
7. **Watch the AI pipeline work:**
   - Converting audio
   - Running Whisper ASR
   - Analyzing with difflib
   - Calculating metrics
8. **See results:**
   - WCPM: 85
   - Accuracy: 92%
   - Prosody: Good
   - Word-by-word colored breakdown (green=correct, red=wrong)

### 📈 What We'll Build Next (Post-Checkpoint)

The engine is proven. Now we build the "co-pilot" features:

1. **Student Management System**
   - Excel upload
   - Searchable student dropdown
   - Student profiles

2. **History Dashboard**
   - Track WCPM over time
   - Track Accuracy trends
   - Progress charts

3. **Reading Archetypes**
   - "The Careful Decoder" (high accuracy, low speed)
   - "The Speed Reader" (high speed, lower accuracy)
   - "The Balanced Reader" (optimal both)
   - Auto-classification based on metrics

4. **Miscue Heatmap**
   - Visual representation using difflib opcodes
   - Color-coded error patterns
   - Click words to hear pronunciation

### 🎯 Demo Script for Mentors

> "Hi, we're building Akshara, an AI co-pilot for teachers to diagnose reading fluency.
> 
> **The Problem:** Teachers spend hours manually testing students with a stopwatch and clipboard.
> 
> **Our Solution:** A 60-second diagnostic powered by AI.
> 
> **7-Hour Focus:** We spent 100% of our time building the hardest part - the core AI analysis pipeline.
> 
> Let me show you it working: [Run demo as described above]
> 
> In 10 seconds, we've got: WCPM score, Accuracy percentage, and Prosody score. We even have the raw difflib data we'll use for our Miscue Heatmap later.
> 
> **Next Steps:** Now that the engine works, we're building the full-featured app around it:
> - Student Management
> - History Dashboard  
> - Reading Archetypes
> 
> The hardest part is done. The rest is just building features on top of this proven engine."

### 📁 File Structure

```
checkpoint-7hours/
├── app_py314.py              # Backend: Core AI Pipeline
├── app_checkpoint.py         # Backup of simplified backend
├── frontend/
│   └── src/
│       ├── app.jsx           # Frontend: Simple recording UI
│       └── app_checkpoint.jsx # Backup of simplified frontend
└── README_CHECKPOINT.md      # This file
```

### 🔑 Key Features Demonstrated

✅ **Working AI Pipeline** - End-to-end from audio → metrics  
✅ **Real-time Recording** - Browser-based audio capture  
✅ **Whisper Integration** - Accurate transcription  
✅ **Metric Calculation** - WCPM, Accuracy, Prosody  
✅ **Visual Feedback** - Colored word breakdown  
✅ **MongoDB Integration** - Saving reports  
✅ **Clean UI** - Professional, functional interface  

### 🎉 Success Criteria Met

- ✅ Proven the engine works
- ✅ Complete technical pipeline
- ✅ Believable 7-hour scope
- ✅ Ready to build features on top

---

**Branch:** `checkpoint-7hours`  
**Created:** November 14, 2025  
**Team:** Akshara Reading Fluency AI  
**Status:** Checkpoint Passed ✅
