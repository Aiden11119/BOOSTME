import urllib.request
import json

url = 'http://127.0.0.1:5001/predict'
data = {
    "Gender": "Female",
    "Department": "Computer Science",
    "Attendance (%)": 95.0,
    "Midterm_Score": 90.0,
    "Assignments_Avg": 92.0,
    "Quizzes_Avg": 88.0,
    "Study_Hours_per_Week": 20.0,
    "Family_Income_Level": "Middle",
    "Stress_Level (1-10)": 3.0
}

req = urllib.request.Request(
    url,
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode())
        print("Status: 200")
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
