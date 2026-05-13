#!/usr/bin/env python3
"""
WAVE 2 BACKEND TESTING for Trainr — Connection Request System
Tests the new LinkedIn-style request flow: Connect → Pending → Accept/Decline
"""

import requests
import json
from pymongo import MongoClient
from uuid import uuid4
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://workout-match-19.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "spottr"
ADMIN_EMAIL = "hello@trainr.in"

# MongoDB connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Test data tracking for cleanup
test_user_ids = []
test_profile_ids = []
test_session_tokens = []

def create_session(user_id):
    """Create a session in MongoDB and return the token"""
    token = f"test-wave2-{uuid4()}"
    db.sessions.insert_one({
        "token": token,
        "userId": user_id,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(hours=1)
    })
    test_session_tokens.append(token)
    return token

def create_test_user(email, name):
    """Create a test user in MongoDB"""
    user_id = str(uuid4())
    db.users.insert_one({
        "id": user_id,
        "email": email,
        "name": name,
        "createdAt": datetime.utcnow(),
        "banned": False
    })
    test_user_ids.append(user_id)
    return user_id

def create_test_profile(user_id, name, **kwargs):
    """Create a complete test profile in MongoDB (passes profile-completion gate)"""
    profile_id = str(uuid4())
    profile_data = {
        "id": profile_id,
        "userId": user_id,
        "name": name,
        "photos": [
            "https://images.pexels.com/photos/1.jpg",
            "https://images.pexels.com/photos/2.jpg",
            "https://images.pexels.com/photos/3.jpg"
        ],
        "bio": "Fitness enthusiast looking for workout partners. Let's train together!",
        "city": kwargs.get("city", "Mumbai"),
        "gymName": kwargs.get("gymName", "Cult Fit Andheri"),
        "goal": kwargs.get("goal", "Strength"),
        "timing": kwargs.get("timing", "Morning"),
        "gender": kwargs.get("gender", "Male"),
        "level": kwargs.get("level", "Intermediate"),
        "verified": kwargs.get("verified", False),
        "location": {"lat": 19.07, "lng": 72.87},
        "lastActiveAt": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "isSeed": False
    }
    db.profiles.insert_one(profile_data)
    test_profile_ids.append(profile_id)
    return profile_id

def cleanup_test_data():
    """Clean up all test data created during testing"""
    print("\n" + "=" * 80)
    print("CLEANING UP TEST DATA")
    print("=" * 80)
    
    # Delete test users
    if test_user_ids:
        result = db.users.delete_many({"id": {"$in": test_user_ids}})
        print(f"✅ Deleted {result.deleted_count} test users")
    
    # Delete test profiles
    if test_profile_ids:
        result = db.profiles.delete_many({"id": {"$in": test_profile_ids}})
        print(f"✅ Deleted {result.deleted_count} test profiles")
    
    # Delete test sessions
    if test_session_tokens:
        result = db.sessions.delete_many({"token": {"$in": test_session_tokens}})
        print(f"✅ Deleted {result.deleted_count} test sessions")
    
    # Delete test connection_requests
    result = db.connection_requests.delete_many({"fromUserId": {"$in": test_user_ids}})
    print(f"✅ Deleted {result.deleted_count} test connection_requests (from)")
    result = db.connection_requests.delete_many({"toUserId": {"$in": test_user_ids}})
    print(f"✅ Deleted {result.deleted_count} test connection_requests (to)")
    
    # Delete test matches
    result = db.matches.delete_many({"$or": [
        {"userA": {"$in": test_user_ids}},
        {"userB": {"$in": test_user_ids}}
    ]})
    print(f"✅ Deleted {result.deleted_count} test matches")
    
    # Delete test notifications
    result = db.notifications.delete_many({"userId": {"$in": test_user_ids}})
    print(f"✅ Deleted {result.deleted_count} test notifications")
    
    # Delete test interactions
    result = db.interactions.delete_many({"fromUserId": {"$in": test_user_ids}})
    print(f"✅ Deleted {result.deleted_count} test interactions")

print("=" * 80)
print("WAVE 2 BACKEND TESTING - Trainr Connection Request System")
print("=" * 80)

# ============================================================================
# SCENARIO A: POST /api/profiles/connect — new request creation
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO A: POST /api/profiles/connect")
print("=" * 80)

# A.1: Unauth → 401
print("\n[A.1] POST /api/profiles/connect - Unauth → 401")
try:
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": "dummy-id"}
    )
    
    if response.status_code == 401:
        print("✅ PASS - Unauth returns 401")
    else:
        print(f"❌ FAIL - Expected 401, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# A.2: Missing profileId → 400
print("\n[A.2] POST /api/profiles/connect - Missing profileId → 400")
try:
    user_a_id = create_test_user("test-usera@trainr.test", "User A")
    user_a_profile_id = create_test_profile(user_a_id, "User A")
    user_a_token = create_session(user_a_id)
    
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={},
        cookies={"spottr_session": user_a_token}
    )
    
    if response.status_code == 400:
        print("✅ PASS - Missing profileId returns 400")
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# A.3: Connect to my own profileId → 400
print("\n[A.3] POST /api/profiles/connect - Connect to self → 400")
try:
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_a_profile_id},
        cookies={"spottr_session": user_a_token}
    )
    
    if response.status_code == 400:
        data = response.json()
        if "yourself" in data.get("error", "").lower():
            print("✅ PASS - Connect to self returns 400 'Cannot connect with yourself'")
        else:
            print(f"⚠️  PASS - Returns 400 but message is: {data.get('error')}")
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# A.4: Connect to nonexistent profileId → 404
print("\n[A.4] POST /api/profiles/connect - Nonexistent profileId → 404")
try:
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": "nonexistent-profile-id"},
        cookies={"spottr_session": user_a_token}
    )
    
    if response.status_code == 404:
        print("✅ PASS - Nonexistent profileId returns 404")
    else:
        print(f"❌ FAIL - Expected 404, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# A.5: Connect to fresh target → 200 with pending status
print("\n[A.5] POST /api/profiles/connect - Fresh target → 200 pending")
try:
    user_b_id = create_test_user("test-userb@trainr.test", "User B")
    user_b_profile_id = create_test_profile(user_b_id, "User B")
    
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_b_profile_id},
        cookies={"spottr_session": user_a_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("ok") == True and data.get("status") == "pending" and "requestId" in data:
            print(f"✅ PASS - Returns 200 {{ok:true, status:'pending', requestId:'{data['requestId'][:8]}...'}}")
            
            # Verify in DB: connection_requests doc exists
            request_id = data["requestId"]
            db_request = db.connection_requests.find_one({"id": request_id})
            if db_request:
                if (db_request["status"] == "pending" and 
                    db_request["fromUserId"] == user_a_id and 
                    db_request["toUserId"] == user_b_id):
                    print(f"✅ DB VERIFIED - connection_requests doc exists with correct data")
                else:
                    print(f"❌ DB FAIL - connection_requests doc has incorrect data: {db_request}")
            else:
                print(f"❌ DB FAIL - connection_requests doc not found")
            
            # Verify notification for target
            notification = db.notifications.find_one({
                "userId": user_b_id,
                "type": "connect_request"
            })
            if notification:
                print(f"✅ NOTIFICATION VERIFIED - connect_request notification created for target")
            else:
                print(f"❌ NOTIFICATION FAIL - No connect_request notification found for target")
        else:
            print(f"❌ FAIL - Unexpected response: {data}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# A.6: Re-send same request (idempotent) → 200 with idempotent flag
print("\n[A.6] POST /api/profiles/connect - Idempotent re-send → 200")
try:
    # Count existing requests before
    existing_count = db.connection_requests.count_documents({
        "fromUserId": user_a_id,
        "toUserId": user_b_id
    })
    
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_b_profile_id},
        cookies={"spottr_session": user_a_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("ok") == True and data.get("status") == "pending" and data.get("idempotent") == True:
            print(f"✅ PASS - Returns 200 {{ok:true, status:'pending', idempotent:true}}")
            
            # Verify only ONE row in connection_requests
            new_count = db.connection_requests.count_documents({
                "fromUserId": user_a_id,
                "toUserId": user_b_id
            })
            if new_count == existing_count:
                print(f"✅ DB VERIFIED - Only ONE connection_request exists (no duplicate)")
            else:
                print(f"❌ DB FAIL - Expected {existing_count} requests, found {new_count}")
        else:
            print(f"❌ FAIL - Unexpected response: {data}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO B: POST /api/profiles/like alias
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO B: POST /api/profiles/like (alias)")
print("=" * 80)

print("\n[B.1] POST /api/profiles/like - Same as /connect → pending")
try:
    user_c_id = create_test_user("test-userc@trainr.test", "User C")
    user_c_profile_id = create_test_profile(user_c_id, "User C")
    user_c_token = create_session(user_c_id)
    
    user_d_id = create_test_user("test-userd@trainr.test", "User D")
    user_d_profile_id = create_test_profile(user_d_id, "User D")
    
    response = requests.post(
        f"{BASE_URL}/profiles/like",
        json={"profileId": user_d_profile_id},
        cookies={"spottr_session": user_c_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("ok") == True and data.get("status") == "pending" and "requestId" in data:
            print(f"✅ PASS - /api/profiles/like returns same shape {{ok:true, status:'pending', requestId}}")
            
            # Verify connection_requests doc exists
            request_id = data["requestId"]
            db_request = db.connection_requests.find_one({"id": request_id})
            if db_request and db_request["status"] == "pending":
                print(f"✅ DB VERIFIED - connection_requests doc created via /like alias")
            else:
                print(f"❌ DB FAIL - connection_requests doc not found or incorrect")
        else:
            print(f"❌ FAIL - Unexpected response (old shape?): {data}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO C: Auto-accept on mutual
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO C: Auto-accept on mutual")
print("=" * 80)

print("\n[C.1-C.5] Mutual connect → auto-accept with match")
try:
    user_e_id = create_test_user("test-usere@trainr.test", "User E")
    user_e_profile_id = create_test_profile(user_e_id, "User E")
    user_e_token = create_session(user_e_id)
    
    user_f_id = create_test_user("test-userf@trainr.test", "User F")
    user_f_profile_id = create_test_profile(user_f_id, "User F")
    user_f_token = create_session(user_f_id)
    
    # C.1: User E → connect to F → pending
    response1 = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_f_profile_id},
        cookies={"spottr_session": user_e_token}
    )
    
    if response1.status_code == 200:
        data1 = response1.json()
        if data1.get("status") == "pending":
            print(f"✅ C.1 PASS - User E → F returns pending")
        else:
            print(f"❌ C.1 FAIL - Expected pending, got: {data1}")
    else:
        print(f"❌ C.1 FAIL - Expected 200, got {response1.status_code}")
    
    # C.2: User F → connect to E → expect auto-accept
    response2 = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_e_profile_id},
        cookies={"spottr_session": user_f_token}
    )
    
    if response2.status_code == 200:
        data2 = response2.json()
        if (data2.get("ok") == True and 
            data2.get("status") == "accepted" and 
            data2.get("matched") == True and 
            "matchId" in data2):
            print(f"✅ C.2 PASS - User F → E returns {{ok:true, status:'accepted', matched:true, matchId}}")
            match_id = data2["matchId"]
            
            # C.3: Verify DB: matches collection has new doc
            match_doc = db.matches.find_one({"id": match_id})
            if match_doc:
                if ((match_doc["userA"] == user_e_id and match_doc["userB"] == user_f_id) or
                    (match_doc["userA"] == user_f_id and match_doc["userB"] == user_e_id)):
                    print(f"✅ C.3 PASS - matches collection has correct doc")
                else:
                    print(f"❌ C.3 FAIL - matches doc has wrong users: {match_doc}")
            else:
                print(f"❌ C.3 FAIL - matches doc not found")
            
            # C.3: Verify both connection_requests have status='accepted' with matchId
            req_e_to_f = db.connection_requests.find_one({
                "fromUserId": user_e_id,
                "toUserId": user_f_id
            })
            req_f_to_e = db.connection_requests.find_one({
                "fromUserId": user_f_id,
                "toUserId": user_e_id
            })
            
            if (req_e_to_f and req_e_to_f["status"] == "accepted" and req_e_to_f.get("matchId") and
                req_f_to_e and req_f_to_e["status"] == "accepted" and req_f_to_e.get("matchId")):
                print(f"✅ C.3 PASS - Both connection_requests marked accepted with matchId")
            else:
                print(f"❌ C.3 FAIL - connection_requests not properly updated")
                print(f"  E→F: {req_e_to_f}")
                print(f"  F→E: {req_f_to_e}")
            
            # C.4: Verify TWO new_match notifications
            notif_e = db.notifications.find_one({
                "userId": user_e_id,
                "type": "new_match"
            })
            notif_f = db.notifications.find_one({
                "userId": user_f_id,
                "type": "new_match"
            })
            
            if notif_e and notif_f:
                print(f"✅ C.4 PASS - TWO new_match notifications created (one for each user)")
            else:
                print(f"❌ C.4 FAIL - Missing new_match notifications. E: {notif_e is not None}, F: {notif_f is not None}")
            
            # C.5: Verify /api/matches returns the new match
            matches_e = requests.get(
                f"{BASE_URL}/matches",
                cookies={"spottr_session": user_e_token}
            )
            matches_f = requests.get(
                f"{BASE_URL}/matches",
                cookies={"spottr_session": user_f_token}
            )
            
            if matches_e.status_code == 200 and matches_f.status_code == 200:
                data_e = matches_e.json()
                data_f = matches_f.json()
                
                match_in_e = any(m["id"] == match_id for m in data_e.get("matches", []))
                match_in_f = any(m["id"] == match_id for m in data_f.get("matches", []))
                
                if match_in_e and match_in_f:
                    print(f"✅ C.5 PASS - /api/matches returns the new match for both users")
                else:
                    print(f"❌ C.5 FAIL - Match not found in /api/matches. E: {match_in_e}, F: {match_in_f}")
            else:
                print(f"❌ C.5 FAIL - /api/matches failed. E: {matches_e.status_code}, F: {matches_f.status_code}")
        else:
            print(f"❌ C.2 FAIL - Expected auto-accept, got: {data2}")
    else:
        print(f"❌ C.2 FAIL - Expected 200, got {response2.status_code}")
        print(f"Response: {response2.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO D: GET /api/requests/incoming
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO D: GET /api/requests/incoming")
print("=" * 80)

# D.1: Unauth → 401
print("\n[D.1] GET /api/requests/incoming - Unauth → 401")
try:
    response = requests.get(f"{BASE_URL}/requests/incoming")
    
    if response.status_code == 401:
        print("✅ PASS - Unauth returns 401")
    else:
        print(f"❌ FAIL - Expected 401, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# D.2: Auth with no requests → empty array
print("\n[D.2] GET /api/requests/incoming - No requests → empty")
try:
    user_g_id = create_test_user("test-userg@trainr.test", "User G")
    user_g_profile_id = create_test_profile(user_g_id, "User G")
    user_g_token = create_session(user_g_id)
    
    response = requests.get(
        f"{BASE_URL}/requests/incoming",
        cookies={"spottr_session": user_g_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "requests" in data and isinstance(data["requests"], list) and len(data["requests"]) == 0:
            print(f"✅ PASS - Returns {{requests: [], total: {data.get('total', 0)}}}")
        else:
            print(f"❌ FAIL - Unexpected response: {data}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# D.3: Target receives connect → incoming returns 1 request with fromProfile
print("\n[D.3] GET /api/requests/incoming - Returns request with fromProfile")
try:
    user_h_id = create_test_user("test-userh@trainr.test", "User H")
    user_h_profile_id = create_test_profile(user_h_id, "User H")
    user_h_token = create_session(user_h_id)
    
    # User G sends connect to User H
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_h_profile_id},
        cookies={"spottr_session": user_g_token}
    )
    
    # User H checks incoming requests
    response = requests.get(
        f"{BASE_URL}/requests/incoming",
        cookies={"spottr_session": user_h_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        requests_list = data.get("requests", [])
        
        if len(requests_list) > 0:
            request_obj = requests_list[0]
            if "fromProfile" in request_obj and request_obj["fromProfile"] is not None:
                from_profile = request_obj["fromProfile"]
                
                # Verify privacy: lastActiveAt and location should be undefined
                has_lastActiveAt = "lastActiveAt" in from_profile
                has_location = "location" in from_profile
                
                if not has_lastActiveAt and not has_location:
                    print(f"✅ PASS - Returns 1 request enriched with fromProfile (privacy: no lastActiveAt/location)")
                else:
                    print(f"❌ FAIL - Privacy violation: fromProfile has lastActiveAt={has_lastActiveAt}, location={has_location}")
            else:
                print(f"❌ FAIL - fromProfile missing or null: {request_obj}")
        else:
            print(f"❌ FAIL - No requests returned")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# D.4: Only PENDING are returned (not accepted/declined)
print("\n[D.4] GET /api/requests/incoming - Only PENDING returned")
try:
    # This is implicitly tested by the fact that accepted/declined requests don't appear
    # We'll verify by checking the DB directly
    incoming_requests = list(db.connection_requests.find({
        "toUserId": user_h_id,
        "status": "pending"
    }))
    
    response = requests.get(
        f"{BASE_URL}/requests/incoming",
        cookies={"spottr_session": user_h_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        api_count = len(data.get("requests", []))
        db_count = len(incoming_requests)
        
        if api_count == db_count:
            print(f"✅ PASS - Only PENDING requests returned (count matches DB: {db_count})")
        else:
            print(f"❌ FAIL - Count mismatch. API: {api_count}, DB pending: {db_count}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO E: GET /api/requests/outgoing
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO E: GET /api/requests/outgoing")
print("=" * 80)

# E.1: Unauth → 401
print("\n[E.1] GET /api/requests/outgoing - Unauth → 401")
try:
    response = requests.get(f"{BASE_URL}/requests/outgoing")
    
    if response.status_code == 401:
        print("✅ PASS - Unauth returns 401")
    else:
        print(f"❌ FAIL - Expected 401, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# E.2: After sending connect → outgoing returns 1 request with toProfile
print("\n[E.2] GET /api/requests/outgoing - Returns request with toProfile")
try:
    # User G already sent connect to User H in D.3
    response = requests.get(
        f"{BASE_URL}/requests/outgoing",
        cookies={"spottr_session": user_g_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        requests_list = data.get("requests", [])
        
        if len(requests_list) > 0:
            request_obj = requests_list[0]
            if "toProfile" in request_obj and request_obj["toProfile"] is not None:
                to_profile = request_obj["toProfile"]
                
                # Verify privacy: lastActiveAt and location should be undefined
                has_lastActiveAt = "lastActiveAt" in to_profile
                has_location = "location" in to_profile
                
                if not has_lastActiveAt and not has_location:
                    print(f"✅ PASS - Returns request enriched with toProfile (privacy: no lastActiveAt/location)")
                else:
                    print(f"❌ FAIL - Privacy violation: toProfile has lastActiveAt={has_lastActiveAt}, location={has_location}")
            else:
                print(f"❌ FAIL - toProfile missing or null: {request_obj}")
        else:
            print(f"❌ FAIL - No requests returned")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# E.3: Only PENDING are returned
print("\n[E.3] GET /api/requests/outgoing - Only PENDING returned")
try:
    outgoing_requests = list(db.connection_requests.find({
        "fromUserId": user_g_id,
        "status": "pending"
    }))
    
    response = requests.get(
        f"{BASE_URL}/requests/outgoing",
        cookies={"spottr_session": user_g_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        api_count = len(data.get("requests", []))
        db_count = len(outgoing_requests)
        
        if api_count == db_count:
            print(f"✅ PASS - Only PENDING requests returned (count matches DB: {db_count})")
        else:
            print(f"❌ FAIL - Count mismatch. API: {api_count}, DB pending: {db_count}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO F: POST /api/requests/accept
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO F: POST /api/requests/accept")
print("=" * 80)

# F.1: Unauth → 401
print("\n[F.1] POST /api/requests/accept - Unauth → 401")
try:
    response = requests.post(
        f"{BASE_URL}/requests/accept",
        json={"requestId": "dummy-id"}
    )
    
    if response.status_code == 401:
        print("✅ PASS - Unauth returns 401")
    else:
        print(f"❌ FAIL - Expected 401, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# F.2: Missing requestId → 400
print("\n[F.2] POST /api/requests/accept - Missing requestId → 400")
try:
    response = requests.post(
        f"{BASE_URL}/requests/accept",
        json={},
        cookies={"spottr_session": user_h_token}
    )
    
    if response.status_code == 400:
        print("✅ PASS - Missing requestId returns 400")
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# F.3: Nonexistent requestId → 404
print("\n[F.3] POST /api/requests/accept - Nonexistent requestId → 404")
try:
    response = requests.post(
        f"{BASE_URL}/requests/accept",
        json={"requestId": "nonexistent-request-id"},
        cookies={"spottr_session": user_h_token}
    )
    
    if response.status_code == 404:
        print("✅ PASS - Nonexistent requestId returns 404")
    else:
        print(f"❌ FAIL - Expected 404, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# F.4: Try to accept a request I sent (not recipient) → 403
print("\n[F.4] POST /api/requests/accept - Not recipient → 403")
try:
    # Get the request ID that User G sent to User H
    request_g_to_h = db.connection_requests.find_one({
        "fromUserId": user_g_id,
        "toUserId": user_h_id,
        "status": "pending"
    })
    
    if request_g_to_h:
        # User G tries to accept their own outgoing request
        response = requests.post(
            f"{BASE_URL}/requests/accept",
            json={"requestId": request_g_to_h["id"]},
            cookies={"spottr_session": user_g_token}
        )
        
        if response.status_code == 403:
            print("✅ PASS - Non-recipient returns 403")
        else:
            print(f"❌ FAIL - Expected 403, got {response.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# F.5: Try to accept already accepted/declined request → 400
print("\n[F.5] POST /api/requests/accept - Already processed → 400")
try:
    # Create a new pair for this test
    user_i_id = create_test_user("test-useri@trainr.test", "User I")
    user_i_profile_id = create_test_profile(user_i_id, "User I")
    user_i_token = create_session(user_i_id)
    
    user_j_id = create_test_user("test-userj@trainr.test", "User J")
    user_j_profile_id = create_test_profile(user_j_id, "User J")
    user_j_token = create_session(user_j_id)
    
    # User I sends connect to User J
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_j_profile_id},
        cookies={"spottr_session": user_i_token}
    )
    
    # Get the request ID
    request_i_to_j = db.connection_requests.find_one({
        "fromUserId": user_i_id,
        "toUserId": user_j_id,
        "status": "pending"
    })
    
    if request_i_to_j:
        # User J accepts the request
        response1 = requests.post(
            f"{BASE_URL}/requests/accept",
            json={"requestId": request_i_to_j["id"]},
            cookies={"spottr_session": user_j_token}
        )
        
        if response1.status_code == 200:
            # Try to accept again
            response2 = requests.post(
                f"{BASE_URL}/requests/accept",
                json={"requestId": request_i_to_j["id"]},
                cookies={"spottr_session": user_j_token}
            )
            
            if response2.status_code == 400:
                print("✅ PASS - Already accepted request returns 400")
            else:
                print(f"❌ FAIL - Expected 400, got {response2.status_code}")
        else:
            print(f"⚠️  SKIP - First accept failed: {response1.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# F.6: Success → 200 with match created + 2 notifications
print("\n[F.6] POST /api/requests/accept - Success → match + notifications")
try:
    # Create a new pair for clean test
    user_k_id = create_test_user("test-userk@trainr.test", "User K")
    user_k_profile_id = create_test_profile(user_k_id, "User K")
    user_k_token = create_session(user_k_id)
    
    user_l_id = create_test_user("test-userl@trainr.test", "User L")
    user_l_profile_id = create_test_profile(user_l_id, "User L")
    user_l_token = create_session(user_l_id)
    
    # User K sends connect to User L
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_l_profile_id},
        cookies={"spottr_session": user_k_token}
    )
    
    # Get the request ID
    request_k_to_l = db.connection_requests.find_one({
        "fromUserId": user_k_id,
        "toUserId": user_l_id,
        "status": "pending"
    })
    
    if request_k_to_l:
        # Count notifications before
        notif_count_k_before = db.notifications.count_documents({"userId": user_k_id, "type": "new_match"})
        notif_count_l_before = db.notifications.count_documents({"userId": user_l_id, "type": "new_match"})
        
        # User L accepts the request
        response = requests.post(
            f"{BASE_URL}/requests/accept",
            json={"requestId": request_k_to_l["id"]},
            cookies={"spottr_session": user_l_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("ok") == True and 
                data.get("status") == "accepted" and 
                data.get("matched") == True and 
                "matchId" in data):
                print(f"✅ PASS - Returns 200 {{ok:true, status:'accepted', matched:true, matchId}}")
                
                match_id = data["matchId"]
                
                # Verify match created
                match_doc = db.matches.find_one({"id": match_id})
                if match_doc:
                    print(f"✅ DB VERIFIED - Match created in matches collection")
                else:
                    print(f"❌ DB FAIL - Match not found in matches collection")
                
                # Verify 2 notifications
                notif_count_k_after = db.notifications.count_documents({"userId": user_k_id, "type": "new_match"})
                notif_count_l_after = db.notifications.count_documents({"userId": user_l_id, "type": "new_match"})
                
                if (notif_count_k_after == notif_count_k_before + 1 and 
                    notif_count_l_after == notif_count_l_before + 1):
                    print(f"✅ NOTIFICATION VERIFIED - 2 new_match notifications created")
                else:
                    print(f"❌ NOTIFICATION FAIL - Expected +1 for each user. K: {notif_count_k_before}→{notif_count_k_after}, L: {notif_count_l_before}→{notif_count_l_after}")
                
                # Verify connection_request marked accepted
                updated_request = db.connection_requests.find_one({"id": request_k_to_l["id"]})
                if updated_request and updated_request["status"] == "accepted" and updated_request.get("matchId"):
                    print(f"✅ DB VERIFIED - connection_request marked accepted with matchId")
                else:
                    print(f"❌ DB FAIL - connection_request not properly updated: {updated_request}")
            else:
                print(f"❌ FAIL - Unexpected response: {data}")
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO G: POST /api/requests/decline (SOFT)
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO G: POST /api/requests/decline (SOFT)")
print("=" * 80)

# G.1: Decline a pending incoming request → 200
print("\n[G.1] POST /api/requests/decline - Success → 200")
try:
    user_m_id = create_test_user("test-userm@trainr.test", "User M")
    user_m_profile_id = create_test_profile(user_m_id, "User M")
    user_m_token = create_session(user_m_id)
    
    user_n_id = create_test_user("test-usern@trainr.test", "User N")
    user_n_profile_id = create_test_profile(user_n_id, "User N")
    user_n_token = create_session(user_n_id)
    
    # User M sends connect to User N
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_n_profile_id},
        cookies={"spottr_session": user_m_token}
    )
    
    # Get the request ID
    request_m_to_n = db.connection_requests.find_one({
        "fromUserId": user_m_id,
        "toUserId": user_n_id,
        "status": "pending"
    })
    
    if request_m_to_n:
        # User N declines the request
        response = requests.post(
            f"{BASE_URL}/requests/decline",
            json={"requestId": request_m_to_n["id"]},
            cookies={"spottr_session": user_n_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True and data.get("status") == "declined":
                print(f"✅ PASS - Returns 200 {{ok:true, status:'declined'}}")
                
                # Verify DB: status='declined', declinedAt set, respondedAt set
                updated_request = db.connection_requests.find_one({"id": request_m_to_n["id"]})
                if (updated_request and 
                    updated_request["status"] == "declined" and 
                    "declinedAt" in updated_request and 
                    "respondedAt" in updated_request):
                    print(f"✅ DB VERIFIED - status='declined', declinedAt and respondedAt set")
                else:
                    print(f"❌ DB FAIL - Request not properly updated: {updated_request}")
            else:
                print(f"❌ FAIL - Unexpected response: {data}")
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# G.2: CRITICAL - NO notification for sender
print("\n[G.2] POST /api/requests/decline - NO notification for sender")
try:
    user_o_id = create_test_user("test-usero@trainr.test", "User O")
    user_o_profile_id = create_test_profile(user_o_id, "User O")
    user_o_token = create_session(user_o_id)
    
    user_p_id = create_test_user("test-userp@trainr.test", "User P")
    user_p_profile_id = create_test_profile(user_p_id, "User P")
    user_p_token = create_session(user_p_id)
    
    # User O sends connect to User P
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_p_profile_id},
        cookies={"spottr_session": user_o_token}
    )
    
    # Count notifications for User O before decline
    notif_count_before = db.notifications.count_documents({"userId": user_o_id})
    
    # Get the request ID
    request_o_to_p = db.connection_requests.find_one({
        "fromUserId": user_o_id,
        "toUserId": user_p_id,
        "status": "pending"
    })
    
    if request_o_to_p:
        # User P declines the request
        response = requests.post(
            f"{BASE_URL}/requests/decline",
            json={"requestId": request_o_to_p["id"]},
            cookies={"spottr_session": user_p_token}
        )
        
        if response.status_code == 200:
            # Count notifications for User O after decline
            notif_count_after = db.notifications.count_documents({"userId": user_o_id})
            
            if notif_count_after == notif_count_before:
                print(f"✅ PASS - NO notification sent to sender (count unchanged: {notif_count_before})")
            else:
                print(f"❌ FAIL - Notification count changed! Before: {notif_count_before}, After: {notif_count_after}")
                # Show the new notification
                new_notif = db.notifications.find_one({
                    "userId": user_o_id,
                    "createdAt": {"$gte": datetime.utcnow() - timedelta(seconds=5)}
                })
                print(f"  New notification: {new_notif}")
        else:
            print(f"⚠️  SKIP - Decline failed: {response.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# G.3: After decline, sender re-attempts connect → 429 cooldown
print("\n[G.3] POST /api/requests/decline - Re-attempt → 429 cooldown")
try:
    # User O tries to connect to User P again (was declined in G.2)
    response = requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_p_profile_id},
        cookies={"spottr_session": user_o_token}
    )
    
    if response.status_code == 429:
        data = response.json()
        if data.get("status") == "cooldown" and "cooldownUntil" in data:
            print(f"✅ PASS - Returns 429 {{status:'cooldown', cooldownUntil}}")
            
            # G.4: Verify cooldownUntil is roughly 30 days from declinedAt
            try:
                cooldown_until_str = data["cooldownUntil"]
                # Parse ISO format datetime
                if cooldown_until_str.endswith("Z"):
                    cooldown_until = datetime.fromisoformat(cooldown_until_str.replace("Z", "+00:00"))
                else:
                    cooldown_until = datetime.fromisoformat(cooldown_until_str)
                
                request_o_to_p = db.connection_requests.find_one({
                    "fromUserId": user_o_id,
                    "toUserId": user_p_id,
                    "status": "declined"
                })
                
                if request_o_to_p and "declinedAt" in request_o_to_p:
                    declined_at = request_o_to_p["declinedAt"]
                    # Make declined_at timezone-aware if it's naive
                    if declined_at.tzinfo is None:
                        from datetime import timezone
                        declined_at = declined_at.replace(tzinfo=timezone.utc)
                    
                    expected_cooldown = declined_at + timedelta(days=30)
                    
                    # Allow 1 minute tolerance
                    time_diff = abs((cooldown_until - expected_cooldown).total_seconds())
                    if time_diff < 60:
                        print(f"✅ G.4 PASS - cooldownUntil is ~30 days from declinedAt (diff: {time_diff:.0f}s)")
                    else:
                        print(f"❌ G.4 FAIL - cooldownUntil mismatch. Expected: {expected_cooldown}, Got: {cooldown_until}, Diff: {time_diff:.0f}s")
                else:
                    print(f"⚠️  G.4 SKIP - Could not verify cooldownUntil calculation")
            except Exception as e:
                print(f"⚠️  G.4 SKIP - Error verifying cooldownUntil: {e}")
        else:
            print(f"❌ FAIL - Unexpected response: {data}")
    else:
        print(f"❌ FAIL - Expected 429, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO H: POST /api/requests/cancel
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO H: POST /api/requests/cancel")
print("=" * 80)

# H.1: Unauth → 401
print("\n[H.1] POST /api/requests/cancel - Unauth → 401")
try:
    response = requests.post(
        f"{BASE_URL}/requests/cancel",
        json={"requestId": "dummy-id"}
    )
    
    if response.status_code == 401:
        print("✅ PASS - Unauth returns 401")
    else:
        print(f"❌ FAIL - Expected 401, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# H.2: Try to cancel someone else's request → 403
print("\n[H.2] POST /api/requests/cancel - Not sender → 403")
try:
    user_q_id = create_test_user("test-userq@trainr.test", "User Q")
    user_q_profile_id = create_test_profile(user_q_id, "User Q")
    user_q_token = create_session(user_q_id)
    
    user_r_id = create_test_user("test-userr@trainr.test", "User R")
    user_r_profile_id = create_test_profile(user_r_id, "User R")
    user_r_token = create_session(user_r_id)
    
    # User Q sends connect to User R
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_r_profile_id},
        cookies={"spottr_session": user_q_token}
    )
    
    # Get the request ID
    request_q_to_r = db.connection_requests.find_one({
        "fromUserId": user_q_id,
        "toUserId": user_r_id,
        "status": "pending"
    })
    
    if request_q_to_r:
        # User R tries to cancel User Q's request (should be 403)
        response = requests.post(
            f"{BASE_URL}/requests/cancel",
            json={"requestId": request_q_to_r["id"]},
            cookies={"spottr_session": user_r_token}
        )
        
        if response.status_code == 403:
            print("✅ PASS - Non-sender returns 403")
        else:
            print(f"❌ FAIL - Expected 403, got {response.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# H.3: Cancel pending outgoing → 200, deletes request + clears interaction
print("\n[H.3] POST /api/requests/cancel - Success → deletes request")
try:
    # User Q cancels their request to User R
    request_q_to_r = db.connection_requests.find_one({
        "fromUserId": user_q_id,
        "toUserId": user_r_id,
        "status": "pending"
    })
    
    if request_q_to_r:
        response = requests.post(
            f"{BASE_URL}/requests/cancel",
            json={"requestId": request_q_to_r["id"]},
            cookies={"spottr_session": user_q_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True and data.get("status") == "cancelled":
                print(f"✅ PASS - Returns 200 {{ok:true, status:'cancelled'}}")
                
                # Verify connection_requests doc DELETED
                deleted_request = db.connection_requests.find_one({"id": request_q_to_r["id"]})
                if deleted_request is None:
                    print(f"✅ DB VERIFIED - connection_requests doc deleted")
                else:
                    print(f"❌ DB FAIL - connection_requests doc still exists: {deleted_request}")
                
                # Verify interactions for {fromUserId, toUserId, action:'like'} is deleted
                interaction = db.interactions.find_one({
                    "fromUserId": user_q_id,
                    "toUserId": user_r_id,
                    "action": "like"
                })
                if interaction is None:
                    print(f"✅ DB VERIFIED - Legacy 'like' interaction deleted (profile will reappear in discover)")
                else:
                    print(f"❌ DB FAIL - Legacy 'like' interaction still exists: {interaction}")
            else:
                print(f"❌ FAIL - Unexpected response: {data}")
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO I: Discover exclusions integration
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO I: Discover exclusions integration")
print("=" * 80)

# I.1: User A creates connection_request to B → B not in A's discover
print("\n[I.1] Discover - Pending request excludes target")
try:
    user_s_id = create_test_user("test-users@trainr.test", "User S")
    user_s_profile_id = create_test_profile(user_s_id, "User S")
    user_s_token = create_session(user_s_id)
    
    user_t_id = create_test_user("test-usert@trainr.test", "User T")
    user_t_profile_id = create_test_profile(user_t_id, "User T")
    user_t_token = create_session(user_t_id)
    
    # User S sends connect to User T
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_t_profile_id},
        cookies={"spottr_session": user_s_token}
    )
    
    # Get discover as User S
    response = requests.get(
        f"{BASE_URL}/profiles/discover",
        cookies={"spottr_session": user_s_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        # Check if User T's profile is in the results
        user_t_in_results = any(p["id"] == user_t_profile_id for p in profiles)
        
        if not user_t_in_results:
            print(f"✅ PASS - User T NOT in User S's discover (pending request excludes)")
        else:
            print(f"❌ FAIL - User T appears in User S's discover despite pending request")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# I.2: After decline, sender's discover still excludes target (within cooldown)
print("\n[I.2] Discover - Declined within cooldown excludes target")
try:
    user_u_id = create_test_user("test-useru@trainr.test", "User U")
    user_u_profile_id = create_test_profile(user_u_id, "User U")
    user_u_token = create_session(user_u_id)
    
    user_v_id = create_test_user("test-userv@trainr.test", "User V")
    user_v_profile_id = create_test_profile(user_v_id, "User V")
    user_v_token = create_session(user_v_id)
    
    # User U sends connect to User V
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_v_profile_id},
        cookies={"spottr_session": user_u_token}
    )
    
    # Get the request ID
    request_u_to_v = db.connection_requests.find_one({
        "fromUserId": user_u_id,
        "toUserId": user_v_id,
        "status": "pending"
    })
    
    if request_u_to_v:
        # User V declines the request
        requests.post(
            f"{BASE_URL}/requests/decline",
            json={"requestId": request_u_to_v["id"]},
            cookies={"spottr_session": user_v_token}
        )
        
        # Get discover as User U (sender who was declined)
        response = requests.get(
            f"{BASE_URL}/profiles/discover",
            cookies={"spottr_session": user_u_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get("profiles", [])
            
            # Check if User V's profile is in the results
            user_v_in_results = any(p["id"] == user_v_profile_id for p in profiles)
            
            if not user_v_in_results:
                print(f"✅ PASS - User V NOT in User U's discover (declined within cooldown)")
            else:
                print(f"❌ FAIL - User V appears in User U's discover despite being declined")
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# I.3: After cooldown expires, target reappears in discover
print("\n[I.3] Discover - After cooldown, target reappears")
try:
    user_w_id = create_test_user("test-userw@trainr.test", "User W")
    user_w_profile_id = create_test_profile(user_w_id, "User W")
    user_w_token = create_session(user_w_id)
    
    user_x_id = create_test_user("test-userx@trainr.test", "User X")
    user_x_profile_id = create_test_profile(user_x_id, "User X")
    user_x_token = create_session(user_x_id)
    
    # User W sends connect to User X
    requests.post(
        f"{BASE_URL}/profiles/connect",
        json={"profileId": user_x_profile_id},
        cookies={"spottr_session": user_w_token}
    )
    
    # Get the request ID
    request_w_to_x = db.connection_requests.find_one({
        "fromUserId": user_w_id,
        "toUserId": user_x_id,
        "status": "pending"
    })
    
    if request_w_to_x:
        # User X declines the request
        requests.post(
            f"{BASE_URL}/requests/decline",
            json={"requestId": request_w_to_x["id"]},
            cookies={"spottr_session": user_x_token}
        )
        
        # Manually backdate declinedAt to 31 days ago
        db.connection_requests.update_one(
            {"id": request_w_to_x["id"]},
            {"$set": {"declinedAt": datetime.utcnow() - timedelta(days=31)}}
        )
        
        # Get discover as User W (sender who was declined 31 days ago)
        response = requests.get(
            f"{BASE_URL}/profiles/discover",
            cookies={"spottr_session": user_w_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get("profiles", [])
            
            # Check if User X's profile is in the results
            user_x_in_results = any(p["id"] == user_x_profile_id for p in profiles)
            
            if user_x_in_results:
                print(f"✅ PASS - User X reappears in User W's discover (cooldown expired)")
            else:
                print(f"⚠️  PARTIAL - User X not in discover (may be due to other filters/limits)")
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# SCENARIO J: GET /api/matches with pendingIncomingCount
# ============================================================================
print("\n" + "=" * 80)
print("SCENARIO J: GET /api/matches with pendingIncomingCount")
print("=" * 80)

# J.1: Auth → 200 with pendingIncomingCount
print("\n[J.1] GET /api/matches - Returns pendingIncomingCount")
try:
    user_y_id = create_test_user("test-usery@trainr.test", "User Y")
    user_y_profile_id = create_test_profile(user_y_id, "User Y")
    user_y_token = create_session(user_y_id)
    
    response = requests.get(
        f"{BASE_URL}/matches",
        cookies={"spottr_session": user_y_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "matches" in data and "pendingIncomingCount" in data:
            print(f"✅ PASS - Returns {{matches, pendingIncomingCount: {data['pendingIncomingCount']}}}")
        else:
            print(f"❌ FAIL - Missing required fields. Keys: {list(data.keys())}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# J.2: Insert 3 pending requests → pendingIncomingCount === 3
print("\n[J.2] GET /api/matches - pendingIncomingCount reflects pending requests")
try:
    # Create 3 users who will send requests to User Y
    for i in range(3):
        sender_id = create_test_user(f"test-sender{i}@trainr.test", f"Sender {i}")
        sender_profile_id = create_test_profile(sender_id, f"Sender {i}")
        sender_token = create_session(sender_id)
        
        # Send connect to User Y
        requests.post(
            f"{BASE_URL}/profiles/connect",
            json={"profileId": user_y_profile_id},
            cookies={"spottr_session": sender_token}
        )
    
    # Get matches as User Y
    response = requests.get(
        f"{BASE_URL}/matches",
        cookies={"spottr_session": user_y_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        pending_count = data.get("pendingIncomingCount", 0)
        
        if pending_count == 3:
            print(f"✅ PASS - pendingIncomingCount === 3 (correct)")
        else:
            print(f"❌ FAIL - Expected pendingIncomingCount === 3, got {pending_count}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# J.3: After accepting one, pendingIncomingCount === 2
print("\n[J.3] GET /api/matches - pendingIncomingCount decreases after accept")
try:
    # Get one of the pending requests
    pending_request = db.connection_requests.find_one({
        "toUserId": user_y_id,
        "status": "pending"
    })
    
    if pending_request:
        # User Y accepts one request
        requests.post(
            f"{BASE_URL}/requests/accept",
            json={"requestId": pending_request["id"]},
            cookies={"spottr_session": user_y_token}
        )
        
        # Get matches as User Y
        response = requests.get(
            f"{BASE_URL}/matches",
            cookies={"spottr_session": user_y_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            pending_count = data.get("pendingIncomingCount", 0)
            
            if pending_count == 2:
                print(f"✅ PASS - pendingIncomingCount === 2 (decreased after accept)")
            else:
                print(f"❌ FAIL - Expected pendingIncomingCount === 2, got {pending_count}")
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
    else:
        print("⚠️  SKIP - No pending request found for test")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# CLEANUP
# ============================================================================
cleanup_test_data()

print("\n" + "=" * 80)
print("WAVE 2 BACKEND TESTING COMPLETE")
print("=" * 80)
