"""Fix existing students - map their grades to correct levels"""
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['akshara']

print("🔧 FIXING STUDENT LEVELS...")
print("=" * 60)

students = list(db.students.find({}))

for student in students:
    name = student['name']
    grade = student.get('grade', '')
    current_level = student.get('current_level', 1)
    
    # Calculate correct level from grade
    correct_level = 1
    if grade:
        try:
            grade_num = int(''.join(filter(str.isdigit, str(grade))))
            correct_level = min(max(grade_num, 1), 4)
        except:
            correct_level = 1
    
    if current_level != correct_level:
        print(f"  📝 {name}: Grade {grade} → Level {current_level} SHOULD BE {correct_level}")
        db.students.update_one(
            {"_id": student['_id']},
            {"$set": {"current_level": correct_level}}
        )
        print(f"     ✅ Updated to Level {correct_level}")
    else:
        print(f"  ✓ {name}: Grade {grade} → Level {current_level} (Correct)")

print("\n" + "=" * 60)
print("✅ ALL STUDENTS FIXED")
print("=" * 60)

# Verify
print("\n📊 VERIFICATION:")
for level in range(1, 5):
    count = db.students.count_documents({'current_level': level})
    print(f"  Level {level}: {count} students")
