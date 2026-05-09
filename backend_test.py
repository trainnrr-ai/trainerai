#!/usr/bin/env python3
"""
Comprehensive backend test suite for Trainr Wave 1
Tests all new endpoints plus regression checks
"""
import requests
import uuid
import datetime
from pymongo import MongoClient

# Configuration
BASE_URL = "https://10d9856f-8745-4e2a-b8f9-16f23b1398cc.preview.emergentagent.com"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "spottr"

# Initialize MongoDB
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Test data storage
test_user_ids = []
test_profile_ids = []
test_session_tokens = []

def cleanup():
    """Clean up all test data"""
    print("\n🧹 Cleaning up test data...")
    try:
        if test_user_ids:
            db.users.delete_many({"id": {"$in": test_user_ids}})
        if test_profile_ids:
            db.profiles.delete_many({"id": {"$in": test_profile_ids}})
        if test_session_tokens:
            db.sessions.delete_many({"token": {"$in": test_session_tokens}})
        # Clean up other test data
        db.interactions.delete_many({"fromUserId": {"$in": test_user_ids}})
        db.matches.delete_many({"$or": [{"userA": {"$in": test_user_ids}}, {"userB": {"$in": test_user_ids}}]})
        db.messages.delete_many({"fromUserId": {"$in": test_user_ids}})
        db.notifications.delete_many({"userId": {"$in": test_user_ids}})
        db.reports.delete_many({"reporterId": {"$in": test_user_ids}})
        db.blocks.delete_many({"blockerId": {"$in": test_user_ids}})
        db.moderation_actions.delete_many({"userId": {"$in": test_user_ids}})
        db.typing.delete_many({"userId": {"$in": test_user_ids}})
        print("✅ Cleanup complete")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def create_test_user_with_session(email, name="Test User", is_admin=False):
    """Create a test user with session and profile"""
    user_id = str(uuid.uuid4())
    test_user_ids.append(user_id)
    
    user_doc = {
        "id": user_id,
        "email": email,
        "name": name,
        "picture": "",
        "createdAt": datetime.datetime.utcnow()
    }
    db.users.insert_one(user_doc)
    
    token = "tok-" + uuid.uuid4().hex
    test_session_tokens.append(token)
    db.sessions.insert_one({
        "token": token,
        "userId": user_id,
        "createdAt": datetime.datetime.utcnow(),
        "expiresAt": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    })
    
    # Create profile
    profile_id = str(uuid.uuid4())
    test_profile_ids.append(profile_id)
    profile_doc = {
        "id": profile_id,
        "userId": user_id,
        "isSeed": False,
        "name": name,
        "age": 25,
        "gender": "Male",
        "city": "Mumbai",
        "gymName": "Cult Fit",
        "level": "Intermediate",
        "goal": "Powerlifting",
        "timing": "Early Morning",
        "bio": "test bio",
        "photos": ["photo1.jpg", "photo2.jpg", "photo3.jpg"],
        "verified": False,
        "verifications": {"selfie": False, "instagram": False, "gym": False},
        "verificationRequests": {"selfie": "none", "instagram": "none", "gym": "none"},
        "online": True,
        "lastActiveAt": datetime.datetime.utcnow(),
        "onboardingCompleted": True,
        "createdAt": datetime.datetime.utcnow(),
    }
    db.profiles.insert_one(profile_doc)
    
    return user_id, token, profile_id

def test_health_check():
    """Test GET /api/ health check"""
    print("\n🧪 Testing health check...")
    try:
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
        assert data.get("app") == "trainr", f"Expected app=trainr, got {data}"
        print("✅ PASS - Health check working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Health check: {e}")
        return False

def test_auth_session_errors():
    """Test POST /api/auth/session error handling"""
    print("\n🧪 Testing auth session error handling...")
    try:
        # Missing sessionId
        r = requests.post(f"{BASE_URL}/api/auth/session", json={})
        assert r.status_code == 400, f"Expected 400 for missing sessionId, got {r.status_code}"
        
        # Invalid sessionId
        r = requests.post(f"{BASE_URL}/api/auth/session", json={"sessionId": "invalid-session-id"})
        assert r.status_code == 401, f"Expected 401 for invalid sessionId, got {r.status_code}"
        
        print("✅ PASS - Auth session error handling working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Auth session errors: {e}")
        return False

def test_profile_photo_validation():
    """Test POST /api/profile photo validation"""
    print("\n🧪 Testing profile photo validation...")
    try:
        user_id, token, profile_id = create_test_user_with_session("photo-test@trainr.app")
        cookies = {"spottr_session": token}
        
        # Less than 3 photos
        r = requests.post(f"{BASE_URL}/api/profile", json={
            "name": "Test", "age": 25, "gender": "Male", "city": "Mumbai",
            "gymName": "Test Gym", "level": "Beginner", "goal": "Weight Loss",
            "timing": "Morning", "photos": ["a", "b"]
        }, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for <3 photos, got {r.status_code}"
        
        # More than 5 photos
        r = requests.post(f"{BASE_URL}/api/profile", json={
            "name": "Test", "age": 25, "gender": "Male", "city": "Mumbai",
            "gymName": "Test Gym", "level": "Beginner", "goal": "Weight Loss",
            "timing": "Morning", "photos": ["a", "b", "c", "d", "e", "f"]
        }, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for >5 photos, got {r.status_code}"
        
        # Valid 3-5 photos
        r = requests.post(f"{BASE_URL}/api/profile", json={
            "name": "Test", "age": 25, "gender": "Male", "city": "Mumbai",
            "gymName": "Test Gym", "level": "Beginner", "goal": "Weight Loss",
            "timing": "Morning", "photos": ["a", "b", "c"]
        }, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for valid photos, got {r.status_code}"
        
        print("✅ PASS - Profile photo validation working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Profile photo validation: {e}")
        return False

def test_verify_selfie():
    """Test POST /api/profile/verify-selfie"""
    print("\n🧪 Testing verify-selfie endpoint...")
    try:
        user_id, token, profile_id = create_test_user_with_session("selfie-test@trainr.app")
        cookies = {"spottr_session": token}
        
        # Invalid selfie data
        r = requests.post(f"{BASE_URL}/api/profile/verify-selfie", json={"selfie": "invalid"}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid selfie, got {r.status_code}"
        
        # Valid selfie
        r = requests.post(f"{BASE_URL}/api/profile/verify-selfie", json={
            "selfie": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for valid selfie, got {r.status_code}"
        
        print("✅ PASS - Verify selfie working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Verify selfie: {e}")
        return False

def test_location_capture():
    """Test POST /api/profile/location"""
    print("\n🧪 Testing location capture...")
    try:
        user_id, token, profile_id = create_test_user_with_session("location-test@trainr.app")
        cookies = {"spottr_session": token}
        
        # Without cookie
        r = requests.post(f"{BASE_URL}/api/profile/location", json={"lat": 19.07, "lng": 72.87})
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # Invalid lat (string)
        r = requests.post(f"{BASE_URL}/api/profile/location", json={"lat": "abc", "lng": 72.87}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid lat, got {r.status_code}"
        
        # Valid location
        r = requests.post(f"{BASE_URL}/api/profile/location", json={"lat": 19.07, "lng": 72.87}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for valid location, got {r.status_code}"
        
        # Verify in DB
        profile = db.profiles.find_one({"id": profile_id})
        assert profile.get("location") is not None, "Location not saved in DB"
        assert profile["location"]["lat"] == 19.07, f"Expected lat 19.07, got {profile['location']['lat']}"
        assert profile["location"]["lng"] == 72.87, f"Expected lng 72.87, got {profile['location']['lng']}"
        
        print("✅ PASS - Location capture working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Location capture: {e}")
        return False

def test_discover_match_reasons():
    """Test GET /api/profiles/discover with matchReasons"""
    print("\n🧪 Testing discover with matchReasons...")
    try:
        user_id, token, profile_id = create_test_user_with_session("discover-test@trainr.app", "Discover Tester")
        cookies = {"spottr_session": token}
        
        r = requests.get(f"{BASE_URL}/api/profiles/discover", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        profiles = data.get("profiles", [])
        assert len(profiles) > 0, "Expected at least one profile"
        
        # Check that at least one profile has matchReasons
        has_match_reasons = False
        for p in profiles:
            if "matchReasons" in p and len(p["matchReasons"]) > 0:
                has_match_reasons = True
                print(f"  Found profile with {len(p['matchReasons'])} match reasons: {p['matchReasons']}")
                break
        
        assert has_match_reasons, "Expected at least one profile with matchReasons"
        
        print("✅ PASS - Discover matchReasons working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Discover matchReasons: {e}")
        return False

def test_discover_filters():
    """Test GET /api/profiles/discover filters (recentlyActive, maxDistance, gym)"""
    print("\n🧪 Testing discover filters...")
    try:
        user_id, token, profile_id = create_test_user_with_session("filter-test@trainr.app")
        cookies = {"spottr_session": token}
        
        # Set location for distance filter
        requests.post(f"{BASE_URL}/api/profile/location", json={"lat": 19.07, "lng": 72.87}, cookies=cookies)
        
        # Test recentlyActive filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?recentlyActive=true", cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for recentlyActive, got {r.status_code}"
        data = r.json()
        print(f"  recentlyActive=true returned {len(data.get('profiles', []))} profiles")
        
        # Test maxDistance filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?maxDistance=10", cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for maxDistance, got {r.status_code}"
        data = r.json()
        print(f"  maxDistance=10 returned {len(data.get('profiles', []))} profiles")
        
        # Test gym filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?gym=Cult", cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for gym filter, got {r.status_code}"
        data = r.json()
        profiles = data.get("profiles", [])
        print(f"  gym=Cult returned {len(profiles)} profiles")
        # Verify all returned profiles have "Cult" in gymName
        for p in profiles:
            assert "cult" in p.get("gymName", "").lower(), f"Profile {p['id']} doesn't match gym filter"
        
        print("✅ PASS - Discover filters working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Discover filters: {e}")
        return False

def test_notifications():
    """Test GET /api/notifications and POST /api/notifications/read"""
    print("\n🧪 Testing notifications...")
    try:
        user_id, token, profile_id = create_test_user_with_session("notif-test@trainr.app")
        cookies = {"spottr_session": token}
        
        # Without cookie
        r = requests.get(f"{BASE_URL}/api/notifications")
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # With cookie (initially empty)
        r = requests.get(f"{BASE_URL}/api/notifications", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "notifications" in data, "Expected notifications array"
        assert "unread" in data, "Expected unread count"
        print(f"  Initial notifications: {len(data['notifications'])}, unread: {data['unread']}")
        
        # Mark all as read without cookie
        r = requests.post(f"{BASE_URL}/api/notifications/read", json={})
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # Mark all as read with cookie
        r = requests.post(f"{BASE_URL}/api/notifications/read", json={}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        print("✅ PASS - Notifications working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Notifications: {e}")
        return False

def test_verify_request():
    """Test POST /api/profile/verify-request"""
    print("\n🧪 Testing verify-request...")
    try:
        user_id, token, profile_id = create_test_user_with_session("verify-req-test@trainr.app")
        cookies = {"spottr_session": token}
        
        # Without cookie
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "gym"})
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # Invalid type
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "foo"}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid type, got {r.status_code}"
        
        # Valid gym verification
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "gym"}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for gym verification, got {r.status_code}"
        
        # Verify in DB
        profile = db.profiles.find_one({"id": profile_id})
        assert profile["verifications"]["gym"] == True, "Gym verification not set"
        assert profile["verified"] == True, "Profile not marked as verified"
        
        # Check notification created
        notif = db.notifications.find_one({"userId": user_id, "type": "verification_approved"})
        assert notif is not None, "Verification notification not created"
        print(f"  Notification created: {notif['title']}")
        
        # Valid instagram verification
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "instagram"}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for instagram verification, got {r.status_code}"
        
        profile = db.profiles.find_one({"id": profile_id})
        assert profile["verifications"]["instagram"] == True, "Instagram verification not set"
        
        print("✅ PASS - Verify request working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Verify request: {e}")
        return False

def test_like_mutual_match_notifications():
    """Test POST /api/profiles/like with mutual match and notifications"""
    print("\n🧪 Testing like with mutual match and notifications...")
    try:
        # Create two users
        user_a_id, token_a, profile_a_id = create_test_user_with_session("user-a@trainr.app", "User A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("user-b@trainr.app", "User B")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        
        # User A likes User B
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("matched") == False, f"Expected matched=false, got {data}"
        
        # Check connect_request notification for User B
        notif = db.notifications.find_one({"userId": user_b_id, "type": "connect_request"})
        assert notif is not None, "Connect request notification not created"
        print(f"  Connect request notification: {notif['title']}")
        
        # User B likes User A back (mutual match)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("matched") == True, f"Expected matched=true, got {data}"
        assert "matchId" in data, "Expected matchId in response"
        match_id = data["matchId"]
        print(f"  Match created: {match_id}")
        
        # Check new_match notifications for both users
        notif_a = db.notifications.find_one({"userId": user_a_id, "type": "new_match"})
        notif_b = db.notifications.find_one({"userId": user_b_id, "type": "new_match"})
        assert notif_a is not None, "New match notification not created for User A"
        assert notif_b is not None, "New match notification not created for User B"
        print(f"  New match notifications created for both users")
        
        print("✅ PASS - Like mutual match notifications working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Like mutual match notifications: {e}")
        return False

def test_messages_rate_limit_moderation():
    """Test POST /api/messages with rate limit and moderation"""
    print("\n🧪 Testing messages rate limit and moderation...")
    try:
        # Create two users and a match
        user_a_id, token_a, profile_a_id = create_test_user_with_session("msg-a@trainr.app", "Msg User A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("msg-b@trainr.app", "Msg User B")
        cookies_a = {"spottr_session": token_a}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies={"spottr_session": token_b})
        
        # Get match ID
        r = requests.get(f"{BASE_URL}/api/matches", cookies=cookies_a)
        matches = r.json().get("matches", [])
        assert len(matches) > 0, "No match found"
        match_id = matches[0]["id"]
        
        # Send normal message
        r = requests.post(f"{BASE_URL}/api/messages", json={
            "matchId": match_id,
            "text": "Hello, let's workout together!"
        }, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["message"]["flagged"] == False, "Normal message should not be flagged"
        print(f"  Normal message sent successfully")
        
        # Send message with banned word
        r = requests.post(f"{BASE_URL}/api/messages", json={
            "matchId": match_id,
            "text": "send nudes please"
        }, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["message"]["flagged"] == True, "Banned word message should be flagged"
        print(f"  Banned word message flagged correctly")
        
        # Check moderation_actions created
        mod_action = db.moderation_actions.find_one({"userId": user_a_id, "type": "inappropriate_message"})
        assert mod_action is not None, "Moderation action not created"
        print(f"  Moderation action created")
        
        # Send 2 more banned-word messages (total 3 strikes)
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "send pics"}, cookies=cookies_a)
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "sexy time"}, cookies=cookies_a)
        
        # Check user is banned after 3 strikes
        user = db.users.find_one({"id": user_a_id})
        assert user.get("banned") == True, "User should be banned after 3 strikes"
        print(f"  User banned after 3 strikes")
        
        # Test rate limit (31 messages in 10 min)
        user_c_id, token_c, profile_c_id = create_test_user_with_session("msg-c@trainr.app", "Msg User C")
        user_d_id, token_d, profile_d_id = create_test_user_with_session("msg-d@trainr.app", "Msg User D")
        cookies_c = {"spottr_session": token_c}
        
        # Create match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_d_id}, cookies=cookies_c)
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_c_id}, cookies={"spottr_session": token_d})
        
        r = requests.get(f"{BASE_URL}/api/matches", cookies=cookies_c)
        matches = r.json().get("matches", [])
        match_id_2 = matches[0]["id"]
        
        # Send 31 messages
        for i in range(31):
            r = requests.post(f"{BASE_URL}/api/messages", json={
                "matchId": match_id_2,
                "text": f"Message {i+1}"
            }, cookies=cookies_c)
            if i < 30:
                assert r.status_code == 200, f"Expected 200 for message {i+1}, got {r.status_code}"
            else:
                # 31st message should be rate limited
                assert r.status_code == 429, f"Expected 429 for message 31, got {r.status_code}"
                print(f"  Rate limit triggered on message 31")
        
        print("✅ PASS - Messages rate limit and moderation working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Messages rate limit and moderation: {e}")
        return False

def test_messages_read_typing():
    """Test GET /api/messages auto-read and typing indicator"""
    print("\n🧪 Testing messages auto-read and typing...")
    try:
        # Create two users and a match
        user_a_id, token_a, profile_a_id = create_test_user_with_session("read-a@trainr.app", "Read User A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("read-b@trainr.app", "Read User B")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        
        r = requests.get(f"{BASE_URL}/api/matches", cookies=cookies_a)
        matches = r.json().get("matches", [])
        match_id = matches[0]["id"]
        
        # User A sends message
        requests.post(f"{BASE_URL}/api/messages", json={
            "matchId": match_id,
            "text": "Hello from A"
        }, cookies=cookies_a)
        
        # User B fetches messages (should auto-mark as read)
        r = requests.get(f"{BASE_URL}/api/messages?matchId={match_id}", cookies=cookies_b)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "messages" in data, "Expected messages array"
        assert "otherTyping" in data, "Expected otherTyping field"
        assert data["otherTyping"] == False, "Expected otherTyping=false initially"
        
        # Check message is marked as read by User B
        msg = db.messages.find_one({"matchId": match_id, "fromUserId": user_a_id})
        assert user_b_id in msg.get("readBy", []), "Message not marked as read by User B"
        print(f"  Message auto-marked as read")
        
        # Test forbidden access (user not in match)
        user_c_id, token_c, profile_c_id = create_test_user_with_session("read-c@trainr.app", "Read User C")
        cookies_c = {"spottr_session": token_c}
        
        r = requests.get(f"{BASE_URL}/api/messages?matchId={match_id}", cookies=cookies_c)
        assert r.status_code == 403, f"Expected 403 for non-participant, got {r.status_code}"
        print(f"  Forbidden access blocked correctly")
        
        # Test typing indicator
        r = requests.post(f"{BASE_URL}/api/messages/typing", json={"matchId": match_id}, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Check typing record in DB
        typing = db.typing.find_one({"matchId": match_id, "userId": user_a_id})
        assert typing is not None, "Typing record not created"
        print(f"  Typing indicator set")
        
        # User B should see otherTyping=true
        r = requests.get(f"{BASE_URL}/api/messages?matchId={match_id}", cookies=cookies_b)
        data = r.json()
        assert data["otherTyping"] == True, "Expected otherTyping=true"
        print(f"  Other user sees typing indicator")
        
        print("✅ PASS - Messages auto-read and typing working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Messages auto-read and typing: {e}")
        return False

def test_matches_unread_last_message():
    """Test GET /api/matches with unreadCount and lastMessage"""
    print("\n🧪 Testing matches with unreadCount and lastMessage...")
    try:
        # Create two users and a match
        user_a_id, token_a, profile_a_id = create_test_user_with_session("match-a@trainr.app", "Match User A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("match-b@trainr.app", "Match User B")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        
        r = requests.get(f"{BASE_URL}/api/matches", cookies=cookies_a)
        matches = r.json().get("matches", [])
        match_id = matches[0]["id"]
        
        # User A sends 2 messages
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "Message 1"}, cookies=cookies_a)
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "Message 2"}, cookies=cookies_a)
        
        # User B fetches matches (should see unreadCount=2 and lastMessage)
        r = requests.get(f"{BASE_URL}/api/matches", cookies=cookies_b)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        matches = data.get("matches", [])
        assert len(matches) > 0, "No matches found"
        
        match = matches[0]
        assert "unreadCount" in match, "Expected unreadCount field"
        assert match["unreadCount"] == 2, f"Expected unreadCount=2, got {match['unreadCount']}"
        assert "lastMessage" in match, "Expected lastMessage field"
        assert match["lastMessage"]["text"] == "Message 2", f"Expected 'Message 2', got {match['lastMessage']['text']}"
        assert match["lastMessage"]["fromMe"] == False, f"Expected fromMe=false, got {match['lastMessage']['fromMe']}"
        print(f"  unreadCount={match['unreadCount']}, lastMessage={match['lastMessage']['text']}")
        
        print("✅ PASS - Matches unreadCount and lastMessage working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Matches unreadCount and lastMessage: {e}")
        return False

def test_admin_endpoints():
    """Test admin endpoints"""
    print("\n🧪 Testing admin endpoints...")
    try:
        # Create non-admin user
        user_id, token, profile_id = create_test_user_with_session("nonadmin@trainr.app")
        cookies = {"spottr_session": token}
        
        # Non-admin should get 403
        r = requests.get(f"{BASE_URL}/api/admin/stats", cookies=cookies)
        assert r.status_code == 403, f"Expected 403 for non-admin, got {r.status_code}"
        print(f"  Non-admin blocked correctly")
        
        # Create admin user
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin User", is_admin=True)
        admin_cookies = {"spottr_session": admin_token}
        
        # Test GET /api/admin/stats
        r = requests.get(f"{BASE_URL}/api/admin/stats", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for admin stats, got {r.status_code}"
        data = r.json()
        assert "stats" in data, "Expected stats object"
        stats = data["stats"]
        assert "users" in stats, "Expected users count"
        assert "profiles" in stats, "Expected profiles count"
        assert "matches" in stats, "Expected matches count"
        assert "messages" in stats, "Expected messages count"
        assert "openReports" in stats, "Expected openReports count"
        assert "banned" in stats, "Expected banned count"
        assert "verified" in stats, "Expected verified count"
        assert "activeNow" in stats, "Expected activeNow count"
        print(f"  Admin stats: {stats}")
        
        # Test GET /api/admin/users
        r = requests.get(f"{BASE_URL}/api/admin/users", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for admin users, got {r.status_code}"
        data = r.json()
        assert "users" in data, "Expected users array"
        print(f"  Admin users: {len(data['users'])} users")
        
        # Test GET /api/admin/reports
        r = requests.get(f"{BASE_URL}/api/admin/reports", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for admin reports, got {r.status_code}"
        data = r.json()
        assert "reports" in data, "Expected reports array"
        print(f"  Admin reports: {len(data['reports'])} reports")
        
        # Test POST /api/admin/ban
        test_user_id, test_token, test_profile_id = create_test_user_with_session("toban@trainr.app")
        r = requests.post(f"{BASE_URL}/api/admin/ban", json={"userId": test_user_id}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for ban, got {r.status_code}"
        
        # Verify user is banned
        user = db.users.find_one({"id": test_user_id})
        assert user.get("banned") == True, "User not banned"
        print(f"  User banned successfully")
        
        # Test POST /api/admin/unban
        r = requests.post(f"{BASE_URL}/api/admin/unban", json={"userId": test_user_id}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for unban, got {r.status_code}"
        
        # Verify user is unbanned
        user = db.users.find_one({"id": test_user_id})
        assert user.get("banned") == False, "User not unbanned"
        print(f"  User unbanned successfully")
        
        # Test POST /api/admin/report-resolve
        # Create a test report
        report_id = str(uuid.uuid4())
        db.reports.insert_one({
            "id": report_id,
            "reporterId": user_id,
            "profileId": profile_id,
            "reason": "test",
            "status": "open",
            "createdAt": datetime.datetime.utcnow()
        })
        
        r = requests.post(f"{BASE_URL}/api/admin/report-resolve", json={"id": report_id}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for report-resolve, got {r.status_code}"
        
        # Verify report is resolved
        report = db.reports.find_one({"id": report_id})
        assert report.get("status") == "resolved", "Report not resolved"
        print(f"  Report resolved successfully")
        
        print("✅ PASS - Admin endpoints working")
        return True
    except Exception as e:
        print(f"❌ FAIL - Admin endpoints: {e}")
        return False

def test_banned_user_relogin():
    """Test banned user blocked from re-login"""
    print("\n🧪 Testing banned user re-login...")
    try:
        # Create user and ban them
        user_id, token, profile_id = create_test_user_with_session("banned@trainr.app")
        db.users.update_one({"id": user_id}, {"$set": {"banned": True}})
        cookies = {"spottr_session": token}
        
        # GET /api/auth/me should return {user: null, banned: true}
        r = requests.get(f"{BASE_URL}/api/auth/me", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("user") is None, f"Expected user=null, got {data.get('user')}"
        assert data.get("banned") == True, f"Expected banned=true, got {data.get('banned')}"
        print(f"  Banned user correctly blocked from re-login")
        
        print("✅ PASS - Banned user re-login blocked")
        return True
    except Exception as e:
        print(f"❌ FAIL - Banned user re-login: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 80)
    print("🚀 TRAINR WAVE 1 BACKEND TEST SUITE")
    print("=" * 80)
    
    results = []
    
    # Regression tests
    print("\n" + "=" * 80)
    print("📋 REGRESSION TESTS")
    print("=" * 80)
    results.append(("Health check", test_health_check()))
    results.append(("Auth session errors", test_auth_session_errors()))
    results.append(("Profile photo validation", test_profile_photo_validation()))
    results.append(("Verify selfie", test_verify_selfie()))
    
    # Wave 1 tests
    print("\n" + "=" * 80)
    print("🌊 WAVE 1 NEW FEATURES")
    print("=" * 80)
    results.append(("Location capture", test_location_capture()))
    results.append(("Discover matchReasons", test_discover_match_reasons()))
    results.append(("Discover filters", test_discover_filters()))
    results.append(("Notifications", test_notifications()))
    results.append(("Verify request", test_verify_request()))
    results.append(("Like mutual match notifications", test_like_mutual_match_notifications()))
    results.append(("Messages rate limit & moderation", test_messages_rate_limit_moderation()))
    results.append(("Messages auto-read & typing", test_messages_read_typing()))
    results.append(("Matches unread & lastMessage", test_matches_unread_last_message()))
    results.append(("Admin endpoints", test_admin_endpoints()))
    results.append(("Banned user re-login", test_banned_user_relogin()))
    
    # Cleanup
    cleanup()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("\n" + "=" * 80)
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print("=" * 80)
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
