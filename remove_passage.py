from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "akshara"
COLLECTION_NAME = "passages"

# Delete criteria: title exactly "My Bag" (case-insensitive), or level=="Level 1" and title contains "bag" (case-insensitive)
query = {
    "$or": [
        {"title": {"$regex": "^My Bag$", "$options": "i"}},
        {"$and": [{"level": "Level 1"}, {"title": {"$regex": "bag", "$options": "i"}}]}
    ]
}

if __name__ == '__main__':
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]

        result = collection.delete_many(query)
        print(f"Deleted {result.deleted_count} passage(s) matching the criteria from {DATABASE_NAME}.{COLLECTION_NAME}.")

    except Exception as e:
        print(f"Error deleting passages: {e}")
    finally:
        if 'client' in locals():
            client.close()
