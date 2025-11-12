# Quick Python Version Checker and Environment Setup Script
import sys
import subprocess
import os

print("="*60)
print("🔍 Akshara - Python Environment Checker")
print("="*60)

# Check Python version
python_version = sys.version_info
print(f"\n📌 Current Python Version: {python_version.major}.{python_version.minor}.{python_version.micro}")

# Check if version is compatible
if python_version.major == 3 and 10 <= python_version.minor <= 13:
    print("✅ Python version is COMPATIBLE with all requirements!")
    compatible = True
elif python_version.major == 3 and python_version.minor == 14:
    print("⚠️  Python 3.14 detected - Some packages (numba, librosa, myprosody) are NOT compatible")
    print("    You can still use the simplified version (app_simple.py)")
    print("    For full functionality, install Python 3.11 from: https://www.python.org/downloads/")
    compatible = False
else:
    print("❌ Python version is NOT compatible. Please use Python 3.10-3.13")
    compatible = False

print("\n" + "="*60)
print("📦 Checking installed packages...")
print("="*60)

required_packages = [
    "flask",
    "flask-cors",
    "pymongo",
    "transformers",
    "torch",
    "soundfile",
    "pydub",
    "imageio-ffmpeg"
]

optional_packages = [
    "librosa",
    "myprosody"
]

def check_package(package_name):
    try:
        __import__(package_name.replace("-", "_"))
        return True
    except ImportError:
        return False

print("\n🔹 Required Packages:")
all_required_installed = True
for pkg in required_packages:
    installed = check_package(pkg)
    status = "✅" if installed else "❌"
    print(f"  {status} {pkg}")
    if not installed:
        all_required_installed = False

print("\n🔹 Optional Packages (for full functionality):")
for pkg in optional_packages:
    installed = check_package(pkg)
    status = "✅" if installed else "⚠️ "
    print(f"  {status} {pkg}")

print("\n" + "="*60)
print("📝 Recommendations:")
print("="*60)

if not all_required_installed:
    print("\n❌ Missing required packages. Install with:")
    print("   pip install flask flask-cors pymongo transformers torch soundfile pydub imageio-ffmpeg sentencepiece accelerate")
elif not compatible:
    print("\n⚠️  You can run the simplified version now:")
    print("   python app_simple.py")
    print("\n💡 For full functionality, install Python 3.11:")
    print("   1. Download from: https://www.python.org/downloads/")
    print("   2. Create new venv: python3.11 -m venv .venv")
    print("   3. Activate: .\\.venv\\Scripts\\Activate.ps1")
    print("   4. Install all: pip install -r requirements.txt")
else:
    print("\n✅ Everything looks good! You can run:")
    print("   python app.py")
    print("   or")
    print("   python app_simple.py")

print("\n" + "="*60)
print("🔧 Quick Setup Commands:")
print("="*60)
print("""
# Start MongoDB (if not running)
net start MongoDB

# Seed database with sample passages
python seed_db.py

# Start Flask backend
python app_simple.py

# In another terminal - Start React frontend
cd frontend
npm start
""")

print("="*60)
print("📚 For detailed help, see SETUP_GUIDE.md")
print("="*60)
