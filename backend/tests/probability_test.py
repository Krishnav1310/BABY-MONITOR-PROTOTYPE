import joblib
import pandas as pd

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
# TEST CASES
# ==========================================

babies = [

    {
        "baby_id": "NORMAL",
        "gender": 0,
        "weight_kg": 3.2,
        "temperature_c": 36.8,
        "heart_rate_bpm": 140,
        "respiratory_rate_bpm": 40,
        "oxygen_saturation": 98,
        "apgar_score": 9,
        "immunizations_done": 1,
        "reflexes_normal": 1
    },

    {
        "baby_id": "MILD_RISK",
        "gender": 0,
        "weight_kg": 2.7,
        "temperature_c": 37.4,
        "heart_rate_bpm": 165,
        "respiratory_rate_bpm": 50,
        "oxygen_saturation": 94,
        "apgar_score": 7,
        "immunizations_done": 1,
        "reflexes_normal": 1
    },

    {
        "baby_id": "MODERATE_RISK",
        "gender": 1,
        "weight_kg": 2.3,
        "temperature_c": 37.8,
        "heart_rate_bpm": 175,
        "respiratory_rate_bpm": 55,
        "oxygen_saturation": 91,
        "apgar_score": 6,
        "immunizations_done": 0,
        "reflexes_normal": 0
    },

    {
        "baby_id": "HIGH_RISK",
        "gender": 0,
        "weight_kg": 1.8,
        "temperature_c": 38.5,
        "heart_rate_bpm": 195,
        "respiratory_rate_bpm": 70,
        "oxygen_saturation": 84,
        "apgar_score": 4,
        "immunizations_done": 0,
        "reflexes_normal": 0
    },

    {
        "baby_id": "VERY_HIGH_RISK",
        "gender": 1,
        "weight_kg": 1.5,
        "temperature_c": 39.0,
        "heart_rate_bpm": 210,
        "respiratory_rate_bpm": 80,
        "oxygen_saturation": 80,
        "apgar_score": 3,
        "immunizations_done": 0,
        "reflexes_normal": 0
    }
]


# ==========================================
# PROCESS ALL BABIES AT ONCE
# ==========================================

input_data = pd.DataFrame([
    {
        feature: baby[feature]
        for feature in features
    }
    for baby in babies
])

input_data = input_data[features]

# Scale all babies together
scaled_data = scaler.transform(input_data)

# ONE model call instead of thousands
probabilities = model.predict_proba(scaled_data)


# ==========================================
# DISPLAY RESULTS
# ==========================================

print("\n==============================================")
print("        MODEL PROBABILITY TEST")
print("==============================================")

for baby, probability in zip(babies, probabilities):

    class_0 = probability[0]
    class_1 = probability[1]

    if class_1 < 0.33:
        status = "NORMAL"

    elif class_1 < 0.66:
        status = "MODERATE"

    else:
        status = "CRITICAL"

    print("\n----------------------------------------------")
    print("BABY:", baby["baby_id"])
    print("----------------------------------------------")

    print(f"Class 0 probability: {class_0 * 100:.2f}%")
    print(f"Class 1 probability: {class_1 * 100:.2f}%")
    print(f"Status: {status}")


print("\n==============================================")
print("                 TEST COMPLETE")
print("==============================================")