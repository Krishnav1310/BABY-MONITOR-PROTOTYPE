import joblib
import pandas as pd

model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")

features = [
    "gender",
    "weight_kg",
    "temperature_c",
    "heart_rate_bpm",
    "respiratory_rate_bpm",
    "oxygen_saturation",
    "apgar_score",
    "immunizations_done",
    "reflexes_normal"
]

tests = [
    {
        "name": "NORMAL BABY",
        "gender": 0,
        "weight_kg": 3.0,
        "temperature_c": 36.8,
        "heart_rate_bpm": 140,
        "respiratory_rate_bpm": 40,
        "oxygen_saturation": 97,
        "apgar_score": 8,
        "immunizations_done": 1,
        "reflexes_normal": 1
    },

    {
        "name": "MODERATE BABY",
        "gender": 0,
        "weight_kg": 2.5,
        "temperature_c": 37.5,
        "heart_rate_bpm": 170,
        "respiratory_rate_bpm": 55,
        "oxygen_saturation": 92,
        "apgar_score": 7,
        "immunizations_done": 1,
        "reflexes_normal": 0
    },

    {
        "name": "CRITICAL BABY",
        "gender": 0,
        "weight_kg": 2.0,
        "temperature_c": 38.5,
        "heart_rate_bpm": 190,
        "respiratory_rate_bpm": 70,
        "oxygen_saturation": 82,
        "apgar_score": 4,
        "immunizations_done": 0,
        "reflexes_normal": 0
    }
]

print("\n==============================================")
print("       MODEL BEHAVIOR TEST")
print("==============================================")

for test in tests:

    x = pd.DataFrame([{
        feature: test[feature]
        for feature in features
    }])

    x = x[features]

    x_scaled = pd.DataFrame(
        scaler.transform(x),
        columns=features
    )

    prediction = model.predict(x_scaled)[0]
    probabilities = model.predict_proba(x_scaled)[0]

    print("\n----------------------------------------------")
    print(test["name"])
    print("----------------------------------------------")

    print("Prediction:", prediction)

    for label, probability in zip(model.classes_, probabilities):
        print(
            f"Class {label}: {probability * 100:.2f}%"
        )

print("\n==============================================")