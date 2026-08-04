import joblib
import pandas as pd


# ==========================================
# LOAD MODEL, SCALER AND LABEL ENCODER
# ==========================================

model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")
label_encoder = joblib.load("high_risk_label.pkl")


# ==========================================
# EXACT FEATURE ORDER
# ==========================================

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
# VITAL REASON RULES
# ==========================================

def get_vital_reasons(baby):

    reasons = []

    # Heart Rate
    if baby["heart_rate_bpm"] > 160:
        reasons.append(
            f"Heart Rate: {baby['heart_rate_bpm']} bpm ⬆️"
        )
    elif baby["heart_rate_bpm"] < 120:
        reasons.append(
            f"Heart Rate: {baby['heart_rate_bpm']} bpm ⬇️"
        )

    # SpO2
    if baby["oxygen_saturation"] < 95:
        reasons.append(
            f"SpO₂: {baby['oxygen_saturation']}% ⬇️"
        )

    # Temperature
    if baby["temperature_c"] > 37.5:
        reasons.append(
            f"Temperature: {baby['temperature_c']}°C ⬆️"
        )
    elif baby["temperature_c"] < 36.5:
        reasons.append(
            f"Temperature: {baby['temperature_c']}°C ⬇️"
        )

    # Respiratory Rate
    if baby["respiratory_rate_bpm"] > 50:
        reasons.append(
            f"Respiratory Rate: {baby['respiratory_rate_bpm']}/min ⬆️"
        )
    elif baby["respiratory_rate_bpm"] < 30:
        reasons.append(
            f"Respiratory Rate: {baby['respiratory_rate_bpm']}/min ⬇️"
        )

    return reasons


# ==========================================
# TEST BABIES
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
        "weight_kg": 2.5,
        "temperature_c": 37.5,
        "heart_rate_bpm": 170,
        "respiratory_rate_bpm": 55,
        "oxygen_saturation": 93,
        "apgar_score": 7,
        "immunizations_done": 1,
        "reflexes_normal": 0
    },

    {
        "baby_id": "BABY_003",
        "gender": 0,
        "weight_kg": 2.0,
        "temperature_c": 38.2,
        "heart_rate_bpm": 192,
        "respiratory_rate_bpm": 78,
        "oxygen_saturation": 84,
        "apgar_score": 5,
        "immunizations_done": 0,
        "reflexes_normal": 0
    }
]


# ==========================================
# START TEST
# ==========================================

print()
print("================================================")
print("         NEONATAL MULTI-BABY AI TEST")
print("================================================")


# ==========================================
# PROCESS EACH BABY
# ==========================================

for baby in babies:

    baby_id = baby["baby_id"]

    # Create input
    input_data = pd.DataFrame([{
        feature: baby[feature]
        for feature in features
    }])

    input_data = input_data[features]

    # Scale
    scaled_data = scaler.transform(input_data)

    # Prediction
    prediction_number = model.predict(scaled_data)[0]

    # Probabilities
    probabilities = model.predict_proba(scaled_data)[0]

    # Convert prediction number to label
    status = label_encoder.inverse_transform(
        [prediction_number]
    )[0]

    # ==========================================
    # PREDICTION SCORE
    # ==========================================
    # This is the probability of the predicted class.
    # It is NOT a clinical risk score.
    # ==========================================

    predicted_class_index = list(model.classes_).index(
        prediction_number
    )

    prediction_score = probabilities[predicted_class_index]

    # ==========================================
    # DISPLAY
    # ==========================================

    print()
    print("----------------------------------------------")
    print(baby_id)
    print()

    print("Status:", status)
    print()

    print(
        "Prediction Score:",
        f"{prediction_score * 100:.0f}%"
    )

    print()

    # ==========================================
    # VITALS
    # ==========================================

    reasons = get_vital_reasons(baby)

    print("Vitals:")

    if reasons:
        for reason in reasons:
            print("•", reason)

    else:
        print(
            f"• Heart Rate: "
            f"{baby['heart_rate_bpm']} bpm"
        )

        print(
            f"• SpO₂: "
            f"{baby['oxygen_saturation']}%"
        )

        print(
            f"• Temperature: "
            f"{baby['temperature_c']}°C"
        )

        print(
            f"• Respiratory Rate: "
            f"{baby['respiratory_rate_bpm']}/min"
        )


# ==========================================
# FINISHED
# ==========================================

print()
print("================================================")
print("              TEST COMPLETED")
print("================================================")