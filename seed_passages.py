from pymongo import MongoClient
from bson.objectid import ObjectId

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['akshara']
passages = db['passages']

# Clear existing passages
passages.delete_many({})

# Level 1 Passages - Simple, repetitive, basic phonics
level1_passages = [
    {
        "title": "My Cat",
        "level": "Level 1",
        "grade": 1,
        "text": "This is my home. My home is nice. I have a cat. My cat is fat. My cat likes to sit on a mat. A rat ran by my cat. The cat ran at the rat.",
        "difficulty": "easy",
        "focus_words": ["cat", "mat", "rat", "fat", "sat", "hat"]
    },
    {
        "title": "The Big Dog",
        "level": "Level 1",
        "grade": 1,
        "text": "I see a dog. The dog is big. The big dog can run. The dog can jump. The dog can sit. The dog is my pet. I love my dog.",
        "difficulty": "easy",
        "focus_words": ["dog", "big", "run", "jump", "sit", "pet"]
    },
    {
        "title": "Fun at the Park",
        "level": "Level 1",
        "grade": 1,
        "text": "I go to the park. The sun is hot. I see a red ball. I kick the ball. I run and jump. The park is fun. I like the park.",
        "difficulty": "easy",
        "focus_words": ["park", "sun", "ball", "kick", "run", "fun"]
    },
    {
        "title": "My Bag",
        "level": "Level 1",
        "grade": 1,
        "text": "I have a bag. My bag is blue. I put a book in my bag. I put a pen in my bag. My bag is full. I take my bag to school.",
        "difficulty": "easy",
        "focus_words": ["bag", "blue", "book", "pen", "full", "school"]
    }
]

# Level 2 Passages - Slightly complex sentences, common sight words
level2_passages = [
    {
        "title": "The Big Park",
        "level": "Level 2",
        "grade": 2,
        "text": "We went to the big park on a sunny day. I can run fast. My brother likes to swing high. We ate lunch under a big tree. There were many birds singing. We had so much fun together.",
        "difficulty": "medium",
        "focus_words": ["together", "sunny", "brother", "swing", "lunch", "singing"]
    },
    {
        "title": "My Friend",
        "level": "Level 2",
        "grade": 2,
        "text": "My friend lives next door. Her name is Emma. We play games after school. Sometimes we draw pictures. We like to read books together. Emma is kind and funny. I am happy to have a friend like her.",
        "difficulty": "medium",
        "focus_words": ["friend", "sometimes", "pictures", "together", "funny", "happy"]
    },
    {
        "title": "Garden Fun",
        "level": "Level 2",
        "grade": 2,
        "text": "Mom has a pretty garden. There are red flowers and yellow flowers. Bees come to visit the flowers. I help mom water the plants. We pull out the weeds. The garden smells nice. I love helping in the garden.",
        "difficulty": "medium",
        "focus_words": ["garden", "flowers", "visit", "water", "weeds", "helping"]
    },
    {
        "title": "Rainy Day",
        "level": "Level 2",
        "grade": 2,
        "text": "It was raining outside today. I saw dark clouds in the sky. I put on my raincoat and boots. I jumped in puddles on the street. The rain made everything wet. When the rain stopped, I saw a rainbow. It was beautiful.",
        "difficulty": "medium",
        "focus_words": ["raining", "clouds", "raincoat", "puddles", "rainbow", "beautiful"]
    }
]

# Level 3 Passages - Multi-syllable words, longer sentences
level3_passages = [
    {
        "title": "A Trip to the Store",
        "level": "Level 3",
        "grade": 3,
        "text": "My mother and I went to the store. We needed to buy vegetables and fruits. I pushed the shopping cart. We bought carrots, tomatoes, and apples. Mom let me choose a chocolate bar. At home, we cooked dinner together. Everything was delicious.",
        "difficulty": "medium-hard",
        "focus_words": ["vegetables", "shopping", "chocolate", "tomatoes", "delicious", "together"]
    },
    {
        "title": "The Library Visit",
        "level": "Level 3",
        "grade": 3,
        "text": "Yesterday, I visited the library with my teacher. The library was huge and quiet. There were thousands of books on the shelves. I borrowed a book about dinosaurs. The librarian was very helpful. She showed me where to find adventure stories. I cannot wait to read my new book.",
        "difficulty": "medium-hard",
        "focus_words": ["library", "thousands", "dinosaurs", "librarian", "adventure", "borrowed"]
    },
    {
        "title": "My Birthday Party",
        "level": "Level 3",
        "grade": 3,
        "text": "Last Saturday was my birthday. My parents organized a surprise party. All my friends came to celebrate. We played games and danced to music. Mom made a chocolate cake with candles. Everyone sang the birthday song. I received many wonderful gifts. It was the best birthday ever.",
        "difficulty": "medium-hard",
        "focus_words": ["birthday", "organized", "celebrate", "chocolate", "received", "wonderful"]
    },
    {
        "title": "Learning to Swim",
        "level": "Level 3",
        "grade": 3,
        "text": "This summer, I learned how to swim. My instructor was patient and encouraging. At first, I was nervous about the deep water. I practiced floating and kicking every day. Slowly, I became more confident. Now I can swim across the entire pool. I feel proud of myself.",
        "difficulty": "medium-hard",
        "focus_words": ["instructor", "encouraging", "nervous", "practiced", "confident", "entire"]
    }
]

# Level 4 Passages - Complex vocabulary, compound sentences
level4_passages = [
    {
        "title": "The Solar System",
        "level": "Level 4",
        "grade": 4,
        "text": "The Earth is a planet. It moves around the sun. There are eight planets in our solar system. Mercury is the closest to the sun. Jupiter is the largest planet. Saturn has beautiful rings around it. Scientists use telescopes to study space. Learning about planets is fascinating.",
        "difficulty": "hard",
        "focus_words": ["solar", "Mercury", "Jupiter", "Saturn", "telescopes", "fascinating"]
    },
    {
        "title": "The Rainforest Adventure",
        "level": "Level 4",
        "grade": 4,
        "text": "Rainforests are incredible ecosystems. They contain millions of species of plants and animals. The temperature is warm and humid throughout the year. Tall trees create a thick canopy that blocks sunlight. Monkeys swing from branch to branch. Colorful parrots fly between trees. Scientists believe many rainforest species remain undiscovered.",
        "difficulty": "hard",
        "focus_words": ["rainforests", "ecosystems", "species", "temperature", "canopy", "undiscovered"]
    },
    {
        "title": "Ancient Egypt",
        "level": "Level 4",
        "grade": 4,
        "text": "Ancient Egypt was one of the greatest civilizations in history. The Egyptians built enormous pyramids as tombs for their pharaohs. They invented a writing system called hieroglyphics. The Nile River provided water for farming. Archaeologists continue to discover artifacts that teach us about Egyptian culture. Their achievements still amaze people today.",
        "difficulty": "hard",
        "focus_words": ["civilizations", "pyramids", "pharaohs", "hieroglyphics", "archaeologists", "achievements"]
    },
    {
        "title": "How Volcanoes Work",
        "level": "Level 4",
        "grade": 4,
        "text": "Volcanoes are openings in the Earth's crust. Deep beneath the surface, hot magma rises from the mantle. When pressure builds up, the volcano erupts. Lava flows down the mountainside. Volcanic ash can spread for miles. Although eruptions can be dangerous, volcanic soil is very fertile. Many people live near dormant volcanoes.",
        "difficulty": "hard",
        "focus_words": ["volcanoes", "magma", "erupts", "volcanic", "fertile", "dormant"]
    }
]

# Insert all passages
all_passages = level1_passages + level2_passages + level3_passages + level4_passages

for passage in all_passages:
    passages.insert_one(passage)

print(f"✅ Successfully inserted {len(all_passages)} passages:")
print(f"   Level 1: {len(level1_passages)} passages")
print(f"   Level 2: {len(level2_passages)} passages")
print(f"   Level 3: {len(level3_passages)} passages")
print(f"   Level 4: {len(level4_passages)} passages")
print("\n📚 Database is now populated with diverse passages for proper assessment!")
