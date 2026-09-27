import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test():
    # 1. Health check
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        print("1. Health Check Response:", data)
        assert data["status"] == "ok"
        assert data["database"] == "SQLite"

    # 2. Get initial tasks
    req = urllib.request.Request(f"{BASE_URL}/tasks")
    with urllib.request.urlopen(req) as res:
        tasks = json.loads(res.read().decode())
        print(f"2. Get Tasks: Found {len(tasks)} tasks seeded in SQLite")
        assert len(tasks) >= 5

    # 3. Create a new task
    new_task_payload = json.dumps({
        "title": "University FastAPI Integration Test",
        "description": "Verifying full roundtrip REST API and SQLite persistence",
        "priority": "high",
        "due_date": "2026-10-15"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/tasks", 
        data=new_task_payload, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        created = json.loads(res.read().decode())
        print(f"3. Created Task ID {created['id']}: {created['title']} (Priority: {created['priority']})")
        task_id = created["id"]
        assert created["is_completed"] is False

    # 4. Update task completion
    update_payload = json.dumps({"is_completed": True}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/tasks/{task_id}",
        data=update_payload,
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as res:
        updated = json.loads(res.read().decode())
        print(f"4. Updated Task ID {task_id}: is_completed = {updated['is_completed']}")
        assert updated["is_completed"] is True

    # 5. Delete task
    req = urllib.request.Request(
        f"{BASE_URL}/tasks/{task_id}",
        method="DELETE"
    )
    with urllib.request.urlopen(req) as res:
        deleted = json.loads(res.read().decode())
        print(f"5. Deleted Task ID {task_id}:", deleted)
        assert deleted["success"] is True

    print("\nALL BACKEND REST API & SQLITE TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test()
