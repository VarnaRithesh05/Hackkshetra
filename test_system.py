"""Test script to verify the adaptive learning system"""
from pymongo import MongoClient
import json

client = MongoClient('mongodb://localhost:27017/')
db = client['akshara']

print("=" * 60)
print("TESTING ADAPTIVE LEARNING SYSTEM")
print("=" * 60)

# 1. Check students
print("\n📚 STUDENTS IN DATABASE:")
students = list(db.students.find({}, {
    'name': 1, 
    'grade': 1, 
    'current_level': 1, 
    'attempted_passages': 1,
    'difficult_words': 1
}))

if students:
    for s in students:
        print(f"\n  👤 {s['name']}")
        print(f"     Grade: {s.get('grade', 'N/A')}")
        print(f"     Current Level: {s.get('current_level', 1)}")
        print(f"     Attempted Passages: {len(s.get('attempted_passages', []))}")
        difficult = s.get('difficult_words', {})
        if difficult:
            top_3 = sorted(difficult.items(), key=lambda x: x[1], reverse=True)[:3]
            print(f"     Difficult Words: {top_3}")
else:
    print("  ⚠️ No students found!")

# 2. Check passages
print("\n📖 PASSAGES IN DATABASE:")
print(f"  Total passages: {db.passages.count_documents({})}")
for i in range(1, 5):
    count = db.passages.count_documents({'level': f'Level {i}'})
    print(f"  Level {i}: {count} passages")
    
    # Show titles
    passages = list(db.passages.find({'level': f'Level {i}'}, {'title': 1, '_id': 1}))
    for p in passages:
        print(f"    - {p['title']} (ID: {str(p['_id'])[:8]}...)")

# 3. Check recent reports
print("\n📊 RECENT READING REPORTS:")
reports = list(db.reports.find({}).sort('created_at', -1).limit(5))
if reports:
    for r in reports:
        print(f"\n  Student: {r.get('student_name', 'N/A')}")
        print(f"  Accuracy: {r.get('accuracy_percent', 0):.1f}%")
        print(f"  WCPM: {r.get('wcpm', 0):.1f}")
        print(f"  Punctuation: {r.get('punctuation_score', 0):.1f}%")
else:
    print("  No reports found yet.")

# 4. Test grade-to-level mapping
print("\n🧪 TESTING GRADE-TO-LEVEL MAPPING:")
test_grades = ["Grade 1", "2", "Grade 3", "4th", "5"]
for grade in test_grades:
    grade_num = int(''.join(filter(str.isdigit, grade))) if any(c.isdigit() for c in grade) else 1
    level = min(max(grade_num, 1), 4)
    print(f"  '{grade}' → Level {level}")

print("\n" + "=" * 60)
print("✅ TEST COMPLETE")
print("=" * 60)
