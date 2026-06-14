from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from shared_data import dashboard_data, update_dynamic_vitals, add_log
import threading
import time
import asyncio
from contextlib import asynccontextmanager

# Import AI Models
try:
    from motion_detection import MotionDetector
except ImportError as e:
    print(f"Error importing MotionDetector: {e}")
    MotionDetector = None

try:
    from cry_detection_yamnet import CryDetector
except ImportError as e:
    print(f"Error importing CryDetector: {e}")
    CryDetector = None

# Global instances
motion_detector = None
cry_detector = None
camera_enabled = True # Track camera status on backend

# Background thread for Cry Detection
def run_cry_detection():
    global cry_detector
    if not CryDetector:
        print("CryDetector not found. Skipping.")
        return

    print("Starting Bio-Acoustic Monitoring...")
    if cry_detector is None:
        cry_detector = CryDetector()
    
    while True:
        try:
            # If camera is disabled, stop detection and alerts
            if not camera_enabled:
                dashboard_data["cryDetection"].update({
                    "status": "normal",
                    "cryType": "Disabled",
                    "confidence": 0,
                    "intensity": 0,
                    "duration": 0,
                    "lastDetected": "Camera Off"
                })
                time.sleep(1)
                continue

            # Perform detection (audio sampling)
            result = cry_detector.detect()
            
            # Update shared data
            dashboard_data["cryDetection"].update({
                "status": "distress" if result["isCrying"] else "normal",
                "cryType": result["cryType"].capitalize(),
                "confidence": result["confidence"],
                "intensity": int(result["confidence"] * 0.8) if result["isCrying"] else 0,
                "duration": result["silentTime"],
                "lastDetected": f"{result['silentTime']}s ago" if not result['isCrying'] else "Now"
            })
            
            if result["isCrying"]:
                add_alert("warning", f"Cry detected: {result['cryType']}")
            
            # Also update dynamic patient vitals in this loop
            update_dynamic_vitals()
                
        except Exception as e:
            print(f"Cry Loop Error: {e}")
            time.sleep(1)

def add_alert(level, message):
    # Only add alerts if camera/monitoring is enabled
    if not camera_enabled:
        return
        
    # Prevent duplicate alerts for the same event
    for alert in dashboard_data["alerts"]:
        if alert["message"] == message and (alert["timestamp"] == "Just now" or "Simulation" in alert["message"]):
            return
            
    # Use our unified logger
    add_log(level, message)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global motion_detector, cry_detector
    # Initialize detectors early
    if MotionDetector:
        motion_detector = MotionDetector()
        motion_detector.update_thresholds(dashboard_data["settings"])
    if CryDetector:
        cry_detector = CryDetector()
        
    # Start the Audio AI Monitoring thread
    t2 = threading.Thread(target=run_cry_detection, daemon=True)
    t2.start()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/dashboard")
def get_dashboard():
    # Update stillness time only if camera is enabled and active baby is live
    if motion_detector:
        # Check if the active baby is the live camera source
        active_id = dashboard_data["activeBabyId"]
        is_live = False
        simulation_mode = "off"
        for b in dashboard_data["babies"]:
            if b["id"] == active_id:
                is_live = b["isLiveSource"]
                simulation_mode = b["simulationMode"]
                break

        if camera_enabled and is_live and simulation_mode == "off":
            still_data = motion_detector.get_still_status()
            dashboard_data["motionMonitoring"].update(still_data)
            
            if still_data["status"] == "UNSAFE":
                add_alert("critical", "Prolonged stillness detected!")
            elif still_data["breathingStatus"] == "SLOW":
                add_alert("warning", "Slow breathing detected (Bradypnea)!")
            elif still_data["breathingStatus"] == "SHALLOW":
                add_alert("warning", "Shallow breathing pattern detected!")
        elif not camera_enabled:
            # If camera is disabled, force safe/reset state
            dashboard_data["motionMonitoring"].update({
                "status": "SAFE",
                "stillTime": 0,
                "motion": 0,
                "breathingRate": 0,
                "breathingStatus": "NORMAL",
                "alertActive": False
            })

    # Run the vitals simulation for all babies and update active baby root keys
    update_dynamic_vitals()
            
    return dashboard_data

@app.post("/api/select_baby")
async def select_baby(payload: dict):
    global motion_detector
    baby_id = payload.get("id")
    if baby_id:
        for b in dashboard_data["babies"]:
            if b["id"] == baby_id:
                dashboard_data["activeBabyId"] = baby_id
                # Reset stillness timer on backend if baby is switched
                if motion_detector:
                    motion_detector.last_movement_time = time.time()
                # Update vitals immediately to apply selection
                update_dynamic_vitals()
                return {"status": "success", "activeBabyId": baby_id}
    return {"status": "error", "message": f"Baby ID {baby_id} not found"}

@app.post("/api/settings")
async def update_settings(payload: dict):
    global motion_detector
    dashboard_data["settings"].update(payload)
    if motion_detector:
        motion_detector.update_thresholds(dashboard_data["settings"])
    return {"status": "success", "settings": dashboard_data["settings"]}

@app.post("/api/simulate")
async def simulate_baby_state(payload: dict):
    baby_id = payload.get("id")
    mode = payload.get("mode") # "off", "apnea", "crying", "normal"
    if baby_id:
        for b in dashboard_data["babies"]:
            if b["id"] == baby_id:
                b["simulationMode"] = mode
                
                # Setup quick mock state changes
                if mode == "apnea":
                    b["stillTime"] = int(dashboard_data["settings"]["apneaAlertTime"])
                    b["status"] = "UNSAFE"
                    b["vitals"]["respRate"] = 0
                    b["vitals"]["heartRate"] = 92
                    b["vitals"]["spo2"] = 89
                    add_log("critical", f"Simulation override: APNEA triggered for {b['name']}.")
                elif mode == "crying":
                    b["stillTime"] = 0
                    b["status"] = "SAFE"
                    b["vitals"]["respRate"] = 54
                    b["vitals"]["heartRate"] = 152
                    b["vitals"]["spo2"] = 98
                    add_log("warning", f"Simulation override: DISTRESS CRY triggered for {b['name']}.")
                elif mode == "normal":
                    b["stillTime"] = 0
                    b["status"] = "SAFE"
                    b["vitals"]["respRate"] = 44
                    b["vitals"]["heartRate"] = 140
                    b["vitals"]["spo2"] = 98
                    add_log("info", f"Simulation override: NORMAL vitals enforced for {b['name']}.")
                else: # "off"
                    b["stillTime"] = 0
                    b["status"] = "SAFE"
                    add_log("info", f"Simulation overrides disabled for {b['name']}.")
                
                update_dynamic_vitals()
                return {"status": "success", "baby": b}
    return {"status": "error", "message": f"Baby ID {baby_id} not found"}

@app.post("/api/camera_status")
async def update_camera_status(status: dict):
    global camera_enabled
    camera_enabled = status.get("enabled", True)
    
    if not camera_enabled:
        # Reset movement timer on backend immediately when camera is turned off
        if motion_detector:
            motion_detector.last_movement_time = time.time()
            
        # Immediately reset dashboard states when camera is disabled
        dashboard_data["motionMonitoring"].update({
            "status": "SAFE",
            "stillTime": 0,
            "motion": 0,
            "breathingRate": 0,
            "breathingStatus": "NORMAL",
            "alertActive": False
        })
        
        dashboard_data["cryDetection"].update({
            "status": "normal",
            "cryType": "Monitoring Paused",
            "intensity": 0,
            "duration": 0,
            "confidence": 0,
            "lastDetected": "None"
        })
        
        # Clear active alerts when camera is disabled (stops the alarm)
        dashboard_data["alerts"] = [] 
        
    return {"status": "updated", "camera_enabled": camera_enabled}

@app.post("/api/process_frame")
async def process_frame(file: UploadFile = File(...)):
    global motion_detector
    if motion_detector is None:
        motion_detector = MotionDetector()
        motion_detector.update_thresholds(dashboard_data["settings"])
    
    # If camera is disabled, skip processing
    if not camera_enabled:
        return {"status": "skipped", "reason": "camera_disabled"}

    # Also verify if the selected baby is the live source
    active_id = dashboard_data["activeBabyId"]
    is_live = False
    simulation_mode = "off"
    for b in dashboard_data["babies"]:
        if b["id"] == active_id:
            is_live = b["isLiveSource"]
            simulation_mode = b["simulationMode"]
            break
            
    if not is_live or simulation_mode != "off":
        return {"status": "skipped", "reason": "active_baby_not_live_or_simulated"}

    contents = await file.read()
    data = motion_detector.process_frame(contents)
    
    if data:
        dashboard_data["motionMonitoring"].update({
            "status": data["status"],
            "stillTime": data["stillTime"],
            "motion": data["motion"],
            "breathingRate": data.get("breathingRate", 0),
            "breathingStatus": data.get("breathingStatus", "NORMAL"),
            "confidence": data["confidence"],
            "alertActive": data["status"] in ["UNSAFE", "WARNING"]
        })
        
        if data["status"] == "UNSAFE":
            add_alert("critical", "Prolonged stillness detected!")
        elif data.get("breathingStatus") == "SLOW":
            add_alert("warning", "Bradypnea (Slow Breathing)!")
        elif data.get("breathingStatus") == "SHALLOW":
            add_alert("warning", "Shallow Breathing Monitoring!")
            
        # Update details in the ward list
        update_dynamic_vitals()
            
    return {"status": "processed"}

@app.get("/")
def read_root():
    return {"status": "System Online"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 5001))
    uvicorn.run(app, host="0.0.0.0", port=port)
