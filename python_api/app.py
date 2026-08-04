import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

import torch
import torch.nn as nn

class MLPEmbeddingNet(nn.Module):
    def __init__(self, input_dim, hidden_dims=[128, 64, 32], embedding_dim=16, drop_rate=0.2):
        super().__init__()
        layers = []
        in_dim = input_dim
        for h_dim in hidden_dims:
            layers.append(nn.Linear(in_dim, h_dim))
            layers.append(nn.BatchNorm1d(h_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(drop_rate))
            in_dim = h_dim
        self.feature_extractor = nn.Sequential(*layers)
        self.embedding_head = nn.Linear(in_dim, embedding_dim)

    def forward(self, x):
        out = self.feature_extractor(x)
        raw_embeds = self.embedding_head(out)
        normalized_embeds = nn.functional.normalize(
            raw_embeds,
            p=2,
            dim=1
        )
        return normalized_embeds

# Load the comprehensive Pipeline assets
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'student_model_pipeline.pkl')
assets = joblib.load(MODEL_PATH)
preprocessor = assets['preprocessor']
mlp_weights = assets['mlp_weights']
rf_model = assets['rf_model']

# Reconstruct and load MLP Embedding Net
# Dynamically infer architecture from saved weights
# Each hidden block = [Linear, BatchNorm, ReLU, Dropout] at indices 0,4,8,...
first_layer_weight = mlp_weights['feature_extractor.0.weight']
input_dim = first_layer_weight.shape[1]

hidden_dims = []
idx = 0
while f'feature_extractor.{idx}.weight' in mlp_weights:
    w = mlp_weights[f'feature_extractor.{idx}.weight']
    hidden_dims.append(w.shape[0])
    idx += 4  # skip BatchNorm, ReLU, Dropout

print(f"Detected MLP architecture: input_dim={input_dim}, hidden_dims={hidden_dims}")

mlp_model = MLPEmbeddingNet(input_dim=input_dim, hidden_dims=hidden_dims)
mlp_model.load_state_dict(mlp_weights)
mlp_model.eval()


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
    
    processed = preprocessor.transform(df_pred)
    with torch.no_grad():
        tensor_input = torch.FloatTensor(processed)
        embeddings = mlp_model(tensor_input).numpy()

    if hasattr(rf_model, 'predict_proba'):
        return rf_model.predict_proba(embeddings)
    else:
        preds = rf_model.predict(embeddings)
        classes = rf_model.classes_
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
        processed = preprocessor.transform(df)
        with torch.no_grad():
            tensor_input = torch.FloatTensor(processed)
            embeddings = mlp_model(tensor_input).numpy()
        prediction = rf_model.predict(embeddings)
        raw_grade = prediction[0]
        
        # Map integer predictions to grade letters if needed
        int_to_grade = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'F'}
        if isinstance(raw_grade, (int, np.integer)):
            grade = int_to_grade.get(int(raw_grade), str(raw_grade))
        else:
            grade = str(raw_grade)
        
        response_data = {"predicted_grade": grade, "success": True}
        
        # Add XAI if available
        if LIME_AVAILABLE and explainer is not None:
            # Prepare instance for LIME (encode categoricals)
            instance = df.copy().astype(object)
            for idx in categorical_features_idx:
                col_name = features[idx]
                try:
                    # If label exists in training
                    encoded_val = label_encoders[col_name].transform([str(instance.loc[0, col_name])])[0]
                except ValueError:
                    # Unknown label fallback
                    encoded_val = 0
                instance.loc[0, col_name] = int(encoded_val)
                
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
    print("Starting Flask server with RF + Metric Learning Pipeline on port 5001...")
    app.run(port=5001, debug=True)
