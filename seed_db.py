from pymongo import MongoClient

# --- Configuration ---
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "akshara"
COLLECTION_NAME = "passages"

# --- Sample Data ---
passages_data = [
    {
        "level": "Level 1",
        "title": "My Cat",
        "text": "This is my home. My home is nice. I have a cat. My cat is fat. My cat likes to sit on a mat. A rat ran by my cat. The cat ran at the rat."
    },
    {
        "level": "Level 2",
        "title": "The Big Park",
        "text": "We went to the big park on a sunny day. I can run and jump. My friend has a red ball. We like to play catch with the ball. We saw a dog run after a stick. It is fun at the park."
    },
    {
        "level": "Level 3",
        "title": "A Trip to the Store",
        "text": "My mother and I went to the store. We needed to buy food. We got apples, bread, and milk. The apples were red and shiny. I helped put the food in the cart. On the way home, we saw a fire truck. It was very loud and red."
    },
    {
        "level": "Level 4",
        "title": "The Solar System",
        "text": "The Earth is a planet. It moves around the sun. There are eight planets in our solar system. Mercury is the closest to the sun and is very hot. Jupiter is the largest planet. People have built spaceships to explore space. One day, people might travel to other planets."
    }
]

def seed_database():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        
        # Clear existing data to avoid duplicates
        collection.delete_many({})
        print(f"Cleared existing passages in '{DATABASE_NAME}.{COLLECTION_NAME}'.")
        
        # Insert new data
        result = collection.insert_many(passages_data)
        print(f"Successfully inserted {len(result.inserted_ids)} passages.")
        
    except Exception as e:
        print(f"Error connecting to MongoDB or inserting data: {e}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("Starting database seeding...")
    seed_database()