# shared_data.py
import random
import time

# This structure matches the Frontend's expected data format
dashboard_data = {
    # Active baby ID
    "activeBabyId": "NB-2026-001",

    # Motion monitoring from OpenCV backend
    "motionMonitoring": {
        "status": "SAFE",  # SAFE / STILL / WARNING / UNSAFE
        "stillTime": 0,
        "motion": 0.0,
        "confidence": 98,
        "breathingRate": 45,
        "breathingStatus": "NORMAL",
        "alertActive": False
    },
    
    # Cry Detection AI
    "cryDetection": {
        "status": "normal",  # normal / distress
        "cryType": "None detected",  # hunger, pain, discomfort, none
        "intensity": 0,  # 0-100
        "duration": 0,  # seconds
        "confidence": 0,
        "lastDetected": "None",
        "audioWaveform": [0.1] * 10  # Placeholder
    },
    
    # Sleep Position Monitoring
    "sleepPosition": {
        "position": "Back",
        "status": "safe",
        "riskLevel": "low",
        "timeInPosition": 12,
        "confidence": 92,
        "recommendations": "Position is optimal for breathing",
        "positionHistory": [
             { "time": "12:00", "position": "Back" }
        ]
    },
    
    # Breathing Pattern Analysis
    "breathingAnalysis": {
        "rate": 45,
        "pattern": "Regular",
        "status": "normal",
        "oxygenLevel": 98,
        "confidence": 89,
        "irregularities": 0,
        "trend": "stable"
    },
    
    # Face & Distress Detection
    "faceAnalysis": {
        "faceDetected": True,
        "distressLevel": "none",
        "emotionalState": "calm",
        "facialMovement": "minimal",
        "eyesOpen": False,
        "mouthOpen": False,
        "confidence": 88,
        "alerts": []
    },
    
    # Active Patient Info (Dynamic updates)
    "patient": {
        "id": "NB-2026-001",
        "name": "Aarav Sharma",
        "age": "3 days old",
        "weight": "3.2 kg",
        "gestationalAge": "38 weeks",
        "admissionDate": "Jan 21, 2026",
        "status": "Stable"
    },
    
    "aiStatus": [
        { "title": "Cry Pattern", "value": "Active", "confidence": 92, "note": "Audio listening", "status": "normal" },
        { "title": "Sleep Position", "value": "Safe", "confidence": 95, "note": "Vision active", "status": "normal" },
        { "title": "Body Temperature", "value": "36.8 °C", "confidence": 98, "note": "Infrared active", "status": "normal" }
    ],
    
    "vitals": [
        { "title": "Heart Rate", "value": 142, "unit": "bpm", "normalRange": "120-160", "status": "normal" },
        { "title": "Respiratory Rate", "value": 45, "unit": "breaths/min", "normalRange": "40-60", "status": "normal" },
        { "title": "Oxygen Saturation", "value": 98, "unit": "%", "normalRange": "95-100", "status": "normal" }
    ],
    
    # Alerts log
    "alerts": [
        {"type": "info", "message": "Clinical telemetry link initialized.", "timestamp": "12:00 PM"}
    ],
    
    "riskAssessment": {
        "overall": "low",
        "confidence": 94,
        "categories": [
            { "name": "Respiratory", "level": "Low", "color": "#10b981" },
            { "name": "Cardiac", "level": "Low", "color": "#10b981" },
            { "name": "Neurological", "level": "Low", "color": "#10b981" },
            { "name": "Thermal", "level": "Low", "color": "#10b981" }
        ]
    },
    
    "trainingData": [
        { "epoch": 1, "accuracy": 62, "loss": 0.92 },
        { "epoch": 2, "accuracy": 68, "loss": 0.81 },
        { "epoch": 3, "accuracy": 74, "loss": 0.69 },
        { "epoch": 4, "accuracy": 81, "loss": 0.54 },
        { "epoch": 5, "accuracy": 88, "loss": 0.38 }
    ],
    
    "events": [
        { "time": "12:00 PM", "type": "info", "description": "Neo-Care Clinical Monitor Started" }
    ],

    # Ward list of all babies (resembling Google Meet participants grid)
    "babies": [
        {
            "id": "NB-2026-001",
            "name": "Aarav Sharma",
            "age": "3 days old",
            "weight": "3.2 kg",
            "gestationalAge": "38 weeks",
            "status": "SAFE",
            "simulationMode": "off", # 'off' | 'apnea' | 'crying' | 'normal'
            "vitals": {
                "heartRate": 142,
                "respRate": 45,
                "spo2": 98,
                "temp": 36.8
            },
            "stillTime": 0,
            "cryStatus": "normal",
            "sleepPos": "Back",
            "isLiveSource": True
        },
        {
            "id": "NB-2026-002",
            "name": "Kiara Patel",
            "age": "5 days old",
            "weight": "2.9 kg",
            "gestationalAge": "37 weeks",
            "status": "WARNING",
            "simulationMode": "off",
            "vitals": {
                "heartRate": 135,
                "respRate": 25,  # Warning: Slow breathing
                "spo2": 96,
                "temp": 36.5
            },
            "stillTime": 2,
            "cryStatus": "normal",
            "sleepPos": "Back",
            "isLiveSource": False
        },
        {
            "id": "NB-2026-003",
            "name": "Aditya Rao",
            "age": "2 days old",
            "weight": "3.1 kg",
            "gestationalAge": "39 weeks",
            "status": "UNSAFE",
            "simulationMode": "off",
            "vitals": {
                "heartRate": 95,   # Danger: Bradycardia
                "respRate": 0,    # Apnea
                "spo2": 91,       # Low Oxygen
                "temp": 36.2
            },
            "stillTime": 22,
            "cryStatus": "normal",
            "sleepPos": "Stomach",
            "isLiveSource": False
        },
        {
            "id": "NB-2026-004",
            "name": "Riya Sen",
            "age": "6 days old",
            "weight": "3.4 kg",
            "gestationalAge": "38 weeks",
            "status": "SAFE",
            "simulationMode": "off",
            "vitals": {
                "heartRate": 145,
                "respRate": 48,
                "spo2": 99,
                "temp": 36.9
            },
            "stillTime": 0,
            "cryStatus": "normal",
            "sleepPos": "Side",
            "isLiveSource": False
        },
        {
            "id": "NB-2026-005",
            "name": "Vivaan Kapoor",
            "age": "4 days old",
            "weight": "2.7 kg",
            "gestationalAge": "36 weeks",
            "status": "SAFE",
            "simulationMode": "off",
            "vitals": {
                "heartRate": 149,
                "respRate": 52,
                "spo2": 97,
                "temp": 37.1
            },
            "stillTime": 0,
            "cryStatus": "distress",  # Warning: Cry detected
            "sleepPos": "Back",
            "isLiveSource": False
        },
        {
            "id": "NB-2026-006",
            "name": "Ananya Nair",
            "age": "7 days old",
            "weight": "3.3 kg",
            "gestationalAge": "39 weeks",
            "status": "OFFLINE",
            "simulationMode": "off",
            "vitals": {
                "heartRate": 0,
                "respRate": 0,
                "spo2": 0,
                "temp": 0
            },
            "stillTime": 0,
            "cryStatus": "normal",
            "sleepPos": "Unknown",
            "isLiveSource": False
        }
    ],

    # Framework setting thresholds
    "settings": {
        "movementPixelThreshold": 50,
        "minMotionArea": 100,
        "significantMotionThreshold": 2000,
        "apneaAlertTime": 20,
        "stillnessWarningTime": 12,
        "slowBreathingRate": 30
    }
}

# Keep track of when simulated patients' states change
last_sim_time = time.time()
aditya_apnea_timer = 22

def add_log(level, msg):
    """Add a timestamped event log to security and events stream"""
    now_str = time.strftime("%I:%M:%S %p")
    # Add to alerts list
    dashboard_data["alerts"].insert(0, {
        "type": level,
        "message": msg,
        "timestamp": now_str
    })
    dashboard_data["alerts"] = dashboard_data["alerts"][:10]
    
    # Add to events log
    dashboard_data["events"].insert(0, {
        "time": now_str,
        "type": level,
        "description": msg
    })
    dashboard_data["events"] = dashboard_data["events"][:10]

def update_dynamic_vitals():
    global last_sim_time, aditya_apnea_timer
    
    current_time = time.time()
    dt = current_time - last_sim_time
    last_sim_time = current_time

    # Find the active baby object in the list
    active_id = dashboard_data["activeBabyId"]
    active_baby = None
    for b in dashboard_data["babies"]:
        if b["id"] == active_id:
            active_baby = b
            break
            
    # 1. Update live baby from OpenCV motion data if it is the active one
    if active_baby and active_baby["isLiveSource"] and active_baby["simulationMode"] == "off":
        active_baby["vitals"]["heartRate"] = random.randint(138, 146)
        active_baby["vitals"]["spo2"] = random.randint(97, 99)
        active_baby["vitals"]["temp"] = 36.8
        active_baby["vitals"]["respRate"] = dashboard_data["motionMonitoring"]["breathingRate"]
        active_baby["stillTime"] = dashboard_data["motionMonitoring"]["stillTime"]
        active_baby["status"] = dashboard_data["motionMonitoring"]["status"]
        active_baby["cryStatus"] = dashboard_data["cryDetection"]["status"]
        active_baby["sleepPos"] = dashboard_data["sleepPosition"]["position"]

    # 2. Update/simulate vitals for all babies (including active if under simulation override)
    for b in dashboard_data["babies"]:
        
        # If baby has a manual simulation mode override active, enforce those values
        if b["simulationMode"] == "apnea":
            b["stillTime"] = min(99, b["stillTime"] + int(dt * 1.5))
            b["status"] = "UNSAFE"
            b["vitals"]["respRate"] = 0
            b["vitals"]["heartRate"] = max(82, b["vitals"]["heartRate"] - random.randint(0, 1))
            b["vitals"]["spo2"] = max(85, b["vitals"]["spo2"] - random.randint(0, 1))
            b["vitals"]["temp"] = 36.1
            b["cryStatus"] = "normal"
            b["sleepPos"] = "Stomach"
            continue
        elif b["simulationMode"] == "crying":
            b["stillTime"] = 0
            b["status"] = "SAFE"
            b["vitals"]["respRate"] = random.randint(46, 56)
            b["vitals"]["heartRate"] = random.randint(146, 160)
            b["vitals"]["spo2"] = random.randint(96, 98)
            b["vitals"]["temp"] = 37.2
            b["cryStatus"] = "distress"
            b["sleepPos"] = "Back"
            continue
        elif b["simulationMode"] == "normal":
            b["stillTime"] = 0
            b["status"] = "SAFE"
            b["vitals"]["respRate"] = random.randint(40, 48)
            b["vitals"]["heartRate"] = random.randint(136, 144)
            b["vitals"]["spo2"] = random.randint(98, 99)
            b["vitals"]["temp"] = 36.7
            b["cryStatus"] = "normal"
            b["sleepPos"] = "Back"
            continue

        # If simulationMode == "off", fall back to default auto-simulation profiles:
        
        # OFFLINE baby
        if b["status"] == "OFFLINE":
            b["vitals"] = {"heartRate": 0, "respRate": 0, "spo2": 0, "temp": 0}
            b["stillTime"] = 0
            continue

        # Skip live active baby in 'off' mode since we updated it via camera above
        if b["id"] == active_id and b["isLiveSource"]:
            continue
            
        # Aditya Rao (NB-2026-003) - Auto Apnea cycle simulation
        if b["id"] == "NB-2026-003":
            aditya_apnea_timer += dt
            b["stillTime"] = int(aditya_apnea_timer)
            apnea_limit = dashboard_data["settings"]["apneaAlertTime"]
            warning_limit = dashboard_data["settings"]["stillnessWarningTime"]
            
            if b["stillTime"] >= apnea_limit:
                if b["status"] != "UNSAFE":
                    add_log("critical", f"Apnea Emergency triggered for {b['name']}.")
                b["status"] = "UNSAFE"
                b["vitals"]["respRate"] = 0
                b["vitals"]["heartRate"] = max(90, b["vitals"]["heartRate"] - random.randint(0, 1))
                b["vitals"]["spo2"] = max(88, b["vitals"]["spo2"] - random.randint(0, 1))
            elif b["stillTime"] >= warning_limit:
                b["status"] = "STILL"
                b["vitals"]["respRate"] = random.randint(0, 10)
            else:
                b["status"] = "SAFE"
                b["vitals"]["respRate"] = random.randint(35, 45)
                b["vitals"]["heartRate"] = random.randint(120, 140)
                b["vitals"]["spo2"] = random.randint(95, 98)
                
            # Simulate a recovery cycle every 50 seconds to make it realistic
            if aditya_apnea_timer > 50:
                aditya_apnea_timer = 0
                add_log("info", f"{b['name']} breathing movements recovered.")
                b["vitals"]["heartRate"] = 125
                b["vitals"]["spo2"] = 96
        
        # Kiara Patel (NB-2026-002) - Bradypnea Warning
        elif b["id"] == "NB-2026-002":
            b["stillTime"] = 0
            b["status"] = "WARNING"
            slow_rate = dashboard_data["settings"]["slowBreathingRate"]
            b["vitals"]["respRate"] = random.randint(slow_rate - 8, slow_rate - 2)
            b["vitals"]["heartRate"] = random.randint(125, 135)
            b["vitals"]["spo2"] = random.randint(95, 97)
            b["vitals"]["temp"] = 36.5
            
        # Vivaan Kapoor (NB-2026-005) - Safe but crying
        elif b["id"] == "NB-2026-005":
            b["stillTime"] = 0
            b["status"] = "SAFE"
            b["vitals"]["respRate"] = random.randint(48, 55)
            b["vitals"]["heartRate"] = random.randint(145, 155)  # elevated HR due to cry
            b["vitals"]["spo2"] = random.randint(97, 98)
            b["cryStatus"] = "distress"
            
        # Riya Sen (NB-2026-004) - normal safe
        elif b["id"] == "NB-2026-004":
            b["stillTime"] = 0
            b["status"] = "SAFE"
            b["vitals"]["respRate"] = random.randint(42, 48)
            b["vitals"]["heartRate"] = random.randint(138, 144)
            b["vitals"]["spo2"] = random.randint(98, 99)
            
        # Aarav Sharma (NB-2026-001)
        elif b["id"] == "NB-2026-001":
            b["stillTime"] = 0
            b["status"] = "SAFE"
            b["vitals"]["respRate"] = random.randint(40, 46)
            b["vitals"]["heartRate"] = random.randint(140, 144)
            b["vitals"]["spo2"] = random.randint(98, 99)

    # 3. Synchronize active baby to root structures
    if active_baby:
        # Patient info
        dashboard_data["patient"].update({
            "id": active_baby["id"],
            "name": active_baby["name"],
            "age": active_baby["age"],
            "weight": active_baby["weight"],
            "gestationalAge": active_baby["gestationalAge"],
            "status": active_baby["status"]
        })
        
        # Vitals list
        dashboard_data["vitals"] = [
            { "title": "Heart Rate", "value": active_baby["vitals"]["heartRate"], "unit": "bpm", "normalRange": "120-160", "status": "normal" if 120 <= active_baby["vitals"]["heartRate"] <= 160 else "warning" },
            { "title": "Respiratory Rate", "value": active_baby["vitals"]["respRate"], "unit": "breaths/min", "normalRange": "40-60", "status": "normal" if 40 <= active_baby["vitals"]["respRate"] <= 60 else "warning" },
            { "title": "Oxygen Saturation", "value": active_baby["vitals"]["spo2"], "unit": "%", "normalRange": "95-100", "status": "normal" if active_baby["vitals"]["spo2"] >= 95 else "warning" }
        ]

        # Sync motion monitoring state if active baby is simulated or overridden
        if not active_baby["isLiveSource"] or active_baby["simulationMode"] != "off":
            dashboard_data["motionMonitoring"].update({
                "status": active_baby["status"],
                "stillTime": active_baby["stillTime"],
                "motion": 0.0 if active_baby["status"] in ["UNSAFE", "STILL"] else 12.5,
                "breathingRate": active_baby["vitals"]["respRate"],
                "breathingStatus": "SLOW" if active_baby["status"] == "WARNING" else ("NORMAL" if active_baby["status"] == "SAFE" else "STOPPED"),
                "alertActive": active_baby["status"] in ["UNSAFE", "WARNING"]
            })
            dashboard_data["cryDetection"].update({
                "status": active_baby["cryStatus"],
                "cryType": "Pain Cry" if active_baby["cryStatus"] == "distress" else "None detected",
                "confidence": 85 if active_baby["cryStatus"] == "distress" else 0
            })
            dashboard_data["sleepPosition"].update({
                "position": active_baby["sleepPos"],
                "status": "safe" if active_baby["sleepPos"] in ["Back", "Side"] else "risk"
            })

    # Overall ward stability metric
    stability = 0
    for b in dashboard_data["babies"]:
        if b["status"] == "UNSAFE": stability += 2
        elif b["status"] == "WARNING" or b["status"] == "STILL": stability += 1
        
    if stability == 0:
        dashboard_data["riskAssessment"]["overall"] = "low"
    elif stability <= 2:
        dashboard_data["riskAssessment"]["overall"] = "medium"
    else:
        dashboard_data["riskAssessment"]["overall"] = "high"
