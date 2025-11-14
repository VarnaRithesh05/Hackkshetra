import React from 'react';

export default function LandingPage({ onGetStarted, darkMode, toggleDarkMode }) {
  return (
    <main className={`min-h-screen transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      {/* Navbar */}
      <nav className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm sticky top-0 z-50 transition-colors`}>
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-xl shadow-sm">
                📚
              </div>
              <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Akshara</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full border-2 ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'} transition-all`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <button
                onClick={onGetStarted}
                className={`px-6 py-2 border-2 ${darkMode ? 'border-white text-white hover:bg-white hover:text-gray-900' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'} rounded-full font-semibold transition-all`}
              >
                Teacher Login
              </button>
              <button
                onClick={onGetStarted}
                className={`px-6 py-2 ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-full font-semibold transition-all shadow-md`}
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/students-background.png)`
          }}
        />
        
        {/* Content */}
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl md:text-7xl font-black text-white mb-6" style={{textShadow: '0 4px 12px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)'}}>
              Stop Guessing. Start Teaching.
            </h2>
            <p className="text-2xl text-white mb-12 leading-relaxed font-semibold" style={{textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)'}}>
              AI-Powered Reading Diagnostics in 60 Seconds. Get objective data on Speed, Accuracy, and Prosody.
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full font-bold text-lg transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20">
        <div className="container mx-auto px-8">
          <h2 className={`text-5xl font-black text-center mb-16 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Your Busiest Teachers Are Flying Blind
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${darkMode ? 'bg-gray-800 border-red-400' : 'bg-white border-red-200'} p-8 rounded-2xl border shadow-md hover:shadow-lg transition`}>
              <div className="text-5xl mb-4">⏰</div>
              <h3 className={`font-black text-2xl ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Too Slow</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Manual screening takes 5-10 minutes per student, which is impossible for a class of 50.
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-800 border-yellow-400' : 'bg-white border-yellow-200'} p-8 rounded-2xl border shadow-md hover:shadow-lg transition`}>
              <div className="text-5xl mb-4">📋</div>
              <h3 className={`font-black text-2xl ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Incomplete</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Standard tests miss Prosody (expression), the key to true comprehension.
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-800 border-blue-400' : 'bg-white border-blue-200'} p-8 rounded-2xl border shadow-md hover:shadow-lg transition`}>
              <div className="text-5xl mb-4">👥</div>
              <h3 className={`font-black text-2xl ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Ineffective Grouping</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Students are grouped by age, not ability. Struggling readers fall further behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-8">
          <h2 className={`text-5xl font-black text-center mb-16 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Go Beyond Just Words Per Minute
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100'} rounded-2xl shadow-lg p-8 border-l-4 border-blue-400 hover:shadow-xl transition`}>
              <div className="text-5xl mb-4">⚡</div>
              <h3 className={`font-black text-2xl ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Speed (WCPM)</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Get an industry-standard Words Correct Per Minute score using OpenAI Whisper AI.
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-50 to-green-100'} rounded-2xl shadow-lg p-8 border-l-4 border-green-400 hover:shadow-xl transition`}>
              <div className="text-5xl mb-4">🎯</div>
              <h3 className={`font-black text-2xl ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Accuracy</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                See a word-by-word miscue analysis showing substitutions, omissions, and insertions.
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100'} rounded-2xl shadow-lg p-8 border-l-4 border-purple-400 hover:shadow-xl transition`}>
              <div className="text-5xl mb-4">🎭</div>
              <h3 className={`font-black text-2xl ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Prosody (Expression)</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Our unique analysis listens for student expression, pitch, and rhythm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-8">
          <h2 className={`text-5xl font-black text-center mb-16 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Get a Full Report in 3 Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-black text-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                1
              </div>
              <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Record</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                A student reads any passage for approximately 60 seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white font-black text-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                2
              </div>
              <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Analyze</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Our AI transcribes the audio and checks for errors.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 text-white font-black text-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
                3
              </div>
              <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Report</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>
                Instantly receive a shareable fluency report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-8 text-center">
          <div className={`max-w-3xl mx-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl p-12 border`}>
            <h3 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              Ready to Transform Reading Assessment?
            </h3>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-8`}>
              Start assessing your students reading fluency with Akshara today. Get instant, objective insights that empower better teaching.
            </p>
            <button
              onClick={onGetStarted}
              className={`px-10 py-4 ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl`}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-black text-gray-400' : 'bg-gray-900 text-gray-300'} py-12 transition-colors`}>
        <div className="container mx-auto px-8 text-center">
          <p className="text-lg font-semibold">
            © 2025 Akshara. Making Reading Fun with AI Magic!
          </p>
        </div>
      </footer>
    </main>
  );
}