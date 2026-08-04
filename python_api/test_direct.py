import sys
import os
import time

# Ensure we're in the right dir
sys.path.append(os.path.dirname(__file__))

import app
import pandas as pd
import numpy as np

print("Testing direct prediction...")

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

df = pd.DataFrame([data], columns=app.features)

start = time.time()
print("Running preprocessing...")
processed = app.preprocessor.transform(df)

import torch
print("Running MLP...")
with torch.no_grad():
    tensor_input = torch.FloatTensor(processed)
    embeddings = app.mlp_model(tensor_input).numpy()

print("Running RF...")
prediction = app.rf_model.predict(embeddings)
print(f"Prediction: {prediction[0]}, Time: {time.time()-start:.2f}s")

if app.LIME_AVAILABLE:
    print("Testing LIME...")
    instance = df.copy()
    for idx in app.categorical_features_idx:
        col_name = app.features[idx]
        try:
            encoded_val = app.label_encoders[col_name].transform([str(instance.loc[0, col_name])])[0]
        except ValueError:
            encoded_val = 0
        instance.loc[0, col_name] = encoded_val
        
    instance_arr = instance.values[0]
    start = time.time()
    
    print("Starting explain_instance...")
    exp = app.explainer.explain_instance(instance_arr, app.predict_fn_wrapper, num_features=5)
    print(f"LIME Time: {time.time()-start:.2f}s")
    print(exp.as_list())

print("Done!")
