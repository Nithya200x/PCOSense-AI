from fastapi.testclient import TestClient
from main import app, extract_hormones_via_regex
import os
import json

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "PCOSense API is running"}

def test_regex_parser():
    text = "Testosterone levels came out as 85.5 ng/dL. Insulin was measured as 29.5 uIU/ml. Glucose was 95."
    extracted = extract_hormones_via_regex(text)
    assert extracted["testosterone"] == 85.5
    assert extracted["insulin"] == 29.5
    assert extracted["glucose"] == 95.0
    assert extracted["lh"] is None

def test_dashboard_empty_logs():
    # If user has no logs or reports, check if dashboard returns baseline data
    response = client.get("/api/dashboard?user_id=test_user_999")
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "cycle_status" in data
    assert "avg_cycle_length" in data
    assert data["next_period_prediction"] == 5  # default baseline

def test_save_and_get_reports():
    # Save a report
    report_payload = {
        "user_id": "test_user_777",
        "date": "2026-07-14",
        "testosterone": 55.2,
        "lh": 5.4,
        "fsh": 4.2,
        "tsh": 2.1,
        "insulin": 12.0,
        "amh": 3.1,
        "prolactin": 11.0,
        "vitamin_d": 35.0,
        "hba1c": 5.2,
        "glucose": 88.0,
        "file_name": "test_report.jpg",
        "summary": "Everything is normal."
    }
    save_res = client.post("/api/save-report", json=report_payload)
    assert save_res.status_code == 200
    assert save_res.json() == {"status": "success"}

    # Fetch it back
    get_res = client.get("/api/get-reports?user_id=test_user_777")
    assert get_res.status_code == 200
    reports = get_res.json()["reports"]
    assert len(reports) > 0
    assert reports[0]["testosterone"] == 55.2
    assert reports[0]["lh"] == 5.4
    assert reports[0]["glucose"] == 88.0

def test_lifestyle_fallback():
    payload = {
        "profile": {
            "age": "25",
            "weight": "70",
            "height": "160",
            "avgCycleLength": "35",
            "symptoms": "fatigue, cravings",
            "familyHistory": "Yes",
            "user_id": "test_user_777"
        }
    }
    res = client.post("/api/lifestyle", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "meals" in data
    assert "workouts" in data
    assert "sleep" in data
    assert "habits" in data
    assert len(data["meals"]) >= 3
