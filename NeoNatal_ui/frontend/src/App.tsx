import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Shield, Camera, Bell, Monitor, Activity, Heart, Wind, Zap, Mic, RefreshCcw, ArrowLeft, Sliders, LayoutGrid, AlertTriangle, Volume2, VolumeX, Key, Delete, Play, Flame, HelpCircle } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Robust history generator
const generateHistory = () => Array.from({ length: 30 }, (_, i) => ({ 
  time: i, 
  motion: 0, 
  breathing: 0,
  heartRate: 140,
  spo2: 98
}));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>(generateHistory());
  const [error, setError] = useState<string | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor' | 'settings'>('overview');
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [isSimPanelExpanded, setIsSimPanelExpanded] = useState<boolean>(true);
  
  // Settings Form values
  const [settingsForm, setSettingsForm] = useState({
    movementPixelThreshold: 50,
    minMotionArea: 100,
    significantMotionThreshold: 2000,
    apneaAlertTime: 20,
    stillnessWarningTime: 12,
    slowBreathingRate: 30
  });

  // 0. Sync Camera Status with Backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/camera_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: isCameraEnabled })
    }).catch(err => console.error("Camera sync error:", err));
  }, [isCameraEnabled]);

  // 1. Data Polling
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard`);
        if (!res.ok) throw new Error("Backend Connection Failed");
        const json = await res.json();
        setData(json);
        setError(null);

        // Update Waveform Data
        setHistory(prev => {
          const activeBaby = json.babies?.find((b: any) => b.id === json.activeBabyId) || {};
          const newEntry = {
            time: prev.length,
            motion: json.motionMonitoring?.motion || 0,
            breathing: json.motionMonitoring?.breathingRate || 0,
            heartRate: activeBaby.vitals?.heartRate || 140,
            spo2: activeBaby.vitals?.spo2 || 98
          };
          return [...prev.slice(-29), newEntry];
        });
      } catch (err: any) {
        console.error("Polling Error:", err);
        setError(err.message);
      }
    };

    const interval = setInterval(poll, 800);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Sync settings when backend dashboard data loads
  useEffect(() => {
    if (data?.settings) {
      setSettingsForm(data.settings);
    }
  }, [data?.settings]);

  // 2. Apnea Alarm Logic
  useEffect(() => {
    let alarm: any;
    
    // Check if active baby has a crisis, OR if ANY simulated/inactive baby is in UNSAFE status
    const activeBabyObj = data?.babies?.find((b: any) => b.id === data?.activeBabyId) || {};
    const isLocalCrisis = isCameraEnabled && (data?.motionMonitoring?.status === 'UNSAFE' || (data?.motionMonitoring?.stillTime >= (data?.settings?.apneaAlertTime || 20)));
    const isSimulatedCrisis = data?.babies?.some((b: any) => b.status === 'UNSAFE');
    const isCrisis = isLocalCrisis || isSimulatedCrisis;

    if (isCrisis && isAuthenticated && !isMasterMuted) {
      const playAlarm = () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          g.gain.setValueAtTime(0.1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
          setTimeout(() => ctx.close(), 1000);
        } catch (e) { }
      };
      playAlarm();
      alarm = setInterval(playAlarm, 1000);
    }
    return () => clearInterval(alarm);
  }, [data, isAuthenticated, isCameraEnabled, isMasterMuted]);

  // Select baby and request selection from API
  const handleSelectBaby = async (babyId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/select_baby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: babyId })
      });
      if (res.ok) {
        // Instantly poll dashboard to prevent UI mismatch
        const dashboardRes = await fetch(`${API_BASE_URL}/api/dashboard`);
        if (dashboardRes.ok) {
          setData(await dashboardRes.json());
        }
        setActiveTab('monitor');
      }
    } catch (e) {
      console.error("Error selecting baby:", e);
    }
  };

  // Submit revised settings thresholds to backend
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        alert("Framework thresholds updated successfully!");
        setActiveTab('overview');
      }
    } catch (e) {
      console.error("Error saving settings:", e);
      alert("Failed to save settings.");
    }
  };

  // Trigger simulation state on backend
  const handleSimulateState = async (babyId: string, mode: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: babyId, mode: mode })
      });
      // Poll instantly to refresh vitals
      const dashboardRes = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (dashboardRes.ok) {
        setData(await dashboardRes.json());
      }
    } catch (e) {
      console.error("Error triggering simulation:", e);
    }
  };

  // 3. Render Handling with Crash Protection
  try {
    if (!isAuthenticated) return <AuthFlow onLogin={() => setIsAuthenticated(true)} />;

    if (!data) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Activity size={60} color="var(--primary)" style={{ animation: 'pulse-soft 1s infinite' }} />
            <h2 style={{ marginTop: '20px', fontWeight: 800, color: 'var(--text-muted)' }}>CONNECTING TO CLINICAL TERMINAL...</h2>
            {error && <p style={{ color: 'var(--secondary)', marginTop: '10px' }}>{error}</p>}
          </div>
        </div>
      );
    }

    const mm = data.motionMonitoring || {};
    const cd = data.cryDetection || {};
    const al = data.alerts || [];
    const babiesList = data.babies || [];
    const settings = data.settings || {};

    const activeBabyObj = babiesList.find((b: any) => b.id === data.activeBabyId) || {};
    
    // Check local crisis thresholds based on settings
    const apneaLimit = settings.apneaAlertTime || 20;
    const isCritical = activeBabyObj.status === 'UNSAFE' || mm.status === 'UNSAFE' || mm.stillTime >= apneaLimit;
    const isWarning = activeBabyObj.status === 'WARNING' || mm.status === 'WARNING';
    const isCrisis = isCritical || isWarning;

    // Check if any baby in the entire ward is in crisis
    const anyWardCritical = babiesList.some((b: any) => b.status === 'UNSAFE');

    // Helper for initials
    const getInitials = (name: string) => {
      if (!name) return "NB";
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
      <div className={`fade-up ${isCrisis || anyWardCritical ? 'alert-pulse' : ''}`} style={{ minHeight: '100vh', padding: '40px', display: 'flex', gap: '40px' }}>
        
        {/* Sidebar Nav */}
        <aside className="premium-card glass-panel" style={{ width: '320px', padding: '40px 30px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Heart fill="white" /></div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900 }}>NEO-CARE</h1>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>CLINICAL WARD HUB</span>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            <div 
              className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
            >
              <LayoutGrid size={20} /> Ward Overview
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'monitor' ? 'active' : ''}`} 
              onClick={() => setActiveTab('monitor')}
            >
              <Activity size={20} /> Detailed Monitor
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('settings')}
            >
              <Sliders size={20} /> Threshold Settings
            </div>
          </nav>

          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px solid var(--surface-border)', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>SELECTED PATIENT</div>
            <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '14px', marginTop: '4px' }}>{activeBabyObj.name || "Aarav Sharma"}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>ID: {data.activeBabyId}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', fontSize: '11px', fontWeight: 800, color: activeBabyObj.simulationMode !== 'off' ? 'var(--accent)' : 'var(--mint)' }}>
              <div style={{ width: '6px', height: '6px', background: activeBabyObj.simulationMode !== 'off' ? 'var(--accent)' : 'var(--mint)', borderRadius: '50%' }} />
              {activeBabyObj.simulationMode !== 'off' ? `Simulation Overridden (${activeBabyObj.simulationMode})` : "Vision Feed Active"}
            </div>
          </div>

          <button onClick={() => window.location.reload()} className="vibrant-btn" style={{ width: '100%', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <RefreshCcw size={18} /> RESET SESSION
          </button>
        </aside>

        {/* Main Workspace */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* VIEW: WARD OVERVIEW (GOOGLE MEET GRID STYLE) */}
          {activeTab === 'overview' && (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '32px', fontWeight: 900 }}>Ward Overview Dashboard</h2>
                  <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Active Neonatal ICU Incubators (Central Hub overview)</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setIsMasterMuted(!isMasterMuted)} 
                    style={{ padding: '12px 20px', background: 'white', border: '1px solid var(--surface-border)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
                  >
                    {isMasterMuted ? <VolumeX size={18} color="var(--secondary)" /> : <Volume2 size={18} color="var(--mint)" />}
                    {isMasterMuted ? "WARD MUTED" : "ALARM VOL: 100%"}
                  </button>
                  {anyWardCritical && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'var(--secondary)', color: 'white', borderRadius: '20px', fontWeight: 900, animation: 'pulse-soft 1s infinite' }}>
                      <AlertTriangle size={20} /> WARD ALARM ACTIVE
                    </div>
                  )}
                </div>
              </header>

              <div className="meet-grid">
                {babiesList.map((baby: any) => {
                  const isCurrentActive = baby.id === data.activeBabyId;
                  const isBabyCritical = baby.status === 'UNSAFE';
                  const isBabyWarning = baby.status === 'WARNING' || baby.status === 'STILL';
                  
                  return (
                    <div 
                      key={baby.id} 
                      className={`meet-tile ${isCurrentActive ? 'active-focus' : ''} ${isBabyCritical ? 'critical-pulse' : (isBabyWarning ? 'warning-pulse' : '')}`}
                      onClick={() => handleSelectBaby(baby.id)}
                    >
                      {/* Vitals Overlay (top right) */}
                      {baby.status !== 'OFFLINE' && (
                        <div className="meet-vitals-overlay">
                          <div className="meet-vital-item" title="Heart Rate">
                            <Heart size={12} fill="var(--secondary)" color="var(--secondary)" className={baby.vitals?.heartRate > 0 ? "heartbeat-icon" : ""} style={{ animationDuration: `${60 / (baby.vitals?.heartRate || 140)}s` }} /> 
                            {baby.vitals?.heartRate}
                          </div>
                          <div className="meet-vital-item" title="Breathing Rate">
                            <Wind size={12} color="var(--primary)" /> 
                            {baby.vitals?.respRate}
                          </div>
                          <div className="meet-vital-item" title="SpO2">
                            <Zap size={12} color="var(--accent)" /> 
                            {baby.vitals?.spo2}%
                          </div>
                        </div>
                      )}

                      {/* Participant Tile Center (Camera feed or Initials Avatar) */}
                      <div className="meet-avatar-container">
                        {baby.isLiveSource && isCameraEnabled && isCurrentActive && baby.simulationMode === 'off' ? (
                          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, borderRadius: '22px', overflow: 'hidden' }}>
                            <CameraPreview isAlert={isCritical} isEnabled={isCameraEnabled} />
                            <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '6px', height: '6px', background: 'var(--secondary)', borderRadius: '50%', animation: 'pulse-soft 0.8s infinite' }} />
                              LIVE FEED
                            </div>
                          </div>
                        ) : (
                          <div className="meet-avatar" style={{
                            background: baby.status === 'OFFLINE' ? '#475569' : 
                                       isBabyCritical ? 'linear-gradient(135deg, var(--secondary), #be123c)' : 
                                       isBabyWarning ? 'linear-gradient(135deg, var(--accent), #d97706)' : 
                                       'linear-gradient(135deg, var(--primary), var(--lavender))'
                          }}>
                            {getInitials(baby.name)}
                          </div>
                        )}
                      </div>

                      {/* Bottom Info bar */}
                      <div className="meet-bottom-info">
                        <div>
                          <div className="meet-name">{baby.name}</div>
                          <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 700 }}>
                            {baby.age} • {baby.weight}
                          </div>
                        </div>
                        <span className={`meet-status-badge ${
                          baby.status === 'SAFE' ? 'safe' : 
                          baby.status === 'OFFLINE' ? 'offline' : 
                          baby.status === 'UNSAFE' ? 'danger' : 'warning'
                        }`}>
                          {baby.status === 'UNSAFE' ? 'Apnea Crisis' : baby.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* VIEW: DETAILED MONITOR */}
          {activeTab === 'monitor' && (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <button 
                    onClick={() => setActiveTab('overview')} 
                    style={{ background: 'white', border: '1px solid var(--surface-border)', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
                    title="Back to Overview"
                  >
                    <ArrowLeft size={20} color="var(--text-main)" />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '32px', fontWeight: 900 }}>Detailed Vitals Monitor</h2>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Active patient: {activeBabyObj.name} (ID: {activeBabyObj.id})</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setIsMasterMuted(!isMasterMuted)} 
                    style={{ padding: '12px 20px', background: 'white', border: '1px solid var(--surface-border)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}
                  >
                    {isMasterMuted ? <VolumeX size={18} color="var(--secondary)" /> : <Volume2 size={18} color="var(--mint)" />}
                    {isMasterMuted ? "MUTED" : "UNMUTED"}
                  </button>
                  <div style={{ padding: '15px 25px', borderRadius: '24px', background: 'white', border: '1px solid var(--surface-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>PATIENT STATUS</div>
                    <div style={{ fontWeight: 900, color: isCritical ? 'var(--secondary)' : (isWarning ? 'var(--accent)' : 'var(--mint)') }}>
                      {isCritical ? 'CRITICAL APNEA' : (isWarning ? (mm.breathingStatus === 'SLOW' ? 'SLOW BREATHING' : 'SHALLOW BREATHING') : 'STABLE')}
                    </div>
                  </div>
                </div>
              </header>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <StatCard
                  label={`Breathing (${mm.breathingStatus || 'NORMAL'})`}
                  value={mm.breathingRate || 0}
                  unit="BPM"
                  color={isWarning ? 'var(--accent)' : 'var(--primary)'}
                  icon={<Wind />}
                  isFlashing={isWarning}
                />
                <StatCard label="Motion Intensity" value={mm.motion || 0} unit="RAW" color="var(--lavender)" icon={<Zap />} />
                <StatCard label="Apnea Timer" value={mm.stillTime || 0} unit="SEC" color={mm.stillTime > (settings.stillnessWarningTime || 12) ? 'var(--secondary)' : 'var(--mint)'} icon={<Activity />} />
                <StatCard label="AI Confidence" value={mm.confidence || 98} unit="%" color="var(--primary)" icon={<Shield />} />
              </div>

              {/* Live Content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', flex: 1 }}>
                
                {/* Vision Camera Preview Panel */}
                <div className="premium-card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '18px' }}>Vision Core Live Feed</h3>
                    {activeBabyObj.isLiveSource && activeBabyObj.simulationMode === 'off' ? (
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>CAMERA CONTROL</span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={isCameraEnabled}
                              onChange={() => setIsCameraEnabled(!isCameraEnabled)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ width: '8px', height: '8px', background: isCameraEnabled ? 'var(--mint)' : 'var(--text-muted)', borderRadius: '50%', animation: isCameraEnabled ? 'pulse-soft 1s infinite' : 'none' }} />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: isCameraEnabled ? 'var(--mint)' : 'var(--text-muted)' }}>{isCameraEnabled ? 'LIVE' : 'OFFLINE'}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%', animation: 'pulse-soft 1.2s infinite' }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>SIMULATION FEED</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
                    {activeBabyObj.isLiveSource && activeBabyObj.simulationMode === 'off' ? (
                      <CameraPreview isAlert={isCritical} isEnabled={isCameraEnabled} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'absolute', inset: 0 }}>
                        <div className="meet-avatar" style={{ marginBottom: '20px', width: '100px', height: '100px', fontSize: '36px', background: activeBabyObj.status === 'UNSAFE' ? 'var(--secondary)' : 'var(--primary)' }}>{getInitials(activeBabyObj.name)}</div>
                        <h4 style={{ fontSize: '20px', fontWeight: 800 }}>{activeBabyObj.name}</h4>
                        <p style={{ opacity: 0.5, fontSize: '13px', marginTop: '5px' }}>
                          {activeBabyObj.simulationMode !== 'off' 
                            ? `Simulation override mode is active: ${activeBabyObj.simulationMode.toUpperCase()}`
                            : 'Patient vitals simulated electronically'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Double Trend Charts Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Chart 1: Breathing & Motion */}
                  <div className="premium-card glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '14px', marginBottom: '10px' }} className="chart-label">Breathing Rate & Motion Signal</h3>
                    <div style={{ flex: 1, minHeight: '120px' }}>
                      <LiveWaveform data={history} line1="breathing" line2="motion" stroke1="var(--primary)" stroke2="var(--lavender)" gradientId="breathG" />
                    </div>
                  </div>

                  {/* Chart 2: Heart Rate & Oxygen */}
                  <div className="premium-card glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '14px', marginBottom: '10px' }} className="chart-label">Bedside Trend: Heart Rate & SpO2</h3>
                    <div style={{ flex: 1, minHeight: '120px' }}>
                      <LiveWaveform data={history} line1="heartRate" line2="spo2" stroke1="var(--secondary)" stroke2="var(--mint)" gradientId="vitalsG" />
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Analytics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div className="premium-card glass-panel" style={{ padding: '30px', display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: cd.status === 'distress' ? 'var(--secondary)' : 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: `0 10px 25px ${cd.status === 'distress' ? 'rgba(255,133,161,0.3)' : 'rgba(77,222,186,0.3)'}` }}>
                    {cd.status === 'distress' ? <Bell size={40} /> : <Mic size={40} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)' }}>ACOUSTIC CLASSIFICATION</h3>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: cd.status === 'distress' ? 'var(--secondary)' : 'var(--primary)', marginTop: '4px' }}>{cd.cryType?.toUpperCase() || 'CALM'}</div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Confidence: {cd.confidence || 0}%</span>
                      <span style={{ color: 'var(--mint)' }}>Neural Engine Link: Active</span>
                    </div>
                  </div>
                </div>

                <div className="premium-card glass-panel" style={{ padding: '30px' }}>
                  <h3 style={{ fontWeight: 900, fontSize: '16px', marginBottom: '15px' }}>Security & Clinical Events Log</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {al.length > 0 ? al.slice(0, 3).map((a: any, i: number) => {
                      const isCriticalLog = a.type === 'critical';
                      const isWarningLog = a.type === 'warning';
                      return (
                        <div 
                          key={i} 
                          style={{ 
                            padding: '12px 20px', 
                            background: isCriticalLog ? 'rgba(255,133,161,0.08)' : (isWarningLog ? 'rgba(255,210,63,0.08)' : '#F8FAFC'), 
                            borderRadius: '14px', 
                            fontSize: '13px', 
                            fontWeight: 700, 
                            borderLeft: `4px solid ${isCriticalLog ? 'var(--secondary)' : (isWarningLog ? 'var(--accent)' : 'var(--primary)')}`, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            border: '1px solid rgba(0,0,0,0.03)'
                          }}
                        >
                          <span style={{ color: isCriticalLog ? '#9f1239' : '#1e293b' }}>{a.message}</span>
                          <span style={{ opacity: 0.5, fontSize: '11px' }}>{a.timestamp}</span>
                        </div>
                      );
                    }) : <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4 }}>No active clinical events</div>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW: FRAMEWORK SETTINGS */}
          {activeTab === 'settings' && (
            <>
              <header>
                <h2 style={{ fontSize: '32px', fontWeight: 900 }}>Framework Parameter Settings</h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Fine-tune computer vision motion sensitivities and timing thresholds</p>
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
                <div className="premium-card glass-panel" style={{ padding: '40px' }}>
                  <form onSubmit={handleSaveSettings}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '24px', color: 'var(--primary)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px' }}>Computer Vision Sensitivities</h3>
                        
                        <div className="settings-group">
                          <label className="settings-label">
                            <span>Pixel Motion Sensitivity</span>
                            <span className="settings-value">{settingsForm.movementPixelThreshold} Lvl</span>
                          </label>
                          <input 
                            type="range" min="10" max="150" step="5"
                            value={settingsForm.movementPixelThreshold}
                            onChange={e => setSettingsForm({...settingsForm, movementPixelThreshold: parseInt(e.target.value)})}
                            className="settings-slider"
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Higher values require stronger pixel differences to count as movement (filters noise).</p>
                        </div>

                        <div className="settings-group">
                          <label className="settings-label">
                            <span>Minimum Motion Area</span>
                            <span className="settings-value">{settingsForm.minMotionArea} px</span>
                          </label>
                          <input 
                            type="range" min="20" max="400" step="10"
                            value={settingsForm.minMotionArea}
                            onChange={e => setSettingsForm({...settingsForm, minMotionArea: parseInt(e.target.value)})}
                            className="settings-slider"
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Minimum area block (in pixels) of localized movement to register chest displacement.</p>
                        </div>

                        <div className="settings-group">
                          <label className="settings-label">
                            <span>Significant Motion Reset</span>
                            <span className="settings-value">{settingsForm.significantMotionThreshold} px</span>
                          </label>
                          <input 
                            type="range" min="500" max="5000" step="100"
                            value={settingsForm.significantMotionThreshold}
                            onChange={e => setSettingsForm({...settingsForm, significantMotionThreshold: parseInt(e.target.value)})}
                            className="settings-slider"
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Movement pixel count threshold required to reset the clinical apnea timer.</p>
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '24px', color: 'var(--secondary)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px' }}>Apnea & Breathing Alarm timings</h3>

                        <div className="settings-group">
                          <label className="settings-label">
                            <span>Apnea Alert Trigger</span>
                            <span className="settings-value">{settingsForm.apneaAlertTime} seconds</span>
                          </label>
                          <input 
                            type="range" min="5" max="40" step="1"
                            value={settingsForm.apneaAlertTime}
                            onChange={e => setSettingsForm({...settingsForm, apneaAlertTime: parseInt(e.target.value)})}
                            className="settings-slider"
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Stillness duration required to trigger a CRITICAL APNEA alarm alert (Default 20s).</p>
                        </div>

                        <div className="settings-group">
                          <label className="settings-label">
                            <span>Stillness Warning Time</span>
                            <span className="settings-value">{settingsForm.stillnessWarningTime} seconds</span>
                          </label>
                          <input 
                            type="range" min="3" max="25" step="1"
                            value={settingsForm.stillnessWarningTime}
                            onChange={e => setSettingsForm({...settingsForm, stillnessWarningTime: parseInt(e.target.value)})}
                            className="settings-slider"
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Stillness duration before transitioning to STILL warning state (Default 12s).</p>
                        </div>

                        <div className="settings-group">
                          <label className="settings-label">
                            <span>Bradypnea Limit (Slow Breath)</span>
                            <span className="settings-value">{settingsForm.slowBreathingRate} BPM</span>
                          </label>
                          <input 
                            type="range" min="15" max="35" step="1"
                            value={settingsForm.slowBreathingRate}
                            onChange={e => setSettingsForm({...settingsForm, slowBreathingRate: parseInt(e.target.value)})}
                            className="settings-slider"
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Breathing rate threshold under which a slow breathing warning is flagged (Default 30 BPM).</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '40px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setSettingsForm({
                            movementPixelThreshold: 50,
                            minMotionArea: 100,
                            significantMotionThreshold: 2000,
                            apneaAlertTime: 20,
                            stillnessWarningTime: 12,
                            slowBreathingRate: 30
                          });
                        }} 
                        style={{ padding: '15px 30px', background: '#F1F5F9', border: 'none', borderRadius: '18px', fontWeight: 800, cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        Reset Defaults
                      </button>
                      <button 
                        type="submit" 
                        className="vibrant-btn" 
                        style={{ padding: '15px 40px' }}
                      >
                        Apply Framework Settings
                      </button>
                    </div>

                  </form>
                </div>

                {/* Real-time Threshold Preview Feedback Gauge */}
                <div className="premium-card glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '20px', color: 'var(--primary)' }}>Live Motion Threshold Preview</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                    Adjust parameters on the left and see how the live camera feed motion registers relative to your Significant Motion Reset threshold.
                  </p>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
                    
                    {/* Live Gauge */}
                    <div style={{ position: 'relative', marginTop: '20px' }}>
                      <div className="settings-label">
                        <span>Webcam Chest Movement Feed</span>
                        <span>{Math.round(mm.motion || 0)} px</span>
                      </div>
                      
                      <div className="live-gauge-track">
                        {/* Gauge filling */}
                        <div 
                          className={`live-gauge-bar ${mm.motion > settingsForm.significantMotionThreshold ? 'over-threshold' : ''}`}
                          style={{ width: `${Math.min(100, ((mm.motion || 0) / 4000) * 100)}%` }} 
                        />
                        {/* Threshold Marker */}
                        <div 
                          className="live-gauge-marker"
                          style={{ left: `${Math.min(100, (settingsForm.significantMotionThreshold / 4000) * 100)}%` }}
                        >
                          <div className="live-gauge-marker-label">THRESHOLD</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: mm.motion > settingsForm.significantMotionThreshold ? 'var(--mint)' : 'var(--secondary)', borderRadius: '50%' }} />
                        <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>
                          {mm.motion > settingsForm.significantMotionThreshold 
                            ? "TIMERS RESET: Movement Detected" 
                            : "STILLNESS ACCUMULATING: No significant motion"}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        When the motion bar (Webcam displacement) crosses to the right of the red THRESHOLD line, the apnea countdown timer resets back to 0.
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </>
          )}

        </main>

        {/* Sandbox Simulation Controller Floating Panel */}
        <div className="sim-controller-card" style={{ height: isSimPanelExpanded ? 'auto' : '52px' }}>
          <div 
            className="sim-controller-header" 
            onClick={() => setIsSimPanelExpanded(!isSimPanelExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={16} color="var(--secondary)" />
              <span style={{ fontSize: '12px', fontWeight: 900 }}>CLINICAL STATE SIMULATOR</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.7 }}>
              {isSimPanelExpanded ? "COLLAPSE" : "EXPAND"}
            </span>
          </div>

          {isSimPanelExpanded && (
            <div className="sim-controller-content">
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800 }}>
                SELECT SIM STATE FOR: {activeBabyObj.name?.toUpperCase()}
              </div>

              <button 
                className={`sim-btn normal ${activeBabyObj.simulationMode === 'normal' ? 'active' : ''}`}
                onClick={() => handleSimulateState(activeBabyObj.id, 'normal')}
              >
                <span>Force Normal Vitals</span>
                <Sliders size={14} />
              </button>

              <button 
                className={`sim-btn warning ${activeBabyObj.simulationMode === 'crying' ? 'active' : ''}`}
                onClick={() => handleSimulateState(activeBabyObj.id, 'crying')}
              >
                <span>Trigger Cry Distress</span>
                <Mic size={14} />
              </button>

              <button 
                className={`sim-btn danger ${activeBabyObj.simulationMode === 'apnea' ? 'active' : ''}`}
                onClick={() => handleSimulateState(activeBabyObj.id, 'apnea')}
              >
                <span>Trigger Apnea Crisis</span>
                <AlertCircle size={14} />
              </button>

              <button 
                className={`sim-btn off ${activeBabyObj.simulationMode === 'off' ? 'active' : ''}`}
                onClick={() => handleSimulateState(activeBabyObj.id, 'off')}
              >
                <span>Disable Overrides (Webcam Feed)</span>
                <Camera size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Apnea Alarm Overlay */}
        {isCritical && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255, 133, 161, 0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: '60px 80px', background: 'var(--secondary)', color: 'white', borderRadius: '40px', textAlign: 'center', boxShadow: '0 40px 100px rgba(255,133,161,0.5)', animation: 'fadeUp 0.4s ease-out' }}>
              <AlertCircle size={80} style={{ marginBottom: '20px' }} />
              <h1 style={{ fontSize: '48px', fontWeight: 1000 }}>CRITICAL WARD ALARM</h1>
              <p style={{ fontSize: '20px', fontWeight: 700, opacity: 0.9 }}>APNEA EMERGENCY DETECTED: STILLNESS ALARM</p>
              <div style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', fontSize: '15px', fontWeight: 800 }}>
                Patient: {activeBabyObj.name} ({activeBabyObj.id})
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                <button 
                  onClick={() => {
                    // Recover baby by turning off simulation override or sending select_baby
                    handleSimulateState(activeBabyObj.id, 'normal');
                  }} 
                  style={{ padding: '12px 30px', background: 'white', color: 'var(--secondary)', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}
                >
                  Force Recovery (Normal Vitals)
                </button>
                <button 
                  onClick={() => {
                    // Stop simulation override entirely
                    handleSimulateState(activeBabyObj.id, 'off');
                  }} 
                  style={{ padding: '12px 30px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}
                >
                  Clear Override
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (renderError: any) {
    console.error("Dashboard Render Failed:", renderError);
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF1F2' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1 style={{ color: '#E11D48', fontWeight: 900 }}>DASHBOARD RENDER CRASH</h1>
          <pre style={{ background: 'white', padding: '20px', borderRadius: '15px', marginTop: '20px', color: '#64748B', overflow: 'auto' }}>{renderError.message}</pre>
          <button onClick={() => window.location.reload()} className="vibrant-btn" style={{ marginTop: '20px', padding: '15px 30px' }}>RECOVERY REBOOT</button>
        </div>
      </div>
    );
  }
}

// Stats Card Component
function StatCard({ label, value, unit, color, icon, isFlashing }: any) {
  return (
    <div className={`premium-card glass-panel ${isFlashing ? 'alert-border-flash' : ''}`} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color }}>{value} <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.5 }}>{unit}</span></div>
      </div>
    </div>
  );
}

// Waveform Chart Component (Updated to support multiple lines and gradient IDs)
function LiveWaveform({ data, line1, line2, stroke1, stroke2, gradientId }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke1} stopOpacity={0.3} />
            <stop offset="95%" stopColor={stroke1} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(5px)' }} />
        <Area type="monotone" dataKey={line1} stroke={stroke1} fill={`url(#${gradientId})`} strokeWidth={3} isAnimationActive={false} />
        {line2 && <Area type="monotone" dataKey={line2} stroke={stroke2} fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" isAnimationActive={false} />}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Camera Feed Component
function CameraPreview({ isAlert, isEnabled }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isEnabled) {
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    let stream: MediaStream | null = null;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) { }
    }
    start();

    const loop = setInterval(() => {
      if (videoRef.current && canvasRef.current && stream && isEnabled) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 640, 480);
          canvasRef.current.toBlob(blob => {
            if (blob) {
              const form = new FormData();
              form.append('file', blob, 'f.jpg');
              fetch(`${API_BASE_URL}/api/process_frame`, { method: 'POST', body: form }).catch(() => { });
            }
          }, 'image/jpeg', 0.5);
        }
      }
    }, 500);

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      clearInterval(loop);
    };
  }, [isEnabled]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
      {!isEnabled && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10, background: 'rgba(0,0,0,0.8)' }}>
          <Camera size={48} opacity={0.3} style={{ marginBottom: '15px' }} />
          <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', opacity: 0.5 }}>VISION SYSTEM OFFLINE</div>
        </div>
      )}
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isEnabled ? 0.9 : 0.2 }} />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      {isEnabled && <div className="scanner" />}
      <div style={{ position: 'absolute', inset: 0, boxShadow: isAlert && isEnabled ? 'inset 0 0 50px rgba(255,133,161,0.5)' : 'none', border: isAlert && isEnabled ? '4px solid var(--secondary)' : 'none', transition: 'all 0.3s' }} />
    </div>
  );
}

// Auth Flow Component (Passcode Keypad Redesign)
function AuthFlow({ onLogin }: any) {
  const [pin, setPin] = useState<string>('');
  const [fallbackId, setFallbackId] = useState<string>('');
  const [showFallback, setShowFallback] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    setAuthError(null);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto submit on 4 digits
      if (newPin === '1234') {
        setTimeout(() => onLogin(), 300);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          setAuthError("Invalid Passcode. Hint: Use 1234");
          setPin('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackId === 'admin') {
      onLogin();
    } else {
      setAuthError("Invalid Secure ID");
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="premium-card glass-panel" style={{ width: '450px', padding: '50px 40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.6)' }}>
        <div style={{ fontSize: '50px', marginBottom: '20px', filter: 'drop-shadow(0 10px 15px rgba(93,183,255,0.25))' }}>👶</div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px', tracking: '-0.5px' }}>NEO-CARE</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Clinical Telemetry Terminal
        </p>

        {showFallback ? (
          <form onSubmit={handleTextSubmit}>
            <input 
              type="text" 
              placeholder="SECURE ID" 
              value={fallbackId} 
              onChange={e => setFallbackId(e.target.value)} 
              className="vibrant-input" 
              style={{ width: '100%', marginBottom: '20px', textAlign: 'center', fontWeight: 800 }} 
            />
            <button type="submit" className="vibrant-btn" style={{ width: '100%', height: '60px', fontSize: '16px' }}>
              INITIALIZE LINK
            </button>
            <button 
              type="button" 
              onClick={() => setShowFallback(false)} 
              style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
            >
              Use Numeric Keypad
            </button>
          </form>
        ) : (
          <div>
            {/* Dots */}
            <div className="passcode-dots-container">
              {[0, 1, 2, 3].map((idx) => (
                <div 
                  key={idx} 
                  className={`passcode-dot ${pin.length > idx ? 'filled' : ''}`} 
                />
              ))}
            </div>

            {/* Grid */}
            <div className="pin-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button key={num} className="pin-btn" onClick={() => handleKeyPress(num)}>
                  {num}
                </button>
              ))}
              <button className="pin-btn" style={{ border: 'none', background: 'none', fontSize: '12px' }} onClick={() => setShowFallback(true)}>
                <Key size={18} />
              </button>
              <button className="pin-btn" onClick={() => handleKeyPress('0')}>
                0
              </button>
              <button className="pin-btn" style={{ border: 'none', background: 'none', fontSize: '12px' }} onClick={handleBackspace}>
                <Delete size={20} />
              </button>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800 }}>
              <HelpCircle size={14} />
              <span>PASSCODE: 1234 OR CLICK THE KEY FOR ID</span>
            </div>
          </div>
        )}

        {authError && (
          <div style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(255,133,161,0.1)', color: 'var(--secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
            {authError}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;