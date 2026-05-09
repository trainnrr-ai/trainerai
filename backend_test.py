#!/usr/bin/env python3
"""
Comprehensive backend API test for Spottr
Tests all endpoints as specified in the review request
"""

import requests
import uuid
import datetime
from pymongo import MongoClient

# Configuration
BASE_URL = "https://10d9856f-8745-4e2a-b8f9-16f23b1398cc.preview.emergentagent.com"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "spottr"

# Test results tracking
test_results = []

def log_test(test_name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")
    test_results.append({"test": test_name, "passed": passed, "details": details})

def setup_test_user():
    """Create a test user and session in MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Create test user
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": "test@spottr.app",
            "name": "Test User",
            "picture": "",
            "provider": "emergent",
            "createdAt": datetime.datetime.utcnow()
        }
        
        # Clear any existing test user
        db.users.delete_many({"email": "test@spottr.app"})
        db.users.insert_one(user)
        
        # Create session token
        token = "test-token-" + uuid.uuid4().hex
        session = {
            "token": token,
            "userId": user_id,
            "createdAt": datetime.datetime.utcnow(),
            "expiresAt": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        db.sessions.insert_one(session)
        
        print(f"✅ Test user created: {user_id}")
        print(f"✅ Session token: {token}")
        
        return user_id, token
    except Exception as e:
        print(f"❌ Failed to setup test user: {e}")
        return None, None

def test_health_check():
    """Test 1: GET /api/ -> {ok: true, app: 'spottr'}"""
    try:
        response = requests.get(f"{BASE_URL}/api/")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") == True and
            data.get("app") == "spottr"
        )
        log_test("Health check (GET /api/)", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Health check (GET /api/)", False, str(e))
        return False

def test_auth_me_no_cookie():
    """Test 2: GET /api/auth/me (no cookie) -> {user: null}, 200"""
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("user") is None
        )
        log_test("Auth me without cookie", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Auth me without cookie", False, str(e))
        return False

def test_auth_session_missing_sessionid():
    """Test 3a: POST /api/auth/session (missing sessionId) -> 400"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/session", json={})
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            "Missing sessionId" in data.get("error", "")
        )
        log_test("Auth session missing sessionId", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Auth session missing sessionId", False, str(e))
        return False

def test_auth_session_invalid_sessionid():
    """Test 3b: POST /api/auth/session (invalid sessionId) -> 401"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/session", json={"sessionId": "fake-id-123"})
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            "Invalid session" in data.get("error", "")
        )
        log_test("Auth session invalid sessionId", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Auth session invalid sessionId", False, str(e))
        return False

def test_auth_logout_no_cookie():
    """Test 4: POST /api/auth/logout (no cookie) -> {ok: true}"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") == True
        )
        log_test("Logout without cookie", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Logout without cookie", False, str(e))
        return False

def test_profile_me_no_cookie():
    """Test 5: GET /api/profile/me without cookie -> 401"""
    try:
        response = requests.get(f"{BASE_URL}/api/profile/me")
        data = response.json()
        
        passed = response.status_code == 401
        log_test("Profile me without cookie", passed, f"Status: {response.status_code}, Response: {data}")
        return passed
    except Exception as e:
        log_test("Profile me without cookie", False, str(e))
        return False

def test_profile_me_with_cookie_no_profile(token):
    """Test 6: GET /api/profile/me with cookie but no profile -> {profile: null}"""
    try:
        cookies = {"spottr_session": token}
        response = requests.get(f"{BASE_URL}/api/profile/me", cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("profile") is None
        )
        log_test("Profile me with cookie but no profile", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Profile me with cookie but no profile", False, str(e))
        return False

def test_create_profile_no_cookie():
    """Test 7: POST /api/profile without cookie -> 401"""
    try:
        profile_data = {
            "name": "John Doe",
            "age": 28,
            "gender": "Male",
            "city": "San Francisco",
            "gymName": "Gold's Gym",
            "level": "Intermediate",
            "goal": "Bodybuilding",
            "timing": "Morning",
            "bio": "Looking for workout partners",
            "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
        }
        response = requests.post(f"{BASE_URL}/api/profile", json=profile_data)
        data = response.json()
        
        passed = response.status_code == 401
        log_test("Create profile without cookie", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        log_test("Create profile without cookie", False, str(e))
        return False

def test_create_profile_valid(token):
    """Test 8: POST /api/profile with valid data -> {profile: {...}}"""
    try:
        cookies = {"spottr_session": token}
        profile_data = {
            "name": "John Doe",
            "age": 28,
            "gender": "Male",
            "city": "San Francisco",
            "gymName": "Gold's Gym",
            "level": "Intermediate",
            "goal": "Bodybuilding",
            "timing": "Morning",
            "bio": "Looking for workout partners",
            "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
        }
        response = requests.post(f"{BASE_URL}/api/profile", json=profile_data, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "profile" in data and
            data["profile"].get("name") == "John Doe"
        )
        log_test("Create profile with valid data", passed, f"Profile created: {data.get('profile', {}).get('id')}")
        return passed
    except Exception as e:
        log_test("Create profile with valid data", False, str(e))
        return False

def test_create_profile_too_few_photos(token):
    """Test 9: POST /api/profile with 1 photo -> 400"""
    try:
        cookies = {"spottr_session": token}
        profile_data = {
            "name": "Jane Doe",
            "photos": ["https://example.com/photo1.jpg"]
        }
        response = requests.post(f"{BASE_URL}/api/profile", json=profile_data, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            "At least 2 photos required" in data.get("error", "")
        )
        log_test("Create profile with 1 photo", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Create profile with 1 photo", False, str(e))
        return False

def test_create_profile_too_many_photos(token):
    """Test 10: POST /api/profile with 6 photos -> 400"""
    try:
        cookies = {"spottr_session": token}
        profile_data = {
            "name": "Jane Doe",
            "photos": [f"https://example.com/photo{i}.jpg" for i in range(1, 7)]
        }
        response = requests.post(f"{BASE_URL}/api/profile", json=profile_data, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            "Maximum 5 photos allowed" in data.get("error", "")
        )
        log_test("Create profile with 6 photos", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Create profile with 6 photos", False, str(e))
        return False

def test_discover_no_auth():
    """Test 11: GET /api/profiles/discover (no auth) -> returns array of profiles"""
    try:
        response = requests.get(f"{BASE_URL}/api/profiles/discover")
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "profiles" in data and
            isinstance(data["profiles"], list) and
            len(data["profiles"]) >= 20
        )
        log_test("Discover profiles without auth", passed, f"Found {len(data.get('profiles', []))} profiles")
        return passed
    except Exception as e:
        log_test("Discover profiles without auth", False, str(e))
        return False

def test_discover_filter_goal():
    """Test 12: GET /api/profiles/discover?goal=Powerlifting -> only Powerlifting profiles"""
    try:
        response = requests.get(f"{BASE_URL}/api/profiles/discover?goal=Powerlifting")
        data = response.json()
        profiles = data.get("profiles", [])
        
        all_powerlifting = all(p.get("goal") == "Powerlifting" for p in profiles)
        passed = (
            response.status_code == 200 and
            all_powerlifting
        )
        log_test("Discover with goal filter", passed, f"Found {len(profiles)} Powerlifting profiles")
        return passed
    except Exception as e:
        log_test("Discover with goal filter", False, str(e))
        return False

def test_discover_filter_gender():
    """Test 13: GET /api/profiles/discover?gender=Female -> only Female profiles"""
    try:
        response = requests.get(f"{BASE_URL}/api/profiles/discover?gender=Female")
        data = response.json()
        profiles = data.get("profiles", [])
        
        all_female = all(p.get("gender") == "Female" for p in profiles)
        passed = (
            response.status_code == 200 and
            all_female
        )
        log_test("Discover with gender filter", passed, f"Found {len(profiles)} Female profiles")
        return passed
    except Exception as e:
        log_test("Discover with gender filter", False, str(e))
        return False

def test_discover_filter_verified():
    """Test 14: GET /api/profiles/discover?verifiedOnly=true -> only verified profiles"""
    try:
        response = requests.get(f"{BASE_URL}/api/profiles/discover?verifiedOnly=true")
        data = response.json()
        profiles = data.get("profiles", [])
        
        all_verified = all(p.get("verified") == True for p in profiles)
        passed = (
            response.status_code == 200 and
            all_verified
        )
        log_test("Discover with verified filter", passed, f"Found {len(profiles)} verified profiles")
        return passed
    except Exception as e:
        log_test("Discover with verified filter", False, str(e))
        return False

def test_like_no_auth():
    """Test 15: POST /api/profiles/like without cookie -> 401"""
    try:
        response = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": "fake-id"})
        data = response.json()
        
        passed = response.status_code == 401
        log_test("Like profile without auth", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        log_test("Like profile without auth", False, str(e))
        return False

def test_like_with_auth(token):
    """Test 16: POST /api/profiles/like with auth -> {ok:true, matched:false}"""
    try:
        # First get a profile to like
        response = requests.get(f"{BASE_URL}/api/profiles/discover")
        profiles = response.json().get("profiles", [])
        
        if not profiles:
            log_test("Like profile with auth", False, "No profiles available to like")
            return False
        
        profile_id = profiles[0]["id"]
        cookies = {"spottr_session": token}
        response = requests.post(f"{BASE_URL}/api/profiles/like", json={"profileId": profile_id}, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") == True and
            "matched" in data
        )
        log_test("Like profile with auth", passed, f"Response: {data}")
        return passed, profile_id
    except Exception as e:
        log_test("Like profile with auth", False, str(e))
        return False, None

def test_skip_with_auth(token):
    """Test 17: POST /api/profiles/skip with auth -> {ok:true}"""
    try:
        # Get a profile to skip
        response = requests.get(f"{BASE_URL}/api/profiles/discover")
        profiles = response.json().get("profiles", [])
        
        if not profiles:
            log_test("Skip profile with auth", False, "No profiles available to skip")
            return False, None
        
        profile_id = profiles[0]["id"]
        cookies = {"spottr_session": token}
        response = requests.post(f"{BASE_URL}/api/profiles/skip", json={"profileId": profile_id}, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") == True
        )
        log_test("Skip profile with auth", passed, f"Skipped profile: {profile_id}")
        return passed, profile_id
    except Exception as e:
        log_test("Skip profile with auth", False, str(e))
        return False, None

def test_discover_excludes_interacted(token, liked_id, skipped_id):
    """Test: Discover should exclude liked/skipped profiles when authenticated"""
    try:
        cookies = {"spottr_session": token}
        response = requests.get(f"{BASE_URL}/api/profiles/discover", cookies=cookies)
        data = response.json()
        profiles = data.get("profiles", [])
        
        profile_ids = [p["id"] for p in profiles]
        excludes_liked = liked_id not in profile_ids
        excludes_skipped = skipped_id not in profile_ids
        
        passed = excludes_liked and excludes_skipped
        log_test("Discover excludes interacted profiles", passed, 
                f"Liked excluded: {excludes_liked}, Skipped excluded: {excludes_skipped}")
        return passed
    except Exception as e:
        log_test("Discover excludes interacted profiles", False, str(e))
        return False

def test_matches_no_auth():
    """Test 18: GET /api/matches (no cookie) -> 401"""
    try:
        response = requests.get(f"{BASE_URL}/api/matches")
        data = response.json()
        
        passed = response.status_code == 401
        log_test("Matches without auth", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        log_test("Matches without auth", False, str(e))
        return False

def test_matches_with_auth(token):
    """Test 19: GET /api/matches with auth -> {matches: []}"""
    try:
        cookies = {"spottr_session": token}
        response = requests.get(f"{BASE_URL}/api/matches", cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "matches" in data and
            isinstance(data["matches"], list)
        )
        log_test("Matches with auth", passed, f"Found {len(data.get('matches', []))} matches")
        return passed
    except Exception as e:
        log_test("Matches with auth", False, str(e))
        return False

def test_messages_get(token):
    """Test 20: GET /api/messages?matchId=fake -> {messages: []}"""
    try:
        cookies = {"spottr_session": token}
        response = requests.get(f"{BASE_URL}/api/messages?matchId=fake-match-id", cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "messages" in data and
            isinstance(data["messages"], list)
        )
        log_test("Get messages with fake matchId", passed, f"Response: {data}")
        return passed
    except Exception as e:
        log_test("Get messages with fake matchId", False, str(e))
        return False

def test_messages_post_normal(token):
    """Test 21: POST /api/messages with normal text -> {message: {flagged:false}}"""
    try:
        cookies = {"spottr_session": token}
        message_data = {
            "matchId": "fake-match-id",
            "text": "Hey, want to hit the gym tomorrow?"
        }
        response = requests.post(f"{BASE_URL}/api/messages", json=message_data, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "message" in data and
            data["message"].get("flagged") == False
        )
        log_test("Post normal message", passed, f"Message flagged: {data.get('message', {}).get('flagged')}")
        return passed
    except Exception as e:
        log_test("Post normal message", False, str(e))
        return False

def test_messages_post_inappropriate(token):
    """Test 22: POST /api/messages with 'send nudes' -> {message: {flagged:true}}"""
    try:
        cookies = {"spottr_session": token}
        message_data = {
            "matchId": "fake-match-id",
            "text": "Hey can you send nudes?"
        }
        response = requests.post(f"{BASE_URL}/api/messages", json=message_data, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            "message" in data and
            data["message"].get("flagged") == True
        )
        
        # Check if moderation_actions was created
        if passed:
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            message_id = data["message"]["id"]
            moderation = db.moderation_actions.find_one({"messageId": message_id})
            if not moderation:
                passed = False
                log_test("Post inappropriate message", False, "Moderation action not created")
            else:
                log_test("Post inappropriate message", True, f"Message flagged and moderation action created")
        else:
            log_test("Post inappropriate message", False, f"Message not flagged: {data}")
        
        return passed
    except Exception as e:
        log_test("Post inappropriate message", False, str(e))
        return False

def test_messages_post_no_text(token):
    """Test 23: POST /api/messages without text -> 400"""
    try:
        cookies = {"spottr_session": token}
        message_data = {
            "matchId": "fake-match-id"
        }
        response = requests.post(f"{BASE_URL}/api/messages", json=message_data, cookies=cookies)
        data = response.json()
        
        passed = response.status_code == 400
        log_test("Post message without text", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        log_test("Post message without text", False, str(e))
        return False

def test_reports_no_auth():
    """Test 24: POST /api/reports without cookie -> 401"""
    try:
        report_data = {
            "profileId": "fake-profile-id",
            "reason": "Inappropriate behavior"
        }
        response = requests.post(f"{BASE_URL}/api/reports", json=report_data)
        data = response.json()
        
        passed = response.status_code == 401
        log_test("Report without auth", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        log_test("Report without auth", False, str(e))
        return False

def test_reports_with_auth(token):
    """Test 25: POST /api/reports with auth -> {ok: true}"""
    try:
        cookies = {"spottr_session": token}
        report_data = {
            "profileId": "fake-profile-id",
            "reason": "Inappropriate behavior"
        }
        response = requests.post(f"{BASE_URL}/api/reports", json=report_data, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") == True
        )
        
        # Verify report was inserted
        if passed:
            client = MongoClient(MONGO_URL)
            db = client[DB_NAME]
            report = db.reports.find_one({"profileId": "fake-profile-id", "reason": "Inappropriate behavior"})
            if not report:
                passed = False
                log_test("Report with auth", False, "Report not inserted in database")
            else:
                log_test("Report with auth", True, "Report created successfully")
        else:
            log_test("Report with auth", False, f"Response: {data}")
        
        return passed
    except Exception as e:
        log_test("Report with auth", False, str(e))
        return False

def test_blocks_with_auth(token):
    """Test 26: POST /api/blocks with auth -> {ok: true}"""
    try:
        # Get a profile to block
        response = requests.get(f"{BASE_URL}/api/profiles/discover")
        profiles = response.json().get("profiles", [])
        
        if not profiles:
            log_test("Block profile with auth", False, "No profiles available to block")
            return False, None
        
        profile_id = profiles[0]["id"]
        cookies = {"spottr_session": token}
        response = requests.post(f"{BASE_URL}/api/blocks", json={"profileId": profile_id}, cookies=cookies)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") == True
        )
        log_test("Block profile with auth", passed, f"Blocked profile: {profile_id}")
        return passed, profile_id
    except Exception as e:
        log_test("Block profile with auth", False, str(e))
        return False, None

def test_discover_excludes_blocked(token, blocked_id):
    """Test: Discover should exclude blocked profiles"""
    try:
        cookies = {"spottr_session": token}
        response = requests.get(f"{BASE_URL}/api/profiles/discover", cookies=cookies)
        data = response.json()
        profiles = data.get("profiles", [])
        
        profile_ids = [p["id"] for p in profiles]
        excludes_blocked = blocked_id not in profile_ids
        
        passed = excludes_blocked
        log_test("Discover excludes blocked profiles", passed, 
                f"Blocked profile excluded: {excludes_blocked}")
        return passed
    except Exception as e:
        log_test("Discover excludes blocked profiles", False, str(e))
        return False

def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    total = len(test_results)
    passed = sum(1 for r in test_results if r["passed"])
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\nFailed Tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  ❌ {r['test']}")
                if r["details"]:
                    print(f"     {r['details']}")

def main():
    """Run all tests"""
    print("="*60)
    print("SPOTTR BACKEND API TEST SUITE")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print("="*60 + "\n")
    
    # Setup test user
    print("Setting up test user...")
    user_id, token = setup_test_user()
    if not user_id or not token:
        print("❌ Failed to setup test user. Aborting tests.")
        return
    
    print("\nRunning tests...\n")
    
    # Run all tests
    test_health_check()
    test_auth_me_no_cookie()
    test_auth_session_missing_sessionid()
    test_auth_session_invalid_sessionid()
    test_auth_logout_no_cookie()
    test_profile_me_no_cookie()
    test_profile_me_with_cookie_no_profile(token)
    test_create_profile_no_cookie()
    test_create_profile_too_few_photos(token)
    test_create_profile_too_many_photos(token)
    test_create_profile_valid(token)
    test_discover_no_auth()
    test_discover_filter_goal()
    test_discover_filter_gender()
    test_discover_filter_verified()
    test_like_no_auth()
    
    # Like and skip profiles
    like_result = test_like_with_auth(token)
    liked_id = like_result[1] if isinstance(like_result, tuple) else None
    
    skip_result = test_skip_with_auth(token)
    skipped_id = skip_result[1] if isinstance(skip_result, tuple) else None
    
    # Test exclusion
    if liked_id and skipped_id:
        test_discover_excludes_interacted(token, liked_id, skipped_id)
    
    test_matches_no_auth()
    test_matches_with_auth(token)
    test_messages_get(token)
    test_messages_post_normal(token)
    test_messages_post_inappropriate(token)
    test_messages_post_no_text(token)
    test_reports_no_auth()
    test_reports_with_auth(token)
    
    # Block profile and test exclusion
    block_result = test_blocks_with_auth(token)
    blocked_id = block_result[1] if isinstance(block_result, tuple) else None
    
    if blocked_id:
        test_discover_excludes_blocked(token, blocked_id)
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    main()
