from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import threading
import time
import json


# ============================================================
# LOAD AI MODEL
# ============================================================

MODEL_PATH = "model.pkl"
SCALER_PATH = "scaler.pkl"
LABEL_PATH = "high_risk_label.pkl"

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoder = joblib.load(LABEL_PATH)


# ============================================================
# EXACT FEATURE ORDER
# ============================================================

FEATURES = [
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


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Neonatal AI PC2 Server",
    description="PC2 AI server for multi-baby neonatal monitoring",
    version="2.0"
)


# ============================================================
# CORS
# Allows PC3 browser dashboard to access PC2 API
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LATEST PREDICTIONS
# ============================================================

latest_predictions = {}

prediction_lock = threading.RLock()

JSON_FILE = "latest_predictions.json"


# ============================================================
# INPUT MODEL - ONE BABY
# ============================================================

class BabyData(BaseModel):

    baby_id: str

    gender: int
    weight_kg: float
    temperature_c: float
    heart_rate_bpm: float
    respiratory_rate_bpm: float
    oxygen_saturation: float
    apgar_score: float
    immunizations_done: int
    reflexes_normal: int


# ============================================================
# INPUT MODEL - MULTIPLE BABIES
# ============================================================

class MultipleBabiesData(BaseModel):

    babies: list[BabyData]


# ============================================================
# SAVE ALL PREDICTIONS TO JSON
# ============================================================

def save_predictions_to_json():

    with prediction_lock:

        data = {
            "babies": list(
                latest_predictions.values()
            )
        }

        with open(
            JSON_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                data,
                file,
                indent=4,
                ensure_ascii=False
            )


# ============================================================
# REASON ENGINE
# ============================================================

def get_vital_reasons(baby):

    reasons = []

    # --------------------------------------------------------
    # HEART RATE
    # --------------------------------------------------------

    if baby["heart_rate_bpm"] > 160:

        reasons.append(
            f"Heart Rate: {baby['heart_rate_bpm']} bpm ⬆️"
        )

    elif baby["heart_rate_bpm"] < 120:

        reasons.append(
            f"Heart Rate: {baby['heart_rate_bpm']} bpm ⬇️"
        )


    # --------------------------------------------------------
    # SpO2
    # --------------------------------------------------------

    if baby["oxygen_saturation"] < 95:

        reasons.append(
            f"SpO₂: {baby['oxygen_saturation']}% ⬇️"
        )


    # --------------------------------------------------------
    # TEMPERATURE
    # --------------------------------------------------------

    if baby["temperature_c"] > 37.5:

        reasons.append(
            f"Temperature: {baby['temperature_c']}°C ⬆️"
        )

    elif baby["temperature_c"] < 36.5:

        reasons.append(
            f"Temperature: {baby['temperature_c']}°C ⬇️"
        )


    # --------------------------------------------------------
    # RESPIRATORY RATE
    # --------------------------------------------------------

    if baby["respiratory_rate_bpm"] > 50:

        reasons.append(
            f"Respiratory Rate: "
            f"{baby['respiratory_rate_bpm']}/min ⬆️"
        )

    elif baby["respiratory_rate_bpm"] < 30:

        reasons.append(
            f"Respiratory Rate: "
            f"{baby['respiratory_rate_bpm']}/min ⬇️"
        )


    # --------------------------------------------------------
    # APGAR
    # --------------------------------------------------------

    if baby["apgar_score"] < 7:

        reasons.append(
            f"APGAR Score: {baby['apgar_score']} ⬇️"
        )


    # --------------------------------------------------------
    # WEIGHT
    # --------------------------------------------------------

    if baby["weight_kg"] < 2.5:

        reasons.append(
            f"Weight: {baby['weight_kg']} kg ⬇️"
        )


    # --------------------------------------------------------
    # REFLEXES
    # --------------------------------------------------------

    if baby["reflexes_normal"] == 0:

        reasons.append(
            "Reflexes: Abnormal ⬇️"
        )


    return reasons


# ============================================================
# PROCESS ONE BABY
# ============================================================

def process_one_baby(baby: BabyData):

    # --------------------------------------------------------
    # CONVERT TO DICTIONARY
    # --------------------------------------------------------

    baby_dict = baby.model_dump()


    # --------------------------------------------------------
    # CREATE MODEL INPUT
    # --------------------------------------------------------

    input_data = pd.DataFrame([
        {
            feature: baby_dict[feature]
            for feature in FEATURES
        }
    ])

    input_data = input_data[FEATURES]


    # --------------------------------------------------------
    # SCALE
    # --------------------------------------------------------

    scaled_data = scaler.transform(
        input_data
    )


    # --------------------------------------------------------
    # AI PREDICTION
    # --------------------------------------------------------

    prediction_number = model.predict(
        scaled_data
    )[0]


    # --------------------------------------------------------
    # MODEL PROBABILITIES
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        scaled_data
    )[0]


    # --------------------------------------------------------
    # CONVERT NUMBER → STATUS
    # --------------------------------------------------------

    status = label_encoder.inverse_transform(
        [prediction_number]
    )[0]


    # --------------------------------------------------------
    # PREDICTION SCORE
    # --------------------------------------------------------

    class_index = list(
        model.classes_
    ).index(
        prediction_number
    )

    prediction_score = round(
        probabilities[class_index] * 100
    )


    # --------------------------------------------------------
    # GENERATE REASONS
    # ONLY MODERATE / CRITICAL
    # --------------------------------------------------------

    reasons = []

    if status in [
        "MODERATE",
        "CRITICAL"
    ]:

        reasons = get_vital_reasons(
            baby_dict
        )


    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    result = {

        "baby_id": baby.baby_id,

        "status": status,

        "prediction_score": prediction_score,

        "vitals": {

            "heart_rate_bpm":
                baby.heart_rate_bpm,

            "oxygen_saturation":
                baby.oxygen_saturation,

            "temperature_c":
                baby.temperature_c,

            "respiratory_rate_bpm":
                baby.respiratory_rate_bpm

        },

        "reasons": reasons,

        "timestamp": time.time()
    }


    return result


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {

        "message":
            "Neonatal AI PC2 Server is running",

        "status":
            "online",

        "architecture":
            "PC1 → PC2 AI → PC3",

        "model":
            "Random Forest",

        "multi_baby":
            True
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy",

        "model_loaded":
            True,

        "model_classes":
            label_encoder.classes_.tolist(),

        "features":
            len(FEATURES),

        "trees":
            len(model.estimators_)

    }


# ============================================================
# PC1 → PC2
# SINGLE BABY PREDICTION
# ============================================================

@app.post("/predict")
def predict(baby: BabyData):

    try:

        result = process_one_baby(
            baby
        )


        # ----------------------------------------------------
        # SAVE LATEST RESULT
        # ----------------------------------------------------

        with prediction_lock:

            latest_predictions[
                baby.baby_id
            ] = result


        # ----------------------------------------------------
        # UPDATE JSON FILE
        # ----------------------------------------------------

        save_predictions_to_json()


        return result


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# PC1 → PC2
# MULTIPLE BABY PREDICTION
# ============================================================

@app.post("/predict-batch")
def predict_batch(
    data: MultipleBabiesData
):

    try:

        # ----------------------------------------------------
        # CHECK EMPTY REQUEST
        # ----------------------------------------------------

        if not data.babies:

            raise HTTPException(
                status_code=400,
                detail="No babies received"
            )


        results = []


        # ----------------------------------------------------
        # PROCESS EVERY BABY
        # ----------------------------------------------------

        for baby in data.babies:

            result = process_one_baby(
                baby
            )

            results.append(
                result
            )


            # -----------------------------------------------
            # STORE LATEST RESULT FOR THIS BABY
            # -----------------------------------------------

            with prediction_lock:

                latest_predictions[
                    baby.baby_id
                ] = result


        # ----------------------------------------------------
        # SAVE ALL RESULTS
        # ----------------------------------------------------

        save_predictions_to_json()


        # ----------------------------------------------------
        # RETURN ALL PREDICTIONS
        # ----------------------------------------------------

        return {

            "success": True,

            "number_of_babies":
                len(results),

            "babies":
                results,

            "timestamp":
                time.time()

        }


    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# PC3 → PC2
# GET ALL LATEST PREDICTIONS
# ============================================================

@app.get("/latest")
def get_latest():

    with prediction_lock:

        return {

            "success":
                True,

            "number_of_babies":
                len(latest_predictions),

            "babies":
                list(
                    latest_predictions.values()
                )

        }


# ============================================================
# PC3 → PC2
# GET ONE BABY
# ============================================================

@app.get("/latest/{baby_id}")
def get_baby_prediction(
    baby_id: str
):

    with prediction_lock:

        if baby_id not in latest_predictions:

            raise HTTPException(
                status_code=404,
                detail="Baby not found"
            )


        return {

            "success":
                True,

            "baby":
                latest_predictions[
                    baby_id
                ]

        }


# ============================================================
# STARTUP MESSAGE
# ============================================================

print()

print(
    "=============================================="
)

print(
    "       NEONATAL AI PC2 SERVER"
)

print(
    "=============================================="
)

print(
    "Model classes:",
    model.classes_
)

print(
    "Number of features:",
    model.n_features_in_
)

print(
    "Number of trees:",
    len(model.estimators_)
)

print(
    "Label classes:",
    label_encoder.classes_
)

print(
    "Multi-baby endpoint:",
    "/predict-batch"
)

print(
    "PC3 endpoint:",
    "/latest"
)

print(
    "CORS:",
    "ENABLED"
)

print(
    "=============================================="
)