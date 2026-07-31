import joblib
import pandas as pd
import time
import os

# ==========================================
# LOAD MODEL
# ==========================================

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


# ==========================================
# SIMULATED BABIES
# ==========================================

babies = [
    {
        "baby_id": "BABY_001",
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
        "baby_id": "BABY_002",
        "gender": 1,
        "weight_kg": 2.8,
        "temperature_c": 37.2,
        "heart_rate_bpm": 165,
        "respiratory_rate_bpm": 52,
        "oxygen_saturation": 93,
        "apgar_score": 7,
        "immunizations_done": 1,
        "reflexes_normal": 1
    },

    {
        "baby_id": "BABY_003",
        "gender": 0,
        "weight_kg": 2.1,
        "temperature_c": 38.2,
        "heart_rate_bpm": 190,
        "respiratory_rate_bpm": 68,
        "oxygen_saturation": 85,
        "apgar_score": 5,
        "immunizations_done": 0,
        "reflexes_normal": 0
    },

    {
        "baby_id": "BABY_004",
        "gender": 1,
        "weight_kg": 3.2,
        "temperature_c": 36.6,
        "heart_rate_bpm": 135,
        "respiratory_rate_bpm": 38,
        "oxygen_saturation": 98,
        "apgar_score": 9,
        "immunizations_done": 1,
        "reflexes_normal": 1
    },

    {
        "baby_id": "BABY_005",
        "gender": 0,
        "weight_kg": 2.4,
        "temperature_c": 37.8,
        "heart_rate_bpm": 180,
        "respiratory_rate_bpm": 60,
        "oxygen_saturation": 88,
        "apgar_score": 6,
        "immunizations_done": 0,
        "reflexes_normal": 0
    }
]


# ==========================================
# PREDICTION FUNCTION
# ==========================================

def predict_baby(baby):

    data = {
        feature: baby[feature]
        for feature in features
    }

    x = pd.DataFrame([data], columns=features)

    # Apply SAME scaler used during training
    x_scaled = scaler.transform(x)

    # Convert scaled array back to DataFrame
    # so feature names remain available
    x_scaled = pd.DataFrame(
        x_scaled,
        columns=features
    )

    prediction = model.predict(x_scaled)[0]
    probabilities = model.predict_proba(x_scaled)[0]

    return prediction, probabilities


# ==========================================
# MAIN LOOP
# ==========================================

try:

    while True:

        os.system("cls")

        print("=" * 65)
        print("              PC-2 NEONATAL AI SERVER")
        print("=" * 65)
        print("Processing multiple babies...")
        print()

        for baby in babies:

            prediction, probabilities = predict_baby(baby)

            print("-" * 65)
            print(f"BABY ID: {baby['baby_id']}")
            print("-" * 65)

            print(
                f"Heart Rate       : {baby['heart_rate_bpm']} bpm"
            )

            print(
                f"SpO2             : {baby['oxygen_saturation']} %"
            )

            print(
                f"Temperature      : {baby['temperature_c']} °C"
            )

            print(
                f"Respiratory Rate : {baby['respiratory_rate_bpm']} bpm"
            )

            print(
                f"Weight           : {baby['weight_kg']} kg"
            )

            print(
                f"APGAR            : {baby['apgar_score']}"
            )

            print(
                f"Prediction       : {prediction}"
            )

            for label, probability in zip(
                model.classes_,
                probabilities
            ):
                print(
                    f"Class {label} Probability : "
                    f"{probability * 100:.2f}%"
                )

        print()
        print("=" * 65)
        print("Updating every 2 seconds...")
        print("Press CTRL + C to stop")
        print("=" * 65)

        time.sleep(2)


except KeyboardInterrupt:

    print("\n")
    print("=" * 65)
    print("PC-2 TEST STOPPED")
    print("=" * 65)