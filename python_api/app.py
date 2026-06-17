import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load the comprehensive Pipeline
PIPELINE_PATH = os.path.join(os.path.dirname(__file__), 'boastme_final_deployment.pkl')
pipeline = joblib.load(PIPELINE_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print("Received Prediction Request:", data)

        # Expected features based on exactly what you trained with
        features = [
            'Gender', 'Department', 'Attendance (%)', 'Midterm_Score', 
            'Assignments_Avg', 'Quizzes_Avg', 'Study_Hours_per_Week', 
            'Family_Income_Level', 'Stress_Level (1-10)'
        ]
        
        # Build pandas dataframe. We enforce column order to exactly match the training expectation.
        df = pd.DataFrame([data], columns=features)
        
        # Predict using the all-in-one pipeline which handles OneHotEncoding AND StandardScaler internally
        prediction = pipeline.predict(df)
        
        grade = prediction[0]
        
        return jsonify({"predicted_grade": grade, "success": True})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500

if __name__ == '__main__':
    print("Starting Flask server with unified Pipeline on port 5001...")
    app.run(port=5001, debug=True)
