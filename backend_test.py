#!/usr/bin/env python3
"""
WAVE 1 BACKEND TESTING for Trainr
Tests 3 specific changes:
1. Admin users list - new response format with total, limit, hasProfile
2. Discover privacy - strips lastActiveAt and location
3. Regression sanity checks
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

def create_session(user_id):
    """Create a session in MongoDB and return the token"""
    token = f"test-{uuid4()}"
    db.sessions.insert_one({
        "token": token,
        "userId": user_id,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(hours=1)
    })
    return token

def create_test_user(email, name, is_admin=False):
    """Create a test user in MongoDB"""
    user_id = str(uuid4())
    db.users.insert_one({
        "id": user_id,
        "email": email,
        "name": name,
        "createdAt": datetime.utcnow(),
        "banned": False
    })
    return user_id

def create_test_profile(user_id, name, verified=False):
    """Create a test profile in MongoDB (complete profile for discoverability)"""
    profile_id = str(uuid4())
    db.profiles.insert_one({
        "id": profile_id,
        "userId": user_id,
        "name": name,
        "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
        "bio": "This is a test bio with more than 10 characters for profile completion.",
        "city": "Mumbai",
        "gymName": "Test Gym",
        "goal": "Strength",
        "timing": "Morning",
        "gender": "Male",
        "level": "Intermediate",
        "verified": verified,
        "location": {"lat": 19.07, "lng": 72.87},
        "lastActiveAt": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "isSeed": False
    })
    return profile_id

def cleanup_test_data():
    """Clean up test data"""
    db.users.delete_many({"email": {"$regex": "^test-"}})
    db.profiles.delete_many({"name": {"$regex": "^Test User"}})
    db.sessions.delete_many({"token": {"$regex": "^test-"}})

print("=" * 80)
print("WAVE 1 BACKEND TESTING - Trainr")
print("=" * 80)

# Clean up any existing test data
cleanup_test_data()

# ============================================================================
# TEST 1: Admin users list - Non-admin access (should get 403)
# ============================================================================
print("\n[TEST 1] Admin users list - Non-admin access")
try:
    # Create non-admin user
    non_admin_id = create_test_user("test-nonadmin@example.com", "Non Admin User")
    non_admin_token = create_session(non_admin_id)
    
    response = requests.get(
        f"{BASE_URL}/admin/users",
        cookies={"spottr_session": non_admin_token}
    )
    
    if response.status_code == 403:
        print("✅ PASS - Non-admin gets 403")
    else:
        print(f"❌ FAIL - Expected 403, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 2: Admin users list - Response structure (total, limit, users)
# ============================================================================
print("\n[TEST 2] Admin users list - Response structure")
try:
    # Create admin user
    admin_id = create_test_user(ADMIN_EMAIL, "Admin User", is_admin=True)
    admin_token = create_session(admin_id)
    
    response = requests.get(
        f"{BASE_URL}/admin/users",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        has_users = "users" in data and isinstance(data["users"], list)
        has_total = "total" in data and isinstance(data["total"], int)
        has_limit = "limit" in data and isinstance(data["limit"], int)
        
        if has_users and has_total and has_limit:
            print(f"✅ PASS - Response has users (array), total ({data['total']}), limit ({data['limit']})")
        else:
            print(f"❌ FAIL - Missing required fields. Keys: {list(data.keys())}")
            print(f"Response: {json.dumps(data, indent=2)[:500]}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 3: Admin users list - hasProfile flag
# ============================================================================
print("\n[TEST 3] Admin users list - hasProfile flag")
try:
    # Create two test users: one with profile, one without
    user_with_profile_id = create_test_user("test-withprofile@example.com", "User With Profile")
    user_without_profile_id = create_test_user("test-withoutprofile@example.com", "User Without Profile")
    
    # Create profile for first user only
    create_test_profile(user_with_profile_id, "Test User With Profile")
    
    response = requests.get(
        f"{BASE_URL}/admin/users",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        users = data["users"]
        
        # Find our test users
        user_with = next((u for u in users if u["email"] == "test-withprofile@example.com"), None)
        user_without = next((u for u in users if u["email"] == "test-withoutprofile@example.com"), None)
        
        if user_with and user_without:
            if user_with.get("hasProfile") == True and user_without.get("hasProfile") == False:
                print("✅ PASS - hasProfile flag correct (True for user with profile, False for user without)")
            else:
                print(f"❌ FAIL - hasProfile incorrect. With profile: {user_with.get('hasProfile')}, Without: {user_without.get('hasProfile')}")
        else:
            print(f"❌ FAIL - Could not find test users in response")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 4: Admin users list - Query filter (?q=)
# ============================================================================
print("\n[TEST 4] Admin users list - Query filter")
try:
    response = requests.get(
        f"{BASE_URL}/admin/users?q=withprofile",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        users = data["users"]
        
        # Should only return users matching the query
        matching = [u for u in users if "withprofile" in u["email"].lower() or "withprofile" in u.get("name", "").lower()]
        
        if len(matching) > 0 and all("withprofile" in u["email"].lower() or "withprofile" in u.get("name", "").lower() for u in users):
            print(f"✅ PASS - Query filter works, found {len(matching)} matching users")
        else:
            print(f"❌ FAIL - Query filter not working correctly")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 5: Admin users list - Status filter (active/banned)
# ============================================================================
print("\n[TEST 5] Admin users list - Status filter")
try:
    # Create a banned user
    banned_user_id = create_test_user("test-banned@example.com", "Banned User")
    db.users.update_one({"id": banned_user_id}, {"$set": {"banned": True}})
    
    # Test ?status=active (should exclude banned)
    response = requests.get(
        f"{BASE_URL}/admin/users?status=active",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        users = data["users"]
        banned_in_active = any(u.get("banned") == True for u in users)
        
        if not banned_in_active:
            print("✅ PASS - ?status=active excludes banned users")
        else:
            print("❌ FAIL - ?status=active includes banned users")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
    
    # Test ?status=banned (should only return banned)
    response = requests.get(
        f"{BASE_URL}/admin/users?status=banned",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        users = data["users"]
        all_banned = all(u.get("banned") == True for u in users) if len(users) > 0 else True
        
        if all_banned:
            print("✅ PASS - ?status=banned returns only banned users")
        else:
            print("❌ FAIL - ?status=banned includes non-banned users")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 6: Admin users list - Limit parameter
# ============================================================================
print("\n[TEST 6] Admin users list - Limit parameter")
try:
    response = requests.get(
        f"{BASE_URL}/admin/users?limit=2",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        users = data["users"]
        total = data["total"]
        limit = data["limit"]
        
        if len(users) <= 2 and limit == 2 and total >= len(users):
            print(f"✅ PASS - ?limit=2 returns at most 2 users ({len(users)}), but total reflects full count ({total})")
        else:
            print(f"❌ FAIL - Limit not working correctly. Users: {len(users)}, Limit: {limit}, Total: {total}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 7: Admin users list - Legacy users without createdAt
# ============================================================================
print("\n[TEST 7] Admin users list - Legacy users without createdAt")
try:
    # Create a user without createdAt field
    legacy_user_id = str(uuid4())
    db.users.insert_one({
        "id": legacy_user_id,
        "email": "test-legacy@example.com",
        "name": "Legacy User",
        "banned": False
        # Note: NO createdAt field
    })
    
    response = requests.get(
        f"{BASE_URL}/admin/users",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        users = data["users"]
        legacy_user = next((u for u in users if u["email"] == "test-legacy@example.com"), None)
        
        if legacy_user:
            print("✅ PASS - Legacy user without createdAt is returned (due to _id fallback sort)")
        else:
            print("❌ FAIL - Legacy user without createdAt not found in response")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 8: Discover privacy - No lastActiveAt field
# ============================================================================
print("\n[TEST 8] Discover privacy - No lastActiveAt field")
try:
    # Create a regular user to make the request
    regular_user_id = create_test_user("test-regular@example.com", "Regular User")
    regular_token = create_session(regular_user_id)
    regular_profile_id = create_test_profile(regular_user_id, "Test Regular User")
    
    # Create additional discoverable profiles for testing
    for i in range(3):
        other_user_id = create_test_user(f"test-other{i}@example.com", f"Other User {i}")
        create_test_profile(other_user_id, f"Test Other User {i}", verified=(i == 0))
    
    response = requests.get(
        f"{BASE_URL}/profiles/discover",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        if len(profiles) > 0:
            has_lastActiveAt = any("lastActiveAt" in p for p in profiles)
            
            if not has_lastActiveAt:
                print(f"✅ PASS - ZERO profiles have lastActiveAt field (checked {len(profiles)} profiles)")
            else:
                profiles_with_field = [p for p in profiles if "lastActiveAt" in p]
                print(f"❌ FAIL - {len(profiles_with_field)} profiles have lastActiveAt field")
                print(f"Sample: {json.dumps(profiles_with_field[0], indent=2)[:300]}")
        else:
            print("⚠️  WARNING - No profiles returned, cannot verify")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 9: Discover privacy - No location field
# ============================================================================
print("\n[TEST 9] Discover privacy - No location field")
try:
    response = requests.get(
        f"{BASE_URL}/profiles/discover",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        if len(profiles) > 0:
            has_location = any("location" in p for p in profiles)
            
            if not has_location:
                print(f"✅ PASS - ZERO profiles have location field (checked {len(profiles)} profiles)")
            else:
                profiles_with_field = [p for p in profiles if "location" in p]
                print(f"❌ FAIL - {len(profiles_with_field)} profiles have location field")
                print(f"Sample: {json.dumps(profiles_with_field[0], indent=2)[:300]}")
        else:
            print("⚠️  WARNING - No profiles returned, cannot verify")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 10: Discover - distanceKm still present
# ============================================================================
print("\n[TEST 10] Discover - distanceKm still present")
try:
    response = requests.get(
        f"{BASE_URL}/profiles/discover",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        if len(profiles) > 0:
            has_distanceKm = any("distanceKm" in p for p in profiles)
            
            if has_distanceKm:
                # Check that distanceKm is number or null
                valid_types = all(p.get("distanceKm") is None or isinstance(p.get("distanceKm"), (int, float)) for p in profiles)
                if valid_types:
                    print(f"✅ PASS - distanceKm field present and valid (number or null)")
                else:
                    print(f"❌ FAIL - distanceKm has invalid type")
            else:
                print(f"⚠️  WARNING - No profiles have distanceKm field (may be expected if no locations)")
        else:
            print("⚠️  WARNING - No profiles returned, cannot verify")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 11: Discover - matchReasons still present
# ============================================================================
print("\n[TEST 11] Discover - matchReasons still present")
try:
    response = requests.get(
        f"{BASE_URL}/profiles/discover",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        if len(profiles) > 0:
            has_matchReasons = any("matchReasons" in p for p in profiles)
            
            if has_matchReasons:
                print(f"✅ PASS - matchReasons field present")
            else:
                print(f"❌ FAIL - matchReasons field missing")
        else:
            print("⚠️  WARNING - No profiles returned, cannot verify")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 12: Discover - recentlyActive param doesn't cause error
# ============================================================================
print("\n[TEST 12] Discover - recentlyActive param doesn't cause error")
try:
    response = requests.get(
        f"{BASE_URL}/profiles/discover?recentlyActive=true",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        print(f"✅ PASS - ?recentlyActive=true returns 200 (silently ignored, {len(profiles)} profiles)")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 13: Discover - verifiedOnly filter still works
# ============================================================================
print("\n[TEST 13] Discover - verifiedOnly filter still works")
try:
    response = requests.get(
        f"{BASE_URL}/profiles/discover?verifiedOnly=true",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        if len(profiles) > 0:
            all_verified = all(p.get("verified") == True for p in profiles)
            if all_verified:
                print(f"✅ PASS - ?verifiedOnly=true filters correctly ({len(profiles)} verified profiles)")
            else:
                non_verified = [p for p in profiles if not p.get("verified")]
                print(f"❌ FAIL - {len(non_verified)} non-verified profiles in results")
        else:
            print("⚠️  WARNING - No verified profiles found (may be expected)")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# TEST 14: Discover - Skip/like/block exclusion still works
# ============================================================================
print("\n[TEST 14] Discover - Skip/like/block exclusion still works")
try:
    # Get initial profiles
    response = requests.get(
        f"{BASE_URL}/profiles/discover",
        cookies={"spottr_session": regular_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        
        if len(profiles) > 0:
            # Skip the first profile
            first_profile_id = profiles[0]["id"]
            skip_response = requests.post(
                f"{BASE_URL}/profiles/skip",
                json={"profileId": first_profile_id},
                cookies={"spottr_session": regular_token}
            )
            
            if skip_response.status_code == 200:
                # Get profiles again
                response2 = requests.get(
                    f"{BASE_URL}/profiles/discover",
                    cookies={"spottr_session": regular_token}
                )
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    profiles2 = data2.get("profiles", [])
                    
                    # Check if skipped profile is excluded
                    skipped_in_results = any(p["id"] == first_profile_id for p in profiles2)
                    
                    if not skipped_in_results:
                        print(f"✅ PASS - Skipped profile excluded from subsequent discover calls")
                    else:
                        print(f"❌ FAIL - Skipped profile still appears in discover results")
                else:
                    print(f"❌ FAIL - Second discover call failed: {response2.status_code}")
            else:
                print(f"❌ FAIL - Skip call failed: {skip_response.status_code}")
        else:
            print("⚠️  WARNING - No profiles to test skip exclusion")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# REGRESSION TEST 1: Health check
# ============================================================================
print("\n[REGRESSION TEST 1] Health check - GET /api")
try:
    response = requests.get(f"{BASE_URL}/")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("ok") == True and "app" in data:
            print(f"✅ PASS - Health check returns {{ok: true, app: '{data['app']}'}}")
        else:
            print(f"❌ FAIL - Unexpected response: {data}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# REGRESSION TEST 2: Auth me without cookie
# ============================================================================
print("\n[REGRESSION TEST 2] Auth me without cookie - GET /api/auth/me")
try:
    response = requests.get(f"{BASE_URL}/auth/me")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("user") is None:
            print(f"✅ PASS - Auth me without cookie returns {{user: null}}")
        else:
            print(f"❌ FAIL - Expected {{user: null}}, got: {data}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# REGRESSION TEST 3: Admin stats
# ============================================================================
print("\n[REGRESSION TEST 3] Admin stats - GET /api/admin/stats")
try:
    response = requests.get(
        f"{BASE_URL}/admin/stats",
        cookies={"spottr_session": admin_token}
    )
    
    if response.status_code == 200:
        data = response.json()
        stats = data.get("stats", {})
        
        required_fields = ["users", "profiles", "matches", "messages", "openReports", 
                          "banned", "verified", "activeNow", "pendingVerifications",
                          "pendingSelfie", "pendingGym", "pendingInsta"]
        
        has_all_fields = all(field in stats for field in required_fields)
        
        if has_all_fields:
            print(f"✅ PASS - Admin stats returns all expected fields")
        else:
            missing = [f for f in required_fields if f not in stats]
            print(f"❌ FAIL - Missing fields: {missing}")
    else:
        print(f"❌ FAIL - Expected 200, got {response.status_code}")
except Exception as e:
    print(f"❌ FAIL - Exception: {e}")

# ============================================================================
# CLEANUP
# ============================================================================
print("\n" + "=" * 80)
print("CLEANING UP TEST DATA")
print("=" * 80)
cleanup_test_data()
print("✅ Test data cleaned up")

print("\n" + "=" * 80)
print("WAVE 1 BACKEND TESTING COMPLETE")
print("=" * 80)
