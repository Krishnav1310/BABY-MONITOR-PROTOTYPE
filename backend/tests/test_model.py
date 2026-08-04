
import joblib
import pandas as pd

# -----------------------------
# Load model and scaler
# -----------------------------
model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")

# -----------------------------
# Features MUST be in this order
# -----------------------------
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

# -----------------------------
# Test baby
# -----------------------------
baby = pd.DataFrame([{
    "gender": 0,
    "weight_kg": 3.0,
    "temperature_c": 36.8,
    "heart_rate_bpm": 140,
    "respiratory_rate_bpm": 40,
    "oxygen_saturation": 97,
    "apgar_score": 8,
    "immunizations_done": 1,
    "reflexes_normal": 1
}])

# Make sure feature order is correct
baby = baby[features]

# -----------------------------
# Scale
# -----------------------------
baby_scaled = scaler.transform(baby)

# -----------------------------
# Get prediction probabilities
# -----------------------------
probability = model.predict_proba(baby_scaled)[0]

# Class 1 probability
class_1_probability = probability[1]

# -----------------------------
# Convert Class 1 probability
# into 3 risk levels
# -----------------------------
if class_1_probability < 0.33:
    prediction = "NORMAL"

elif class_1_probability < 0.66:
    prediction = "MODERATE"

else:
    prediction = "CRITICAL"

# -----------------------------
# Display result
# -----------------------------
print("\n==============================")
print("      NEONATAL AI TEST")
print("==============================")

print("Baby Data:")
print(baby.to_string(index=False))

print("\nClass 1 Probability:",
      round(class_1_probability * 100, 2), "%")

print("Prediction:", prediction)

print("\nModel Probabilities:")
print("Class 0:", round(probability[0] * 100, 2), "%")
print("Class 1:", round(probability[1] * 100, 2), "%")

print("==============================")