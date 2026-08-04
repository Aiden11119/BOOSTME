import sys, os, time, json
sys.path.append(os.path.dirname(__file__))
import app

print("Starting Flask Test Client...")
client = app.app.test_client()

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

start = time.time()
print("Sending request to /predict...")
response = client.post('/predict', json=data)

print(f"Status: {response.status_code}")
print(f"Time: {time.time()-start:.2f}s")
try:
    print(json.dumps(response.get_json(), indent=2))
except Exception as e:
    print("Response text:", response.data)
