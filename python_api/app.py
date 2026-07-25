import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the comprehensive Pipeline
PIPELINE_PATH = os.path.join(os.path.dirname(__file__), 'boastme_final_deployment.pkl')
pipeline = joblib.load(PIPELINE_PATH)

# LIME Setup
LIME_AVAILABLE = False
explainer = None
label_encoders = {}
features = [
    'Gender', 'Department', 'Attendance (%)', 'Midterm_Score', 
    'Assignments_Avg', 'Quizzes_Avg', 'Study_Hours_per_Week', 
    'Family_Income_Level', 'Stress_Level (1-10)'
]
categorical_features_idx = [0, 1, 7] # Gender, Department, Family_Income_Level

try:
    import lime
    import lime.lime_tabular
    from sklearn.preprocessing import LabelEncoder
    
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'Students_Performance.csv')
    if os.path.exists(csv_path):
        training_df = pd.read_csv(csv_path)[features].dropna()
        
        for idx in categorical_features_idx:
            col_name = features[idx]
            le = LabelEncoder()
            training_df[col_name] = le.fit_transform(training_df[col_name].astype(str))
            label_encoders[col_name] = le
            
        training_data = training_df.values
        
        categorical_names = {
            idx: label_encoders[features[idx]].classes_ 
            for idx in categorical_features_idx
        }
        
        explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=training_data,
            feature_names=features,
            categorical_features=categorical_features_idx,
            categorical_names=categorical_names,
            mode='classification',
            discretize_continuous=True
        )
        LIME_AVAILABLE = True
        print("LIME Explainer initialized successfully!")
    else:
        print(f"Warning: Training data not found at {csv_path}. XAI disabled.")
except ImportError:
    print("Warning: lime library not installed. XAI will be disabled.")
except Exception as e:
    print(f"Warning: Failed to initialize LIME: {e}")

def predict_fn_wrapper(numpy_data):
    df_pred = pd.DataFrame(numpy_data, columns=features)
    for idx in categorical_features_idx:
        col_name = features[idx]
        # Round and cast to int to safely inverse_transform (LIME might pass floats during perturbation)
        df_pred[col_name] = np.round(df_pred[col_name]).astype(int)
        # Clip to valid classes to avoid out-of-bounds error
        max_class = len(label_encoders[col_name].classes_) - 1
        df_pred[col_name] = np.clip(df_pred[col_name], 0, max_class)
        df_pred[col_name] = label_encoders[col_name].inverse_transform(df_pred[col_name])
    
    if hasattr(pipeline, 'predict_proba'):
        return pipeline.predict_proba(df_pred)
    else:
        preds = pipeline.predict(df_pred)
        classes = pipeline.classes_
        probs = np.zeros((len(preds), len(classes)))
        for i, p in enumerate(preds):
            probs[i, list(classes).index(p)] = 1.0
        return probs

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print("Received Prediction Request:", data)

        df = pd.DataFrame([data], columns=features)
        prediction = pipeline.predict(df)
        grade = prediction[0]
        
        response_data = {"predicted_grade": grade, "success": True}
        
        # Add XAI if available
        if LIME_AVAILABLE and explainer is not None:
            # Prepare instance for LIME (encode categoricals)
            instance = df.copy()
            for idx in categorical_features_idx:
                col_name = features[idx]
                try:
                    # If label exists in training
                    encoded_val = label_encoders[col_name].transform([str(instance.loc[0, col_name])])[0]
                except ValueError:
                    # Unknown label fallback
                    encoded_val = 0
                instance.loc[0, col_name] = encoded_val
                
            instance_arr = instance.values[0]
            
            # Generate explanation
            exp = explainer.explain_instance(instance_arr, predict_fn_wrapper, num_features=5)
            
            # Format explanation for frontend
            # exp.as_list() returns e.g. [('Attendance (%) <= 65', -0.15), ('Study_Hours > 20', 0.05)]
            xai_explanations = [{"feature": f, "impact": i} for f, i in exp.as_list()]
            response_data["xai_explanations"] = xai_explanations
            print("Generated XAI Explanations:", xai_explanations)
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500

if __name__ == '__main__':
    print("Starting Flask server with unified Pipeline on port 5001...")
    app.run(port=5001, debug=True)
