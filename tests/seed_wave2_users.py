#!/usr/bin/env python3
"""
Seed 4 test users for Wave 2 frontend QA
Each user gets: user doc, profile doc (with 2+ photos, bio>=10, city, gymName, goal, timing, level), session doc
"""
import pymongo
from datetime import datetime, timedelta
import uuid

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["spottr"]

# Test users data
test_users = [
    {
        "email": "wave2_userA@test.trainr.in",
        "name": "Arjun Sharma",
        "city": "Mumbai",
        "gymName": "Cult Fit Andheri",
        "goal": "Powerlifting",
        "timing": "Early Morning",
        "level": "Intermediate",
        "bio": "Looking for serious lifting partners in Mumbai. Early morning workouts at Cult Fit."
    },
    {
        "email": "wave2_userB@test.trainr.in",
        "name": "Priya Patel",
        "city": "Mumbai",
        "gymName": "Gold's Gym BKC",
        "goal": "Strength Training",
        "timing": "Evening",
        "level": "Advanced",
        "bio": "Strength training enthusiast. Looking for accountability partners for evening sessions."
    },
    {
        "email": "wave2_userC@test.trainr.in",
        "name": "Rohan Mehta",
        "city": "Mumbai",
        "gymName": "Talwalkars Powai",
        "goal": "Bodybuilding",
        "timing": "Afternoon",
        "level": "Intermediate",
        "bio": "Bodybuilding focused. Training for competitions. Need dedicated workout partners."
    },
    {
        "email": "wave2_userD@test.trainr.in",
        "name": "Sneha Reddy",
        "city": "Mumbai",
        "gymName": "Anytime Fitness",
        "goal": "General Fitness",
        "timing": "Morning",
        "level": "Beginner",
        "bio": "New to fitness journey. Looking for supportive workout partners to stay motivated."
    }
]

# Sample photos (data URIs - small 1x1 pixel images)
sample_photos = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
]

created_users = []

print("🌱 Seeding Wave 2 test users...")

for user_data in test_users:
    # 1. Create user
    user_doc = {
        "email": user_data["email"],
        "name": user_data["name"],
        "createdAt": datetime.utcnow(),
        "banned": False,
        "tier": "free"
    }
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": user_data["email"]})
    if existing_user:
        user_id = existing_user["_id"]
        print(f"✓ User already exists: {user_data['name']} ({user_data['email']})")
    else:
        result = db.users.insert_one(user_doc)
        user_id = result.inserted_id
        print(f"✓ Created user: {user_data['name']} ({user_data['email']})")
    
    # 2. Create profile (satisfies discoverability gate)
    profile_doc = {
        "userId": user_id,
        "name": user_data["name"],
        "bio": user_data["bio"],
        "city": user_data["city"],
        "gymName": user_data["gymName"],
        "goal": user_data["goal"],
        "timing": user_data["timing"],
        "level": user_data["level"],
        "gender": "Male" if user_data["name"] in ["Arjun Sharma", "Rohan Mehta"] else "Female",
        "photos": sample_photos,  # 3 photos (satisfies 2+ requirement)
        "verified": False,
        "verifications": {},
        "verificationRequests": {},
        "createdAt": datetime.utcnow(),
        "lastActiveAt": datetime.utcnow()
    }
    
    # Check if profile already exists
    existing_profile = db.profiles.find_one({"userId": user_id})
    if existing_profile:
        profile_id = existing_profile["_id"]
        print(f"  ✓ Profile already exists for {user_data['name']}")
    else:
        result = db.profiles.insert_one(profile_doc)
        profile_id = result.inserted_id
        print(f"  ✓ Created profile for {user_data['name']}")
    
    # 3. Create session
    session_token = str(uuid.uuid4())
    session_doc = {
        "token": session_token,
        "userId": user_id,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(days=1)
    }
    
    # Check if session already exists
    existing_session = db.sessions.find_one({"userId": user_id})
    if existing_session:
        session_token = existing_session["token"]
        print(f"  ✓ Session already exists for {user_data['name']}")
    else:
        db.sessions.insert_one(session_doc)
        print(f"  ✓ Created session for {user_data['name']}")
    
    created_users.append({
        "name": user_data["name"],
        "email": user_data["email"],
        "userId": str(user_id),
        "profileId": str(profile_id),
        "sessionToken": session_token
    })

print("\n✅ Seeding complete!")
print("\n📋 Test users:")
for i, user in enumerate(created_users):
    print(f"\nUser {chr(65+i)} ({user['name']}):")
    print(f"  Email: {user['email']}")
    print(f"  User ID: {user['userId']}")
    print(f"  Profile ID: {user['profileId']}")
    print(f"  Session Token: {user['sessionToken']}")

# Save to file for Playwright to read
import json
with open("/app/tests/wave2_test_users.json", "w") as f:
    json.dump(created_users, f, indent=2)

print("\n💾 Saved test user data to /app/tests/wave2_test_users.json")
