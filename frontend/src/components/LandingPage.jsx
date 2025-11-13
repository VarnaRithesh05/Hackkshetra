import React from 'react';

export default function LandingPage({ onGetStarted }) {
  return (
    <main className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="bg-indigo-700 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <h1 className="text-2xl font-black text-white">✨ Akshara</h1>
            
            {/* Right: Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onGetStarted}
                className="bg-indigo-200 text-indigo-900 font-bold px-6 py-2 rounded-lg hover:bg-indigo-100 transform transition hover:scale-105"
              >
                Teacher Login
              </button>
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold px-6 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transform transition hover:scale-105 shadow-lg"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="bg-gradient-to-br from-orange-50 to-purple-50 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl md:text-7xl font-black text-gray-900 mb-6">
              Stop Guessing. Start Teaching.
            </h2>
            <p className="text-2xl text-gray-700 mb-12 leading-relaxed font-semibold">
              AI-Powered Reading Diagnostics in 60 Seconds. Get objective data on Speed, Accuracy, and Prosody.
            </p>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold px-8 py-4 rounded-lg text-lg hover:from-pink-600 hover:to-pink-700 hover:shadow-2xl transform hover:scale-105 transition shadow-lg"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-black text-center mb-16 text-gray-900">Your Busiest Teachers Are Flying Blind</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Too Slow */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl border-2 border-red-300 shadow-md hover:shadow-lg transition">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="font-black text-2xl text-red-800 mb-3">Too Slow</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Manual screening takes 5-10 minutes per student, which is impossible for a class of 50.
              </p>
            </div>

            {/* Card 2: Incomplete */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl border-2 border-yellow-300 shadow-md hover:shadow-lg transition">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-black text-2xl text-yellow-800 mb-3">Incomplete</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Standard tests miss Prosody (expression), the key to true comprehension.
              </p>
            </div>

            {/* Card 3: Ineffective Grouping */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition">
              <div className="text-5xl mb-4">�</div>
              <h3 className="font-black text-2xl text-blue-800 mb-3">Ineffective Grouping</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Students are grouped by age, not ability. Struggling readers fall further behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-black text-center mb-16 text-gray-900">Go Beyond Just 'Words Per Minute'.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Speed (WCPM) */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-blue-400 hover:shadow-2xl transition transform hover:scale-105">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="font-black text-2xl text-gray-900 mb-3">Speed (WCPM)</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Get an industry-standard Words Correct Per Minute score using OpenAI's Whisper AI.
              </p>
            </div>

            {/* Card 2: Accuracy */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-green-400 hover:shadow-2xl transition transform hover:scale-105">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="font-black text-2xl text-gray-900 mb-3">Accuracy</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                See a word-by-word miscue analysis showing substitutions, omissions, and insertions.
              </p>
            </div>

            {/* Card 3: Prosody */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-purple-400 hover:shadow-2xl transition transform hover:scale-105">
              <div className="text-5xl mb-4">🎭</div>
              <h3 className="font-black text-2xl text-gray-900 mb-3">Prosody (Expression)</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Our unique analysis listens for a student's expression, pitch, and rhythm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-black text-center mb-16 text-gray-900">Get a Full Report in 3 Simple Steps.</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1: Record */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Record</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                A student reads any passage for ~60 seconds.
              </p>
            </div>

            {/* Step 2: Analyze */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black text-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Analyze</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Our AI transcribes the audio and checks for errors.
              </p>
            </div>

            {/* Step 3: Report */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white font-black text-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Report</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Instantly receive a shareable fluency report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== METRICS EXPLAINED SECTION ===== */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-black text-center mb-12 text-gray-800">Understanding the Metrics 📊</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="font-bold text-xl text-gray-800 mb-3">WCPM</h4>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Words Correct Per Minute</span>
              </p>
              <p className="text-sm text-gray-600">
                Measures reading speed and accuracy combined. Higher WCPM indicates better fluency.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h4 className="font-bold text-xl text-gray-800 mb-3">Accuracy</h4>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Percentage Match</span>
              </p>
              <p className="text-sm text-gray-600">
                How many words the student read correctly compared to the original text. Benchmark improvements.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">🎭</div>
              <h4 className="font-bold text-xl text-gray-800 mb-3">Prosody</h4>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Expression & Fluency</span>
              </p>
              <p className="text-sm text-gray-600">
                Evaluates speaking rate and natural rhythm. From Very Choppy to Very Fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-black text-white mb-6">Ready to Transform Reading Assessment? 🌟</h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start assessing your students' reading fluency with Akshara today. Get instant, objective insights that empower better teaching.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-purple-600 font-bold px-10 py-4 rounded-xl text-lg hover:shadow-2xl transform hover:scale-105 transition shadow-lg"
          >
            🚀 Get Started Free
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-800 text-gray-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold">
            © 2025 Akshara. Making Reading Fun with AI Magic!
          </p>
        </div>
      </footer>
    </main>
  );
}
