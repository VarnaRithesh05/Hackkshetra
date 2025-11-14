from pymongo import MongoClient

# --- Configuration ---
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "akshara"

def clear_database():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        # Clear reports/assessments collection
        reports_collection = db["reports"]
        reports_count = reports_collection.count_documents({})
        reports_collection.delete_many({})
        print(f"✓ Cleared {reports_count} reports from 'reports' collection.")
        
        # Clear students collection
        students_collection = db["students"]
        students_count = students_collection.count_documents({})
        students_collection.delete_many({})
        print(f"✓ Cleared {students_count} students from 'students' collection.")
        
        # Clear history collection if it exists
        history_collection = db["history"]
        history_count = history_collection.count_documents({})
        history_collection.delete_many({})
        print(f"✓ Cleared {history_count} history records from 'history' collection.")
        
        print("\n✓ Database cleared successfully!")
        print("Note: Passages collection was not cleared. Run seed_db.py if you need to reset passages.")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Clearing Akshara Database")
    print("=" * 60)
    confirmation = input("\n⚠️  This will delete all student data and assessments. Continue? (yes/no): ")
    
    if confirmation.lower() in ['yes', 'y']:
        clear_database()
    else:
        print("❌ Operation cancelled.")
