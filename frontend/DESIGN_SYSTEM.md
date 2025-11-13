# Akshara Design System Guide
## Minimalist Design Implementation with Tailwind CSS

---

## 🎨 Design Philosophy

**Core Principles:**
- Clean white backgrounds with subtle gradient orbs
- Large, bold typography with generous spacing
- Pill-shaped buttons with simple borders
- Minimal color palette focused on readability
- Subtle shadows and smooth transitions

---

## 📐 Layout & Spacing

### Container Patterns
```jsx
// Page Container
<main className="min-h-screen bg-white relative overflow-hidden">

// Content Container (Standard Width)
<div className="max-w-6xl mx-auto px-8 py-24">

// Content Container (Wide)
<div className="max-w-7xl mx-auto px-8 py-6">

// Section Spacing
<section className="relative z-10 max-w-6xl mx-auto px-8 py-24">
```

### Gradient Orb Backgrounds
```jsx
// Top-Left Mint Green Orb
<div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-teal-300/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

// Bottom-Right Coral Pink Orb
<div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-200/40 to-rose-300/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

// Additional Purple Accent Orb
<div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-purple-200/20 to-indigo-300/20 rounded-full blur-3xl"></div>
```

---

## 🎭 Typography

### Headings
```jsx
// Hero Title (Extra Large)
<h1 className="text-7xl md:text-9xl font-black text-gray-900 tracking-tight mb-6 leading-none">
  AKSHARA
</h1>

// Page Title (Large)
<h2 className="text-5xl md:text-6xl font-black text-gray-900 text-center mb-16">
  Your Title Here
</h2>

// Section Subtitle (Medium)
<p className="text-3xl md:text-5xl font-light text-gray-700 mb-8">
  in Reading Fluency
</p>

// Card Title
<h3 className="text-2xl font-black text-gray-900 mb-3">
  Card Title
</h3>

// Small Heading
<h4 className="text-xl font-bold text-gray-800 mb-2">
  Small Title
</h4>
```

### Body Text
```jsx
// Description Text (Large)
<p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12 text-lg">
  Your description here
</p>

// Card Description
<p className="text-gray-600 leading-relaxed">
  Card content here
</p>

// Small Text
<p className="text-sm text-gray-600">
  Helper text or footnotes
</p>
```

---

## 🔘 Buttons

### Primary Button (Filled)
```jsx
<button className="px-8 py-3.5 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all">
  Primary Action
</button>
```

### Secondary Button (Outlined)
```jsx
<button className="px-8 py-3.5 border-2 border-gray-900 rounded-full text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all">
  Secondary Action
</button>
```

### Button with Arrow
```jsx
<button className="px-8 py-3.5 border-2 border-gray-900 rounded-full text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all flex items-center space-x-2">
  <span>Login</span>
  <span>→</span>
</button>
```

### Large CTA Button
```jsx
<button className="px-12 py-4 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 transition-all inline-flex items-center space-x-2">
  <span>Get Started Free</span>
  <span>→</span>
</button>
```

### Small Button
```jsx
<button className="px-6 py-2.5 border-2 border-gray-900 rounded-full text-gray-900 font-semibold hover:bg-gray-50 transition">
  Small Action
</button>
```

---

## 🎴 Cards

### Simple Card (Problem/Feature)
```jsx
<div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all">
  <div className="text-5xl mb-4">⏰</div>
  <h3 className="text-2xl font-black text-gray-900 mb-3">Card Title</h3>
  <p className="text-gray-600 leading-relaxed">Description text here</p>
</div>
```

### Colored Top Border Card
```jsx
<div className="bg-white border-t-4 border-t-blue-500 rounded-2xl p-8 hover:shadow-xl transition-all">
  <div className="text-5xl mb-4">⚡</div>
  <h3 className="text-2xl font-black text-gray-900 mb-3">Feature Title</h3>
  <p className="text-gray-600 leading-relaxed">Feature description</p>
</div>
```

### Dashboard Stat Card
```jsx
<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
  <p className="text-sm text-gray-600 mb-2">Label</p>
  <p className="text-4xl font-black text-gray-900">42</p>
</div>
```

### Card with Gradient Background (Subtle)
```jsx
<div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all">
  {/* Content */}
</div>
```

---

## 📊 Dashboard Components

### Stat Card with Color
```jsx
<div className="bg-white border-l-4 border-l-blue-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
  <h4 className="text-sm font-medium text-gray-600 mb-2">Total Students</h4>
  <p className="text-3xl font-black text-gray-900">156</p>
  <p className="text-xs text-gray-500 mt-1">↑ 12% from last month</p>
</div>
```

### Performance Group Card
```jsx
// Intervention (Red)
<div className="bg-red-50 border border-red-200 rounded-2xl p-6">
  <h4 className="text-lg font-bold text-red-800 mb-3">Intervention</h4>
  <p className="text-sm text-red-600">&lt; 70% accuracy</p>
</div>

// Instructional (Yellow)
<div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
  <h4 className="text-lg font-bold text-yellow-800 mb-3">Instructional</h4>
  <p className="text-sm text-yellow-600">70-89% accuracy</p>
</div>

// Independent (Green)
<div className="bg-green-50 border border-green-200 rounded-2xl p-6">
  <h4 className="text-lg font-bold text-green-800 mb-3">Independent</h4>
  <p className="text-sm text-green-600">≥ 90% accuracy</p>
</div>
```

---

## 🧭 Navigation

### Menu Icon (Grid of Dots)
```jsx
<button className="grid grid-cols-3 gap-1.5 p-2">
  <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
  <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
  <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
  <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
  <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
  <span className="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
</button>
```

### Navigation Bar
```jsx
<nav className="relative z-10 px-8 py-6">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Left: Menu Icon */}
    {/* Center: Nav Links */}
    {/* Right: Logo */}
  </div>
</nav>
```

### Nav Links
```jsx
<a href="#section" className="text-gray-700 hover:text-gray-900 font-medium transition">
  Link Text
</a>

// Active/Highlighted Link
<button className="text-gray-900 font-semibold px-6 py-2.5 border-2 border-gray-900 rounded-full hover:bg-gray-50 transition">
  Active
</button>
```

---

## 🎯 Form Components

### Input Field (Minimalist)
```jsx
<input 
  type="text"
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition"
  placeholder="Enter text..."
/>
```

### Textarea
```jsx
<textarea 
  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-gray-900 focus:outline-none transition resize-none"
  rows="4"
  placeholder="Enter message..."
/>
```

### Select Dropdown
```jsx
<select className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition bg-white">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Form Section
```jsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Label</label>
    <input className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition" />
  </div>
</div>
```

---

## 💬 Alerts & Messages

### Success Alert
```jsx
<div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-start space-x-3">
  <span className="text-2xl">✅</span>
  <div>
    <h4 className="font-bold text-green-900">Success!</h4>
    <p className="text-sm text-green-700">Your action was completed successfully.</p>
  </div>
</div>
```

### Error Alert
```jsx
<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start space-x-3">
  <span className="text-2xl">❌</span>
  <div>
    <h4 className="font-bold text-red-900">Error</h4>
    <p className="text-sm text-red-700">Something went wrong.</p>
  </div>
</div>
```

### Info Alert
```jsx
<div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start space-x-3">
  <span className="text-2xl">ℹ️</span>
  <div>
    <h4 className="font-bold text-blue-900">Information</h4>
    <p className="text-sm text-blue-700">Here's something you should know.</p>
  </div>
</div>
```

---

## 🔄 Loading States

### Spinner (Minimalist)
```jsx
<div className="flex items-center justify-center py-12">
  <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
</div>
```

### Loading Card Skeleton
```jsx
<div className="bg-white border border-gray-200 rounded-2xl p-8 animate-pulse">
  <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

---

## 🎨 Color Palette

### Primary Colors
```javascript
// Black & White
bg-white           // #FFFFFF
text-gray-900      // #111827

// Gray Scale
bg-gray-50         // #F9FAFB
bg-gray-100        // #F3F4F6
border-gray-200    // #E5E7EB
text-gray-600      // #4B5563
text-gray-700      // #374151
```

### Accent Colors
```javascript
// Mint Green (Success/Positive)
from-emerald-200 to-teal-300
bg-green-50, border-green-200, text-green-800

// Coral Pink (Warning/Attention)
from-pink-200 to-rose-300
bg-pink-50, border-pink-200, text-pink-800

// Blue (Info)
border-t-blue-500
bg-blue-50, text-blue-700

// Purple (Special)
from-purple-200 to-indigo-300
border-t-purple-500

// Red (Danger/Intervention)
bg-red-50, border-red-200, text-red-800

// Yellow (Caution/Instructional)
bg-yellow-50, border-yellow-200, text-yellow-800
```

---

## 🎬 Animations & Transitions

### Standard Transition
```jsx
className="transition-all"
className="transition-all duration-300"
```

### Hover Effects
```jsx
// Shadow on Hover
className="hover:shadow-xl transition-all"

// Background Change
className="hover:bg-gray-900 hover:text-white transition-all"

// Scale Up
className="hover:scale-105 transition-transform"
```

### Smooth Entry Animation
```jsx
className="opacity-0 animate-fade-in"
// Add to tailwind.config.js:
// animation: { 'fade-in': 'fadeIn 0.5s ease-in-out' }
```

---

## 📱 Responsive Patterns

### Grid Layouts
```jsx
// 3 Column Grid (Responsive)
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">

// 2 Column Grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">

// Auto-fit Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Responsive Typography
```jsx
className="text-5xl md:text-6xl"
className="text-7xl md:text-9xl"
className="text-3xl md:text-5xl"
```

### Mobile-First Spacing
```jsx
className="px-4 md:px-8"
className="py-12 md:py-24"
```

---

## 🎯 Modal Pattern

### Modal Overlay
```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
    {/* Modal Content */}
  </div>
</div>
```

### Modal Content
```jsx
<div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
  <h2 className="text-3xl font-black text-gray-900 mb-6">Modal Title</h2>
  <div className="space-y-4 mb-6">
    {/* Form fields */}
  </div>
  <div className="flex space-x-3">
    <button className="flex-1 px-6 py-3 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition">
      Confirm
    </button>
    <button className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition">
      Cancel
    </button>
  </div>
</div>
```

---

## 🏗️ Common Patterns

### Hero Section
```jsx
<section className="relative z-10 max-w-6xl mx-auto px-8 py-20 md:py-32 text-center">
  <h1 className="text-7xl md:text-9xl font-black text-gray-900 tracking-tight mb-6 leading-none">
    TITLE
  </h1>
  <p className="text-3xl md:text-5xl font-light text-gray-700 mb-8">
    Subtitle
  </p>
  <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12 text-lg">
    Description
  </p>
  <div className="flex items-center justify-center space-x-4">
    {/* CTA Buttons */}
  </div>
</section>
```

### Feature Grid
```jsx
<section className="relative z-10 max-w-6xl mx-auto px-8 py-24">
  <h2 className="text-5xl md:text-6xl font-black text-gray-900 text-center mb-16">
    Section Title
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {features.map((item, idx) => (
      <div key={idx} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all">
        {/* Card content */}
      </div>
    ))}
  </div>
</section>
```

### Number Steps
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
  {steps.map((step, idx) => (
    <div key={idx} className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg">
        <span className="text-3xl font-black text-white">{step.num}</span>
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-3">{step.title}</h3>
      <p className="text-gray-600 leading-relaxed">{step.desc}</p>
    </div>
  ))}
</div>
```

---

## ✅ Quick Reference Checklist

When creating a new component, ensure:
- [ ] White background with `bg-white`
- [ ] Use `relative z-10` for content above gradient orbs
- [ ] Buttons are `rounded-full` with `border-2`
- [ ] Cards have `rounded-2xl` or `rounded-3xl`
- [ ] Generous spacing with `p-8`, `py-24`, `mb-16`
- [ ] Typography uses `font-black` for headings, `font-semibold` for buttons
- [ ] Colors are `gray-900` for text, `gray-600` for descriptions
- [ ] Hover effects with `hover:shadow-xl transition-all`
- [ ] Grid layouts with `grid-cols-1 md:grid-cols-3`
- [ ] Icons/emojis are `text-5xl` in cards

---

## 🚀 Usage Example

```jsx
import React from 'react';

export default function MinimalistPage() {
  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-teal-300/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-200/40 to-rose-300/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Content */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-24">
        <h2 className="text-5xl md:text-6xl font-black text-gray-900 text-center mb-16">
          Your Title
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Feature</h3>
            <p className="text-gray-600 leading-relaxed">Description here</p>
          </div>
        </div>

        <div className="text-center mt-12">
          <button className="px-12 py-4 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 transition-all">
            Call to Action
          </button>
        </div>
      </section>
    </main>
  );
}
```

---

**Last Updated:** November 13, 2025  
**Version:** 1.0  
**Project:** Akshara Reading Fluency Platform
