#!/usr/bin/env python3
"""
Comprehensive backend test suite for Trainr Wave 2 - Backend Refactor + New Features
Tests: Regression (20) + Admin (10) + Billing (4) + Push (4) = 38 tests
"""
import requests
import uuid
import datetime
from pymongo import MongoClient

# Configuration
BASE_URL = "https://workout-match-19.preview.emergentagent.com"
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
        db.pushSubscriptions.delete_many({"userId": {"$in": test_user_ids}})
        print("✅ Cleanup complete")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def create_test_user_with_session(email, name="Test User"):
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

# ============================================================================
# A) REGRESSION TESTS (20 tests) - All existing endpoints must work identically
# ============================================================================

def test_01_health_check():
    """Test 1: GET /api → {ok:true, app:'trainr'}"""
    print("\n🧪 Test 1: Health check")
    try:
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
        assert data.get("app") == "trainr", f"Expected app=trainr, got {data}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_02_auth_me_no_cookie():
    """Test 2: GET /api/auth/me without cookie → 200 {user:null}"""
    print("\n🧪 Test 2: Auth me without cookie")
    try:
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("user") is None, f"Expected user=null, got {data}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_03_auth_session_missing_sessionid():
    """Test 3: POST /api/auth/session no body → 400 'Missing sessionId'"""
    print("\n🧪 Test 3: Auth session missing sessionId")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/session", json={})
        assert r.status_code == 400, f"Expected 400, got {r.status_code}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_04_auth_session_invalid_sessionid():
    """Test 4: POST /api/auth/session with bogus sessionId → 401 'Invalid session'"""
    print("\n🧪 Test 4: Auth session invalid sessionId")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/session", json={"sessionId": "bogus-session-id"})
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_05_auth_logout():
    """Test 5: POST /api/auth/logout → 200 {ok:true}"""
    print("\n🧪 Test 5: Auth logout")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_06_discover_no_auth():
    """Test 6: GET /api/profiles/discover (no auth) → 200, profiles array"""
    print("\n🧪 Test 6: Discover without auth")
    try:
        r = requests.get(f"{BASE_URL}/api/profiles/discover")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "profiles" in data, "Expected profiles array"
        assert len(data["profiles"]) > 0, "Expected at least one profile"
        print(f"  Found {len(data['profiles'])} profiles")
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_06b_discover_filters():
    """Test 6b: Discover filters (city, gym, goal, timing, gender, level, verifiedOnly, recentlyActive, maxDistance)"""
    print("\n🧪 Test 6b: Discover filters")
    try:
        user_id, token, profile_id = create_test_user_with_session("discover-filter@test.com")
        cookies = {"spottr_session": token}
        
        # Set location for maxDistance filter
        requests.post(f"{BASE_URL}/api/profile/location", json={"lat": 19.07, "lng": 72.87}, cookies=cookies)
        
        # Test city filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?city=Mumbai", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test gym filter (regex i)
        r = requests.get(f"{BASE_URL}/api/profiles/discover?gym=cult", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test goal filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?goal=Powerlifting", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test timing filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?timing=Early Morning", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test gender filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?gender=Female", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test level filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?level=Intermediate", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test verifiedOnly filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?verifiedOnly=true", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test recentlyActive filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?recentlyActive=true", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test maxDistance filter
        r = requests.get(f"{BASE_URL}/api/profiles/discover?maxDistance=10", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_07_profile_post_no_auth():
    """Test 7: POST /api/profile (no auth) → 401"""
    print("\n🧪 Test 7: Profile POST without auth")
    try:
        r = requests.post(f"{BASE_URL}/api/profile", json={
            "name": "Test", "age": 25, "gender": "Male", "city": "Mumbai",
            "gymName": "Test Gym", "level": "Beginner", "goal": "Weight Loss",
            "timing": "Morning", "photos": ["a", "b", "c"]
        })
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_07b_profile_photo_validation():
    """Test 7b: POST /api/profile validates 3-5 photos"""
    print("\n🧪 Test 7b: Profile photo validation (3-5 photos)")
    try:
        user_id, token, profile_id = create_test_user_with_session("photo-test@test.com")
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
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_08_profile_me_no_auth():
    """Test 8: GET /api/profile/me (no auth) → 401"""
    print("\n🧪 Test 8: Profile me without auth")
    try:
        r = requests.get(f"{BASE_URL}/api/profile/me")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_09_profile_location():
    """Test 9: POST /api/profile/location: 401 unauth, 400 if lat/lng not numbers, 200 otherwise"""
    print("\n🧪 Test 9: Profile location")
    try:
        user_id, token, profile_id = create_test_user_with_session("location@test.com")
        cookies = {"spottr_session": token}
        
        # Without auth
        r = requests.post(f"{BASE_URL}/api/profile/location", json={"lat": 19.07, "lng": 72.87})
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # Invalid lat (string)
        r = requests.post(f"{BASE_URL}/api/profile/location", json={"lat": "abc", "lng": 72.87}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid lat, got {r.status_code}"
        
        # Valid location
        r = requests.post(f"{BASE_URL}/api/profile/location", json={"lat": 19.07, "lng": 72.87}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for valid location, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_10_verify_selfie():
    """Test 10: POST /api/profile/verify-selfie: 401 unauth, 400 if not data:image/, otherwise auto-approves"""
    print("\n🧪 Test 10: Verify selfie")
    try:
        user_id, token, profile_id = create_test_user_with_session("selfie@test.com")
        cookies = {"spottr_session": token}
        
        # Without auth
        r = requests.post(f"{BASE_URL}/api/profile/verify-selfie", json={"selfie": "data:image/png;base64,abc"})
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # Invalid selfie (not data:image/)
        r = requests.post(f"{BASE_URL}/api/profile/verify-selfie", json={"selfie": "invalid"}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid selfie, got {r.status_code}"
        
        # Valid selfie (auto-approves when MANUAL_VERIFICATION not set)
        r = requests.post(f"{BASE_URL}/api/profile/verify-selfie", json={
            "selfie": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for valid selfie, got {r.status_code}"
        
        # Verify auto-approved
        profile = db.profiles.find_one({"id": profile_id})
        assert profile["verifications"]["selfie"] == True, "Selfie not auto-approved"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_11_verify_request():
    """Test 11: POST /api/profile/verify-request type=gym|instagram → auto-approves; type=other → 400"""
    print("\n🧪 Test 11: Verify request")
    try:
        user_id, token, profile_id = create_test_user_with_session("verify-req@test.com")
        cookies = {"spottr_session": token}
        
        # type=gym (auto-approves)
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "gym"}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for gym, got {r.status_code}"
        
        # type=instagram (auto-approves)
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "instagram"}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200 for instagram, got {r.status_code}"
        
        # type=other (invalid)
        r = requests.post(f"{BASE_URL}/api/profile/verify-request", json={"type": "other"}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid type, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_12_profiles_like():
    """Test 12: POST /api/profiles/like (auth) creates interaction + connect_request notification. Mutual reverse like → matched=true with matchId"""
    print("\n🧪 Test 12: Profiles like with mutual match")
    try:
        user_a_id, token_a, profile_a_id = create_test_user_with_session("like-a@test.com", "User A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("like-b@test.com", "User B")
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
        
        # User B likes User A back (mutual match)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("matched") == True, f"Expected matched=true, got {data}"
        assert "matchId" in data, "Expected matchId in response"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_13_profiles_skip():
    """Test 13: POST /api/profiles/skip (auth) creates interaction"""
    print("\n🧪 Test 13: Profiles skip")
    try:
        user_id, token, profile_id = create_test_user_with_session("skip@test.com")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("skip-b@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.post(f"{BASE_URL}/api/profiles/skip", json={"profileId": profile_b_id}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
        
        # Verify interaction created
        interaction = db.interactions.find_one({"fromUserId": user_id, "toProfileId": profile_b_id, "type": "skip"})
        assert interaction is not None, "Skip interaction not created"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_14_matches():
    """Test 14: GET /api/matches (auth) → enriched with otherProfile, lastMessage, unreadCount"""
    print("\n🧪 Test 14: Matches with enrichment")
    try:
        user_a_id, token_a, profile_a_id = create_test_user_with_session("match-a@test.com", "Match A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("match-b@test.com", "Match B")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        match_id = r.json()["matchId"]
        
        # Send a message
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "Hello"}, cookies=cookies_a)
        
        # Get matches for User B
        r = requests.get(f"{BASE_URL}/api/matches", cookies=cookies_b)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        matches = data.get("matches", [])
        assert len(matches) > 0, "Expected at least one match"
        
        match = matches[0]
        assert "otherProfile" in match, "Expected otherProfile"
        assert "lastMessage" in match, "Expected lastMessage"
        assert "unreadCount" in match, "Expected unreadCount"
        assert match["unreadCount"] == 1, f"Expected unreadCount=1, got {match['unreadCount']}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_15_messages_get():
    """Test 15: GET /api/messages?matchId (auth) → 403 if not in match, otherwise messages + otherTyping; auto-marks read"""
    print("\n🧪 Test 15: Messages GET with auto-read")
    try:
        user_a_id, token_a, profile_a_id = create_test_user_with_session("msg-get-a@test.com", "Msg A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("msg-get-b@test.com", "Msg B")
        user_c_id, token_c, profile_c_id = create_test_user_with_session("msg-get-c@test.com", "Msg C")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        cookies_c = {"spottr_session": token_c}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        match_id = r.json()["matchId"]
        
        # User A sends message
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "Hello"}, cookies=cookies_a)
        
        # User C (not in match) tries to access
        r = requests.get(f"{BASE_URL}/api/messages?matchId={match_id}", cookies=cookies_c)
        assert r.status_code == 403, f"Expected 403 for non-participant, got {r.status_code}"
        
        # User B fetches messages (should auto-mark as read)
        r = requests.get(f"{BASE_URL}/api/messages?matchId={match_id}", cookies=cookies_b)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "messages" in data, "Expected messages array"
        assert "otherTyping" in data, "Expected otherTyping field"
        
        # Verify message marked as read
        msg = db.messages.find_one({"matchId": match_id, "fromUserId": user_a_id})
        assert user_b_id in msg.get("readBy", []), "Message not marked as read"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_16_messages_post():
    """Test 16: POST /api/messages (auth) → 400 missing fields, 403 if not in match, 429 if 30+ msgs/10min, flagged=true for banned words, 3 strikes → user.banned=true"""
    print("\n🧪 Test 16: Messages POST with moderation and rate limit")
    try:
        user_a_id, token_a, profile_a_id = create_test_user_with_session("msg-post-a@test.com", "Msg Post A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("msg-post-b@test.com", "Msg Post B")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        match_id = r.json()["matchId"]
        
        # Missing text field
        r = requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id}, cookies=cookies_a)
        assert r.status_code == 400, f"Expected 400 for missing text, got {r.status_code}"
        
        # Normal message
        r = requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "Hello"}, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["message"]["flagged"] == False, "Normal message should not be flagged"
        
        # Banned word message
        r = requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "send nudes"}, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data["message"]["flagged"] == True, "Banned word message should be flagged"
        
        # 2 more banned word messages (total 3 strikes)
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "send pics"}, cookies=cookies_a)
        requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id, "text": "sexy time"}, cookies=cookies_a)
        
        # Check user is banned
        user = db.users.find_one({"id": user_a_id})
        assert user.get("banned") == True, "User should be banned after 3 strikes"
        
        # Test rate limit (30+ messages)
        user_c_id, token_c, profile_c_id = create_test_user_with_session("msg-rate@test.com", "Rate Test")
        user_d_id, token_d, profile_d_id = create_test_user_with_session("msg-rate-d@test.com", "Rate Test D")
        cookies_c = {"spottr_session": token_c}
        
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_d_id}, cookies=cookies_c)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_c_id}, cookies={"spottr_session": token_d})
        match_id_2 = r.json()["matchId"]
        
        # Send 31 messages
        for i in range(31):
            r = requests.post(f"{BASE_URL}/api/messages", json={"matchId": match_id_2, "text": f"Msg {i}"}, cookies=cookies_c)
            if i < 30:
                assert r.status_code == 200, f"Expected 200 for message {i+1}, got {r.status_code}"
            else:
                assert r.status_code == 429, f"Expected 429 for message 31, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_17_messages_typing():
    """Test 17: POST /api/messages/typing → upserts typing doc with 4s TTL"""
    print("\n🧪 Test 17: Messages typing indicator")
    try:
        user_a_id, token_a, profile_a_id = create_test_user_with_session("typing-a@test.com", "Typing A")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("typing-b@test.com", "Typing B")
        cookies_a = {"spottr_session": token_a}
        cookies_b = {"spottr_session": token_b}
        
        # Create mutual match
        requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_b_id}, cookies=cookies_a)
        r = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_a_id}, cookies=cookies_b)
        match_id = r.json()["matchId"]
        
        # User A sets typing
        r = requests.post(f"{BASE_URL}/api/messages/typing", json={"matchId": match_id}, cookies=cookies_a)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify typing record created
        typing = db.typing.find_one({"matchId": match_id, "userId": user_a_id})
        assert typing is not None, "Typing record not created"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_18_notifications():
    """Test 18: GET /api/notifications (auth) → list+unread; POST /api/notifications/read → marks read"""
    print("\n🧪 Test 18: Notifications")
    try:
        user_id, token, profile_id = create_test_user_with_session("notif@test.com")
        cookies = {"spottr_session": token}
        
        # GET notifications
        r = requests.get(f"{BASE_URL}/api/notifications", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "notifications" in data, "Expected notifications array"
        assert "unread" in data, "Expected unread count"
        
        # POST mark as read
        r = requests.post(f"{BASE_URL}/api/notifications/read", json={}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_19_reports():
    """Test 19: POST /api/reports (auth) → inserts report"""
    print("\n🧪 Test 19: Reports")
    try:
        user_id, token, profile_id = create_test_user_with_session("report@test.com")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("report-b@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.post(f"{BASE_URL}/api/reports", json={
            "profileId": profile_b_id,
            "reason": "Inappropriate behavior"
        }, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify report created
        report = db.reports.find_one({"reporterId": user_id, "profileId": profile_b_id})
        assert report is not None, "Report not created"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_20_blocks():
    """Test 20: POST /api/blocks (auth) → inserts block; subsequent /api/profiles/discover excludes blocked"""
    print("\n🧪 Test 20: Blocks with discover exclusion")
    try:
        user_id, token, profile_id = create_test_user_with_session("block@test.com")
        user_b_id, token_b, profile_b_id = create_test_user_with_session("block-b@test.com")
        cookies = {"spottr_session": token}
        
        # Block user B
        r = requests.post(f"{BASE_URL}/api/blocks", json={"profileId": profile_b_id}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify block created
        block = db.blocks.find_one({"blockerId": user_id, "blockedProfileId": profile_b_id})
        assert block is not None, "Block not created"
        
        # Verify blocked profile excluded from discover
        r = requests.get(f"{BASE_URL}/api/profiles/discover", cookies=cookies)
        data = r.json()
        profiles = data.get("profiles", [])
        blocked_profile_ids = [p["id"] for p in profiles if p["id"] == profile_b_id]
        assert len(blocked_profile_ids) == 0, "Blocked profile should be excluded from discover"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

# ============================================================================
# B) NEW ADMIN ENDPOINTS (10 tests)
# ============================================================================

def test_21_admin_stats():
    """Test 21: GET /api/admin/stats → 403 for non-admin, 200 for admin with pendingVerifications fields"""
    print("\n🧪 Test 21: Admin stats")
    try:
        # Non-admin user
        user_id, token, profile_id = create_test_user_with_session("nonadmin@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.get(f"{BASE_URL}/api/admin/stats", cookies=cookies)
        assert r.status_code == 403, f"Expected 403 for non-admin, got {r.status_code}"
        
        # Admin user
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        r = requests.get(f"{BASE_URL}/api/admin/stats", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for admin, got {r.status_code}"
        data = r.json()
        assert "stats" in data, "Expected stats object"
        stats = data["stats"]
        assert "pendingVerifications" in stats, "Expected pendingVerifications"
        assert "pendingSelfie" in stats, "Expected pendingSelfie"
        assert "pendingGym" in stats, "Expected pendingGym"
        assert "pendingInsta" in stats, "Expected pendingInsta"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_22_admin_users():
    """Test 22: GET /api/admin/users — supports ?q=<query> and ?status=all|active|banned"""
    print("\n🧪 Test 22: Admin users with filters")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        # Create test users
        user1_id, _, _ = create_test_user_with_session("testuser1@test.com", "Test User 1")
        user2_id, _, _ = create_test_user_with_session("testuser2@test.com", "Test User 2")
        db.users.update_one({"id": user2_id}, {"$set": {"banned": True}})
        
        # Test ?q filter
        r = requests.get(f"{BASE_URL}/api/admin/users?q=testuser1", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        users = data.get("users", [])
        assert any(u["email"] == "testuser1@test.com" for u in users), "Query filter not working"
        
        # Test ?status=all
        r = requests.get(f"{BASE_URL}/api/admin/users?status=all", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test ?status=active
        r = requests.get(f"{BASE_URL}/api/admin/users?status=active", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        users = data.get("users", [])
        assert all(not u.get("banned") for u in users), "Active filter should exclude banned users"
        
        # Test ?status=banned
        r = requests.get(f"{BASE_URL}/api/admin/users?status=banned", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        users = data.get("users", [])
        assert all(u.get("banned") for u in users), "Banned filter should only include banned users"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_23_admin_reports():
    """Test 23: GET /api/admin/reports — supports ?status=open|resolved|all. Enriched with targetProfile and reporter"""
    print("\n🧪 Test 23: Admin reports with enrichment")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        # Create test report
        reporter_id, reporter_token, reporter_profile_id = create_test_user_with_session("reporter@test.com", "Reporter")
        target_id, target_token, target_profile_id = create_test_user_with_session("target@test.com", "Target")
        
        report_id = str(uuid.uuid4())
        db.reports.insert_one({
            "id": report_id,
            "reporterId": reporter_id,
            "profileId": target_profile_id,
            "reason": "test reason",
            "status": "open",
            "createdAt": datetime.datetime.utcnow()
        })
        
        # Test ?status=open
        r = requests.get(f"{BASE_URL}/api/admin/reports?status=open", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        reports = data.get("reports", [])
        assert len(reports) > 0, "Expected at least one open report"
        
        # Verify enrichment
        report = next((r for r in reports if r["id"] == report_id), None)
        assert report is not None, "Test report not found"
        assert "targetProfile" in report, "Expected targetProfile enrichment"
        assert "reporter" in report, "Expected reporter enrichment"
        assert report["targetProfile"]["id"] == target_profile_id, "targetProfile not enriched correctly"
        assert report["reporter"]["id"] == reporter_id, "reporter not enriched correctly"
        
        # Test ?status=resolved
        r = requests.get(f"{BASE_URL}/api/admin/reports?status=resolved", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Test ?status=all
        r = requests.get(f"{BASE_URL}/api/admin/reports?status=all", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_24_admin_ban_unban():
    """Test 24: POST /api/admin/ban with {userId, reason} → sets user.banned=true. POST /api/admin/unban → resets"""
    print("\n🧪 Test 24: Admin ban/unban")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        user_id, token, profile_id = create_test_user_with_session("toban@test.com")
        
        # Ban user
        r = requests.post(f"{BASE_URL}/api/admin/ban", json={"userId": user_id, "reason": "Test ban"}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        user = db.users.find_one({"id": user_id})
        assert user.get("banned") == True, "User not banned"
        assert user.get("banReason") == "Test ban", "Ban reason not set"
        
        # Unban user
        r = requests.post(f"{BASE_URL}/api/admin/unban", json={"userId": user_id}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        user = db.users.find_one({"id": user_id})
        assert user.get("banned") == False, "User not unbanned"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_25_admin_report_resolve():
    """Test 25: POST /api/admin/report-resolve with {id, action} → status='resolved', action=action"""
    print("\n🧪 Test 25: Admin report resolve")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        # Create test report
        report_id = str(uuid.uuid4())
        db.reports.insert_one({
            "id": report_id,
            "reporterId": admin_id,
            "profileId": admin_profile_id,
            "reason": "test",
            "status": "open",
            "createdAt": datetime.datetime.utcnow()
        })
        
        # Resolve report
        r = requests.post(f"{BASE_URL}/api/admin/report-resolve", json={"id": report_id, "action": "warned"}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        report = db.reports.find_one({"id": report_id})
        assert report.get("status") == "resolved", "Report not resolved"
        assert report.get("action") == "warned", "Action not set"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_26_admin_verifications():
    """Test 26: GET /api/admin/verifications with ?type filter"""
    print("\n🧪 Test 26: Admin verifications queue")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        # Create profiles with pending verifications
        user1_id, _, profile1_id = create_test_user_with_session("pending1@test.com", "Pending 1")
        user2_id, _, profile2_id = create_test_user_with_session("pending2@test.com", "Pending 2")
        user3_id, _, profile3_id = create_test_user_with_session("pending3@test.com", "Pending 3")
        
        db.profiles.update_one({"id": profile1_id}, {"$set": {"verificationRequests.selfie": "pending"}})
        db.profiles.update_one({"id": profile2_id}, {"$set": {"verificationRequests.gym": "pending"}})
        db.profiles.update_one({"id": profile3_id}, {"$set": {"verificationRequests.instagram": "pending"}})
        
        # Without ?type (all pending)
        r = requests.get(f"{BASE_URL}/api/admin/verifications", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        profiles = data.get("profiles", [])
        assert len(profiles) >= 3, f"Expected at least 3 pending profiles, got {len(profiles)}"
        
        # ?type=selfie
        r = requests.get(f"{BASE_URL}/api/admin/verifications?type=selfie", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        profiles = data.get("profiles", [])
        assert any(p["id"] == profile1_id for p in profiles), "Selfie pending profile not found"
        
        # ?type=invalid (should still work, not 500)
        r = requests.get(f"{BASE_URL}/api/admin/verifications?type=invalid", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200 for invalid type, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_27_admin_verify_approve():
    """Test 27: POST /api/admin/verify-approve {profileId, type} → sets verifications.<type>=true, creates notification"""
    print("\n🧪 Test 27: Admin verify approve")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        user_id, token, profile_id = create_test_user_with_session("toverify@test.com")
        db.profiles.update_one({"id": profile_id}, {"$set": {"verificationRequests.selfie": "pending"}})
        
        # Approve selfie
        r = requests.post(f"{BASE_URL}/api/admin/verify-approve", json={"profileId": profile_id, "type": "selfie"}, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify in DB
        profile = db.profiles.find_one({"id": profile_id})
        assert profile["verifications"]["selfie"] == True, "Selfie not approved"
        assert profile["verificationRequests"]["selfie"] == "approved", "Request status not updated"
        assert profile["verified"] == True, "Profile not marked as verified"
        
        # Check notification
        notif = db.notifications.find_one({"userId": user_id, "type": "verification_approved"})
        assert notif is not None, "Verification notification not created"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_28_admin_verify_approve_invalid():
    """Test 28: POST /api/admin/verify-approve type='other' → 400 'Invalid type'"""
    print("\n🧪 Test 28: Admin verify approve invalid type")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        user_id, token, profile_id = create_test_user_with_session("invalid@test.com")
        
        r = requests.post(f"{BASE_URL}/api/admin/verify-approve", json={"profileId": profile_id, "type": "other"}, cookies=admin_cookies)
        assert r.status_code == 400, f"Expected 400 for invalid type, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_29_admin_verify_reject():
    """Test 29: POST /api/admin/verify-reject {profileId, type, reason} → sets verificationRequests.<type>='rejected', creates notification"""
    print("\n🧪 Test 29: Admin verify reject")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        user_id, token, profile_id = create_test_user_with_session("toreject@test.com")
        db.profiles.update_one({"id": profile_id}, {"$set": {"verificationRequests.gym": "pending"}})
        
        # Reject gym
        r = requests.post(f"{BASE_URL}/api/admin/verify-reject", json={
            "profileId": profile_id,
            "type": "gym",
            "reason": "Unclear photo"
        }, cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify in DB
        profile = db.profiles.find_one({"id": profile_id})
        assert profile["verificationRequests"]["gym"] == "rejected", "Request not rejected"
        
        # Check notification
        notif = db.notifications.find_one({"userId": user_id, "type": "verification_rejected"})
        assert notif is not None, "Rejection notification not created"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_30_admin_analytics():
    """Test 30: GET /api/admin/analytics?days=14 → returns time-series and aggregates"""
    print("\n🧪 Test 30: Admin analytics")
    try:
        admin_id, admin_token, admin_profile_id = create_test_user_with_session("hello@trainr.in", "Admin")
        admin_cookies = {"spottr_session": admin_token}
        
        r = requests.get(f"{BASE_URL}/api/admin/analytics?days=14", cookies=admin_cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        # Verify structure
        assert "signups" in data, "Expected signups series"
        assert "profiles" in data, "Expected profiles series"
        assert "matches" in data, "Expected matches series"
        assert "messages" in data, "Expected messages series"
        assert "topGyms" in data, "Expected topGyms"
        assert "genderSplit" in data, "Expected genderSplit"
        assert "goalSplit" in data, "Expected goalSplit"
        
        # Verify series format
        assert isinstance(data["signups"], list), "signups should be array"
        assert isinstance(data["topGyms"], list), "topGyms should be array"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

# ============================================================================
# C) NEW BILLING ENDPOINTS (4 tests) - MOCKED
# ============================================================================

def test_31_billing_me():
    """Test 31: GET /api/billing/me without auth → 401. With auth → 200 with tier, isPro, plans, features"""
    print("\n🧪 Test 31: Billing me")
    try:
        # Without auth
        r = requests.get(f"{BASE_URL}/api/billing/me")
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # With auth
        user_id, token, profile_id = create_test_user_with_session("billing@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.get(f"{BASE_URL}/api/billing/me", cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert "tier" in data, "Expected tier"
        assert "isPro" in data, "Expected isPro"
        assert "plans" in data, "Expected plans"
        assert "features" in data, "Expected features"
        assert "catalog" in data, "Expected catalog"
        assert data["tier"] == "free", f"Expected tier=free, got {data['tier']}"
        assert data["isPro"] == False, f"Expected isPro=false, got {data['isPro']}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_32_billing_upgrade():
    """Test 32: POST /api/billing/upgrade {planId:'pro_monthly'} → 200 with mocked:true, tier:'pro'"""
    print("\n🧪 Test 32: Billing upgrade")
    try:
        user_id, token, profile_id = create_test_user_with_session("upgrade@test.com")
        cookies = {"spottr_session": token}
        
        # Upgrade to pro_monthly
        r = requests.post(f"{BASE_URL}/api/billing/upgrade", json={"planId": "pro_monthly"}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert data.get("ok") == True, "Expected ok=true"
        assert data.get("mocked") == True, "Expected mocked=true"
        assert data.get("tier") == "pro", f"Expected tier=pro, got {data.get('tier')}"
        assert "tierExpiresAt" in data, "Expected tierExpiresAt"
        
        # Verify in DB
        user = db.users.find_one({"id": user_id})
        assert user.get("tier") == "pro", "User tier not updated to pro"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_33_billing_upgrade_invalid():
    """Test 33: POST /api/billing/upgrade {planId:'invalid'} → 400 'Invalid plan'"""
    print("\n🧪 Test 33: Billing upgrade invalid plan")
    try:
        user_id, token, profile_id = create_test_user_with_session("upgrade-invalid@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.post(f"{BASE_URL}/api/billing/upgrade", json={"planId": "invalid"}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid plan, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_34_billing_downgrade():
    """Test 34: POST /api/billing/downgrade → 200, tier reset to 'free'"""
    print("\n🧪 Test 34: Billing downgrade")
    try:
        user_id, token, profile_id = create_test_user_with_session("downgrade@test.com")
        cookies = {"spottr_session": token}
        
        # First upgrade
        requests.post(f"{BASE_URL}/api/billing/upgrade", json={"planId": "pro_monthly"}, cookies=cookies)
        
        # Then downgrade
        r = requests.post(f"{BASE_URL}/api/billing/downgrade", json={}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, "Expected ok=true"
        
        # Verify in DB
        user = db.users.find_one({"id": user_id})
        assert user.get("tier") == "free", "User tier not reset to free"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

# ============================================================================
# D) NEW PUSH ENDPOINTS (4 tests) - MOCKED
# ============================================================================

def test_35_push_vapid():
    """Test 35: GET /api/push/vapid → 200 {vapidPublicKey: null} (env not set)"""
    print("\n🧪 Test 35: Push VAPID key")
    try:
        r = requests.get(f"{BASE_URL}/api/push/vapid")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "vapidPublicKey" in data, "Expected vapidPublicKey"
        assert data["vapidPublicKey"] is None, f"Expected null, got {data['vapidPublicKey']}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_36_push_subscribe():
    """Test 36: POST /api/push/subscribe without auth → 401. With auth and valid subscription → 200 {ok:true, mocked:true}"""
    print("\n🧪 Test 36: Push subscribe")
    try:
        # Without auth
        r = requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "subscription": {"endpoint": "https://example.com/push", "keys": {"p256dh": "key", "auth": "auth"}}
        })
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        
        # With auth
        user_id, token, profile_id = create_test_user_with_session("push@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "subscription": {"endpoint": "https://example.com/push", "keys": {"p256dh": "key", "auth": "auth"}}
        }, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, "Expected ok=true"
        assert data.get("mocked") == True, "Expected mocked=true"
        
        # Verify in DB
        sub = db.pushSubscriptions.find_one({"userId": user_id})
        assert sub is not None, "Push subscription not created"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_37_push_subscribe_invalid():
    """Test 37: POST /api/push/subscribe with invalid (no endpoint) → 400"""
    print("\n🧪 Test 37: Push subscribe invalid")
    try:
        user_id, token, profile_id = create_test_user_with_session("push-invalid@test.com")
        cookies = {"spottr_session": token}
        
        r = requests.post(f"{BASE_URL}/api/push/subscribe", json={"subscription": {}}, cookies=cookies)
        assert r.status_code == 400, f"Expected 400 for invalid subscription, got {r.status_code}"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_38_push_unsubscribe():
    """Test 38: POST /api/push/unsubscribe → 200, deletes pushSubscriptions"""
    print("\n🧪 Test 38: Push unsubscribe")
    try:
        user_id, token, profile_id = create_test_user_with_session("push-unsub@test.com")
        cookies = {"spottr_session": token}
        
        # First subscribe
        requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "subscription": {"endpoint": "https://example.com/push", "keys": {"p256dh": "key", "auth": "auth"}}
        }, cookies=cookies)
        
        # Then unsubscribe
        r = requests.post(f"{BASE_URL}/api/push/unsubscribe", json={}, cookies=cookies)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, "Expected ok=true"
        
        # Verify deleted from DB
        sub = db.pushSubscriptions.find_one({"userId": user_id})
        assert sub is None, "Push subscription not deleted"
        
        print("✅ PASS")
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    """Run all tests"""
    print("=" * 80)
    print("🚀 TRAINR WAVE 2 COMPREHENSIVE BACKEND TEST SUITE")
    print("   Backend Refactor + Admin + Billing + Push")
    print("=" * 80)
    
    results = []
    
    # A) REGRESSION TESTS (20)
    print("\n" + "=" * 80)
    print("📋 A) REGRESSION TESTS (20 tests)")
    print("=" * 80)
    results.append(("Test 1: Health check", test_01_health_check()))
    results.append(("Test 2: Auth me no cookie", test_02_auth_me_no_cookie()))
    results.append(("Test 3: Auth session missing sessionId", test_03_auth_session_missing_sessionid()))
    results.append(("Test 4: Auth session invalid sessionId", test_04_auth_session_invalid_sessionid()))
    results.append(("Test 5: Auth logout", test_05_auth_logout()))
    results.append(("Test 6: Discover no auth", test_06_discover_no_auth()))
    results.append(("Test 6b: Discover filters", test_06b_discover_filters()))
    results.append(("Test 7: Profile POST no auth", test_07_profile_post_no_auth()))
    results.append(("Test 7b: Profile photo validation", test_07b_profile_photo_validation()))
    results.append(("Test 8: Profile me no auth", test_08_profile_me_no_auth()))
    results.append(("Test 9: Profile location", test_09_profile_location()))
    results.append(("Test 10: Verify selfie", test_10_verify_selfie()))
    results.append(("Test 11: Verify request", test_11_verify_request()))
    results.append(("Test 12: Profiles like", test_12_profiles_like()))
    results.append(("Test 13: Profiles skip", test_13_profiles_skip()))
    results.append(("Test 14: Matches", test_14_matches()))
    results.append(("Test 15: Messages GET", test_15_messages_get()))
    results.append(("Test 16: Messages POST", test_16_messages_post()))
    results.append(("Test 17: Messages typing", test_17_messages_typing()))
    results.append(("Test 18: Notifications", test_18_notifications()))
    results.append(("Test 19: Reports", test_19_reports()))
    results.append(("Test 20: Blocks", test_20_blocks()))
    
    # B) NEW ADMIN ENDPOINTS (10)
    print("\n" + "=" * 80)
    print("🔐 B) NEW ADMIN ENDPOINTS (10 tests)")
    print("=" * 80)
    results.append(("Test 21: Admin stats", test_21_admin_stats()))
    results.append(("Test 22: Admin users", test_22_admin_users()))
    results.append(("Test 23: Admin reports", test_23_admin_reports()))
    results.append(("Test 24: Admin ban/unban", test_24_admin_ban_unban()))
    results.append(("Test 25: Admin report resolve", test_25_admin_report_resolve()))
    results.append(("Test 26: Admin verifications", test_26_admin_verifications()))
    results.append(("Test 27: Admin verify approve", test_27_admin_verify_approve()))
    results.append(("Test 28: Admin verify approve invalid", test_28_admin_verify_approve_invalid()))
    results.append(("Test 29: Admin verify reject", test_29_admin_verify_reject()))
    results.append(("Test 30: Admin analytics", test_30_admin_analytics()))
    
    # C) NEW BILLING ENDPOINTS (4)
    print("\n" + "=" * 80)
    print("💳 C) NEW BILLING ENDPOINTS (4 tests - MOCKED)")
    print("=" * 80)
    results.append(("Test 31: Billing me", test_31_billing_me()))
    results.append(("Test 32: Billing upgrade", test_32_billing_upgrade()))
    results.append(("Test 33: Billing upgrade invalid", test_33_billing_upgrade_invalid()))
    results.append(("Test 34: Billing downgrade", test_34_billing_downgrade()))
    
    # D) NEW PUSH ENDPOINTS (4)
    print("\n" + "=" * 80)
    print("🔔 D) NEW PUSH ENDPOINTS (4 tests - MOCKED)")
    print("=" * 80)
    results.append(("Test 35: Push VAPID", test_35_push_vapid()))
    results.append(("Test 36: Push subscribe", test_36_push_subscribe()))
    results.append(("Test 37: Push subscribe invalid", test_37_push_subscribe_invalid()))
    results.append(("Test 38: Push unsubscribe", test_38_push_unsubscribe()))
    
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
