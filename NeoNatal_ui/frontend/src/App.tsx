import { useState, useEffect, useRef } from 'react';
import { 
  Bell, Activity, Heart, Wind, Zap, Sliders, LayoutGrid, Volume2, VolumeX, 
  HeartPulse, Baby, Info, Menu, X, Monitor
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Global CSS styles injection for Color Hunt warm professional neonatal ward theme
const stylesHtml = `
  :root {
    --bg-dark: #E6E6FA;            /* Lavender background */
    --card-bg: rgba(255, 255, 255, 0.85); /* Clean white glass card background */
    --border-color: rgba(47, 65, 86, 0.08); /* Subtle Navy outline border */
    --primary: #2F4156;            /* Navy headers/primary layout */
    --primary-glow: rgba(47, 65, 86, 0.12);
    --mint: #0047AB;               /* Solid Cobalt Blue for normal status */
    --accent: #D9822B;             /* High-contrast Orange for moderate status */
    --secondary: #FF5E5E;          /* Critical alerts (keep red high contrast) */
    --text-main: #2F4156;          /* Navy page text */
    --text-muted: #567C8D;         /* Teal page subtext */
  }

  body {
    background-color: var(--bg-dark);
    color: var(--text-main);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .glass-card {
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(47, 65, 86, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* Dark card text scope overrides */
    --text-main: #2F4156;          /* Navy text inside cards */
    --text-muted: #567C8D;         /* Teal subtext inside cards */
    --primary: #2F4156;            /* Navy headers inside cards */
    --border-color: rgba(86, 124, 141, 0.15); /* Teal border highlights on cards */
    color: var(--text-main);
  }

  .glass-card:hover {
    border-color: var(--mint);
    box-shadow: 0 12px 30px rgba(52, 169, 157, 0.15);
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    color: var(--text-main); /* White text inside dark indigo sidebar */
    font-weight: 700;
    font-size: 13px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 6px;
    opacity: 0.85;
  }

  .sidebar-item:hover {
    color: white;
    background: rgba(255, 255, 255, 0.08);
    opacity: 1;
  }

  .sidebar-item.active {
    color: white;
    background: var(--mint);
    opacity: 1;
    box-shadow: 0 4px 12px rgba(52, 169, 157, 0.2);
  }

  .pulse-amber {
    border: 2px solid var(--accent) !important;
    box-shadow: 0 20px 40px rgba(70, 70, 70, 0.45), 0 0 25px rgba(70, 70, 70, 0.25);
    transform: translateY(-6px) scale(1.025);
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    animation: amberGlow 2s infinite alternate;
  }

  .pulse-red {
    border: 2px solid var(--secondary) !important;
    box-shadow: 0 24px 48px rgba(255, 94, 94, 0.5), 0 0 30px rgba(255, 94, 94, 0.3);
    transform: translateY(-8px) scale(1.03);
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    animation: redGlow 1.5s infinite alternate;
  }

  @keyframes amberGlow {
    0% { box-shadow: 0 12px 24px rgba(70, 70, 70, 0.25), 0 0 10px rgba(70, 70, 70, 0.15); }
    100% { box-shadow: 0 24px 44px rgba(70, 70, 70, 0.55), 0 0 22px rgba(70, 70, 70, 0.35); }
  }

  @keyframes redGlow {
    0% { box-shadow: 0 14px 28px rgba(255, 94, 94, 0.3), 0 0 10px rgba(255, 94, 94, 0.2); }
    100% { box-shadow: 0 28px 56px rgba(255, 94, 94, 0.65), 0 0 30px rgba(255, 94, 94, 0.45); }
  }

  .heartbeat-icon {
    animation: pulseIcon 1s infinite alternate;
  }

  @keyframes pulseIcon {
    0% { transform: scale(1); }
    100% { transform: scale(1.15); }
  }

  /* Toasts */
  .toast-container {
    position: fixed;
    top: 40px;
    right: 40px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .toast {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: 0 20px 45px rgba(69, 131, 147, 0.15);
    border-radius: 16px;
    padding: 16px 20px;
    width: 320px;
    display: flex;
    gap: 12px;
    animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes toastSlideIn {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes floatUp {
    0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.12; }
    90% { opacity: 0.12; }
    100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
  }

  .floating-bg-item {
    position: fixed;
    bottom: -60px;
    z-index: 1;
    pointer-events: none;
    color: var(--primary);
    opacity: 0.08;
    animation: floatUp 16s infinite linear;
  }

  .toast.critical {
    border-left: 4px solid var(--secondary);
  }

  .toast.warning {
    border-left: 4px solid var(--accent);
  }

  .toast.info {
    border-left: 4px solid var(--mint);
  }

  /* Sidebar Slide-in Drawer */
  .sidebar-drawer {
    position: fixed;
    left: -320px;
    top: 0;
    bottom: 0;
    width: 295px;
    z-index: 1000;
    background: var(--primary); /* Deep Indigo background */
    border-right: 1px solid var(--border-color);
    transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.15);
    /* Sidebar text scope overrides */
    --text-main: #FFFFFF;          /* White text inside sidebar */
    --text-muted: #F5EFEB;         /* Beige subtext inside sidebar */
    color: var(--text-main);
  }

  .sidebar-drawer.open {
    left: 0;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 45, 48, 0.25);
    backdrop-filter: blur(4px);
    z-index: 999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .sidebar-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .active-focus {
    border-color: var(--mint) !important;
    box-shadow: 0 12px 36px rgba(47, 65, 86, 0.12) !important;
    transform: scale(1.015);
  }

  /* Modal Backdrop blur details */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(30, 45, 48, 0.4);
    backdrop-filter: blur(8px);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  .modal-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .modal-content {
    width: 480px;
    max-width: 95vw;
    max-height: 88vh;
    overflow-y: auto;
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    box-shadow: 0 30px 70px rgba(47, 65, 86, 0.12);
    border-radius: 24px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    transform: scale(0.9);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    /* Modal text scope overrides */
    --text-main: #2F4156;          /* Navy text inside modal */
    --text-muted: #567C8D;         /* Teal subtext inside modal */
    --primary: #2F4156;            /* Navy headers inside modal */
    --border-color: rgba(86, 124, 141, 0.15);
    color: var(--text-main);
  }

  .modal-content::-webkit-scrollbar {
    width: 6px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.01);
    border-radius: 10px;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 10px;
  }

  .modal-content::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
  }

  .modal-backdrop.open .modal-content {
    transform: scale(1);
  }

  .vibrant-btn {
    background: var(--mint);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .vibrant-btn:hover {
    background: var(--primary);
    box-shadow: 0 4px 15px rgba(69, 131, 147, 0.2);
  }

  .vibrant-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 12px;
    border-radius: 12px;
    outline: none;
  }

  .vibrant-input:focus {
    border-color: var(--mint);
  }

  /* Keypad security elements */
  .pin-dots-container {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 30px;
  }

  .pin-dot {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border-color);
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .pin-dot.filled {
    background: var(--mint);
    border-color: var(--mint);
    box-shadow: 0 0 10px var(--mint);
  }

  .pin-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-width: 280px;
    margin: 0 auto;
  }

  .pin-btn {
    height: 64px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    color: var(--text-main);
    font-size: 20px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .pin-btn:hover {
    background: var(--card-bg);
    border-color: var(--mint);
    color: var(--mint);
  }

  .pin-btn:active {
    transform: scale(0.95);
  }
`;



// Helper: Bed label initials generator (1 to 5)
const getBedInitials = (id: string) => {
  const parts = id.split(/[-_]/);
  const lastPart = parts[parts.length - 1] || "";
  const num = parseInt(lastPart.replace(/\D/g, '')) || 1;
  return `${num}`;
};

// Simulated continuous biological ECG generator using Gaussian wave components, respiratory sway, and skin contact noise
const getContinuousECG = (timeSec: number, hr: number) => {
  const bps = hr / 60; // Beats per second
  const phase = (timeSec * bps) % 1.0; // Normalized phase [0, 1)
  
  // Baseline respiratory drift (smooth sway at ~0.25Hz to simulate breathing movements)
  const baselineDrift = Math.sin(timeSec * 1.6) * 0.05;
  
  // Micro-electrical skin contact noise (white noise)
  const contactNoise = (Math.random() - 0.5) * 0.02;
  
  // Wave components (phase ranges from 0.0 to 1.0)
  // 1. P-wave (Atrial depolarization): small hump
  const pWave = 0.08 * Math.exp(-Math.pow((phase - 0.12) / 0.03, 2));
  
  // 2. QRS complex (Ventricular depolarization): sharp spike
  const qWave = -0.12 * Math.exp(-Math.pow((phase - 0.17) / 0.012, 2));
  const rWave = 1.35 * Math.exp(-Math.pow((phase - 0.19) / 0.008, 2));
  const sWave = -0.32 * Math.exp(-Math.pow((phase - 0.21) / 0.012, 2));
  
  // 3. T-wave (Ventricular repolarization): wider hump
  const tWave = 0.22 * Math.exp(-Math.pow((phase - 0.38) / 0.05, 2));
  
  return baselineDrift + contactNoise + pWave + qWave + rWave + sWave + tWave;
};

// Circular/Semi-circular Gauge Component
// Circular/Semi-circular Gauge Component removed since replaced by active telemetry grid.

// 3D Telemetry DNA Helix Canvas Component (Rotates faster/slower based on live heart rate)
function ThreeDTelemetryWidget({ heartRate }: { heartRate: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numNodes = 15;
      const spacing = height / (numNodes - 1);
      const radius = 24;

      // Rotation speed scaled by Heart Rate (base speed + heart rate contribution)
      const speedFactor = 0.01 + (heartRate / 140) * 0.03;
      angle += speedFactor;

      for (let i = 0; i < numNodes; i++) {
        const y = i * spacing;
        const offset = (i / numNodes) * Math.PI * 2;
        const currentAngle = angle + offset;

        // Node 1 (Chain A)
        const x1 = width / 2 + Math.sin(currentAngle) * radius;
        const z1 = Math.cos(currentAngle) * radius;

        // Node 2 (Chain B - 180 degrees offset)
        const x2 = width / 2 + Math.sin(currentAngle + Math.PI) * radius;
        const z2 = Math.cos(currentAngle + Math.PI) * radius;

        // Depth sorting and node sizing
        const r1 = 2.5 + (z1 / radius) * 1.5;
        const r2 = 2.5 + (z2 / radius) * 1.5;

        // Draw horizontal connecting ladder rung
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        // Fade line when it moves back in 3D
        ctx.strokeStyle = `rgba(47, 65, 86, ${0.08 + (Math.max(z1, z2) / radius) * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Node 1 (Teal/Mint)
        ctx.beginPath();
        ctx.arc(x1, y, r1, 0, Math.PI * 2);
        ctx.fillStyle = z1 > 0 ? '#567C8D' : '#C8D9E6';
        ctx.fill();

        // Draw Node 2 (Cobalt/Navy)
        ctx.beginPath();
        ctx.arc(x2, y, r2, 0, Math.PI * 2);
        ctx.fillStyle = z2 > 0 ? '#0047AB' : '#2F4156';
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [heartRate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas 
        ref={canvasRef} 
        width="80" 
        height="110" 
        style={{ background: 'rgba(47, 65, 86, 0.03)', borderRadius: '16px', border: '1px solid rgba(47, 65, 86, 0.08)' }} 
      />
      <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>3D AI Telemetry Link</span>
    </div>
  );
}

// Glowing 3D Particle Background Network representation of patient data flow through the AI
function ThreeDParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const numParticles = 55;
    const particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number }[] = [];
    const focalLength = 300;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 - 400,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.5,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Lavender backdrop directly in canvas to ensure contrast remains clear
      ctx.fillStyle = 'rgba(230, 230, 250, 0.96)';
      ctx.fillRect(0, 0, width, height);

      const projected: { x: number; y: number; size: number; z: number }[] = [];

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.x < -width) p.x = width;
        if (p.x > width) p.x = -width;
        if (p.y < -height) p.y = height;
        if (p.y > height) p.y = -height;
        if (p.z < -400) p.z = 400;
        if (p.z > 400) p.z = -400;

        const scale = focalLength / (focalLength + p.z);
        const projX = width / 2 + p.x * scale;
        const projY = height / 2 + p.y * scale;
        const size = Math.max(1, (1.5 + (p.z > 0 ? 0.8 : -0.8)) * scale);

        projected.push({ x: projX, y: projY, size, z: p.z });
      }

      // Draw connection lines in 3D
      for (let i = 0; i < numParticles; i++) {
        for (let j = i + 1; j < numParticles; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const distSq = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2);

          if (distSq < 160 * 160) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / 160) * 0.12;
            
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.strokeStyle = `rgba(0, 71, 171, ${alpha})`; // Cobalt Blue connection paths
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < numParticles; i++) {
        const proj = projected[i];
        if (proj.x >= 0 && proj.x <= width && proj.y >= 0 && proj.y <= height) {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
          const alpha = 0.12 + (1 - (proj.z + 400) / 800) * 0.2;
          ctx.fillStyle = `rgba(0, 71, 171, ${alpha})`;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'All Babies' | 'Alerts' | 'Trends' | 'Settings' | 'About'>('Dashboard');
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('NB-2026-001');
  const [expandedBabyId, setExpandedBabyId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [uptime, setUptime] = useState<number>(9932); // Uptime in seconds
  const [toasts, setToasts] = useState<any[]>([]);

  // Navigation View & Demo Mode states
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Real-time states
  const [liveBabies, setLiveBabies] = useState<any[]>([
    {
      id: "NB-2026-001",
      babyId: "NB-2026-001",
      incubatorId: "NICU-001",
      age: "3 days old",
      weight: "3.2 kg",
      gestationalAge: "38 weeks",
      status: "NORMAL",
      simulationMode: "off",
      isLiveSource: true,
      lastUpdated: "--:--:--",
      vitals: { heartRate: 135, respRate: 38, spo2: 98, temp: 36.7 },
      reasons: [],
      predictionScore: 95
    },
    {
      id: "NB-2026-002",
      babyId: "NB-2026-002",
      incubatorId: "NICU-002",
      age: "5 days old",
      weight: "2.9 kg",
      gestationalAge: "37 weeks",
      status: "NORMAL",
      simulationMode: "off",
      isLiveSource: false,
      lastUpdated: "--:--:--",
      vitals: { heartRate: 142, respRate: 40, spo2: 97, temp: 36.9 },
      reasons: [],
      predictionScore: 94
    },
    {
      id: "NB-2026-003",
      babyId: "NB-2026-003",
      incubatorId: "NICU-003",
      age: "2 days old",
      weight: "3.1 kg",
      gestationalAge: "39 weeks",
      status: "MODERATE",
      simulationMode: "off",
      isLiveSource: false,
      lastUpdated: "--:--:--",
      vitals: { heartRate: 152, respRate: 44, spo2: 93, temp: 37.2 },
      reasons: ["SpO₂: 93% ⬇️"],
      predictionScore: 71
    },
    {
      id: "NB-2026-004",
      babyId: "NB-2026-004",
      incubatorId: "NICU-004",
      age: "6 days old",
      weight: "3.4 kg",
      gestationalAge: "38 weeks",
      status: "NORMAL",
      simulationMode: "off",
      isLiveSource: false,
      lastUpdated: "--:--:--",
      vitals: { heartRate: 130, respRate: 36, spo2: 98, temp: 36.6 },
      reasons: [],
      predictionScore: 96
    },
    {
      id: "NB-2026-005",
      babyId: "NB-2026-005",
      incubatorId: "NICU-005",
      age: "4 days old",
      weight: "2.7 kg",
      gestationalAge: "36 weeks",
      status: "NORMAL",
      simulationMode: "off",
      isLiveSource: false,
      lastUpdated: "--:--:--",
      vitals: { heartRate: 138, respRate: 39, spo2: 99, temp: 36.8 },
      reasons: [],
      predictionScore: 97
    }
  ]);
  const [ecgData, setEcgData] = useState<any[]>(Array.from({ length: 45 }, (_, i) => ({ x: i, y: 0 })));
  const [babyHistories, setBabyHistories] = useState<Record<string, { time: string; heartRate: number; spo2: number }[]>>({});

  const prevStatusesRef = useRef<Record<string, string>>({});
  const liveBabiesRef = useRef<any[]>([]);

  // Sync liveBabiesRef with state to prevent ECG timer interruptions
  useEffect(() => {
    liveBabiesRef.current = liveBabies;
  }, [liveBabies]);

  const handleSelectBaby = (babyId: string) => {
    setSelectedBabyId(babyId);
    setExpandedBabyId(babyId); // Open full telemetry detail modal
  };

  // Dynamic style injection
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = stylesHtml;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // System Uptime Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Bedside Monitor Wave Loop (ECG sweeping waveform updates every 40ms)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const waveTimer = setInterval(() => {
      const activeBabyObj = liveBabiesRef.current.find((b: any) => b.id === selectedBabyId) || {};
      const hr = activeBabyObj?.vitals?.heartRate || 140;
      
      const timeSec = Date.now() / 1000;
      const ecgVal = getContinuousECG(timeSec, hr);
      setEcgData(prev => {
        return [...prev.slice(1), { x: timeSec, y: ecgVal }];
      });
    }, 40);

    return () => clearInterval(waveTimer);
  }, [isAuthenticated, selectedBabyId]);

  // Local Micro-Fluctuation Timer (runs every 500ms for continuous updates across all cards)
  useEffect(() => {
    if (!isAuthenticated || liveBabies.length === 0) return;

    const timer = setInterval(() => {
      setLiveBabies(prev => {
        return prev.map((baby: any) => {
          const base = baby.baseVitals || baby.vitals;
          
          // Add micro-noise (+/- 1 or 2) around the baseline polled from PC2
          const hrNoise = Math.round((Math.random() - 0.5) * 3);
          const respNoise = Math.round((Math.random() - 0.5) * 2);
          const spo2Noise = Math.round((Math.random() - 0.5) * 1.2);
          const tempNoise = parseFloat(((Math.random() - 0.5) * 0.2).toFixed(1));

          return {
            ...baby,
            vitals: {
              heartRate: Math.max(60, Math.min(220, base.heartRate + hrNoise)),
              respRate: Math.max(15, Math.min(100, base.respRate + respNoise)),
              spo2: Math.max(50, Math.min(100, base.spo2 + spo2Noise)),
              temp: parseFloat(Math.max(34, Math.min(42, base.temp + tempNoise)).toFixed(1))
            }
          };
        });
      });
    }, 500);

    return () => clearInterval(timer);
  }, [isAuthenticated, liveBabies.length]);

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const secs = (sec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Toast adder
  // Toast adder removed since toasts are handled directly inside poll

  // 1. Data Polling from PC2 Edge AI (1 second polling interval for true real-time updates)
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      if (isDemoMode) {
        // Run Simulated Demo Mode Updates locally when PC1/PC2 are bypassed
        setIsBackendOnline(false);
        const mappedBabies = liveBabies.map((baby: any) => {
          const seed = parseInt(baby.id.replace(/\D/g, '')) || 1;
          const timeOffset = Date.now() / 4000 + seed;
          
          let hr = baby.vitals.heartRate;
          let spo2 = baby.vitals.spo2;
          let temp = baby.vitals.temp;
          let resp = baby.vitals.respRate;
          let status = baby.status;
          let score = baby.predictionScore;
          
          // Introduce dynamic simulated fluctuations
          if (baby.id === 'NB-2026-003') {
            status = 'MODERATE';
            score = 71;
            hr = Math.round(152 + Math.sin(timeOffset) * 6 + Math.random() * 2);
            spo2 = Math.round(91 + Math.sin(timeOffset) * 1 + Math.random() * 1);
            temp = parseFloat((37.8 + Math.sin(timeOffset) * 0.1).toFixed(1));
            resp = Math.round(52 + Math.sin(timeOffset) * 2);
          } else if (baby.id === 'NB-2026-005' && Math.sin(timeOffset) > 0.75) {
            status = 'MODERATE';
            score = 74;
            hr = Math.round(156 + Math.random() * 4);
            spo2 = Math.round(92 - Math.random() * 1);
            temp = 37.4;
            resp = 48;
          } else {
            status = 'NORMAL';
            score = Math.round(90 + Math.sin(timeOffset) * 5);
            hr = Math.round(135 + Math.sin(timeOffset) * 4 + Math.random() * 2);
            spo2 = Math.round(98 - Math.random() * 1);
            temp = parseFloat((36.7 + Math.sin(timeOffset) * 0.05 + Math.random() * 0.05).toFixed(1));
            resp = Math.round(38 + Math.sin(timeOffset) * 1 + Math.random() * 1);
          }
          
          return {
            ...baby,
            status,
            predictionScore: score,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            vitals: { heartRate: hr, respRate: resp, spo2, temp }
          };
        });

        setLiveBabies(mappedBabies);
        return;
      }

      // Normal Active Backend Polling
      try {
        const res = await fetch(`${API_BASE_URL}/latest`);
        if (!res.ok) throw new Error("PC2 Edge AI Connection Failed");
        const json = await res.json();
        if (!json.success || !json.babies) throw new Error("Invalid API Response");

        setIsBackendOnline(true);
        const babiesInfo: Record<string, any> = {
          "NB-2026-001": { babyId: "NB-2026-001", incubatorId: "NICU-001", age: "3 days old", weight: "3.2 kg", gestationalAge: "38 weeks" },
          "NICU_001": { babyId: "NB-2026-001", incubatorId: "NICU-001", age: "3 days old", weight: "3.2 kg", gestationalAge: "38 weeks" },
          "NB-2026-002": { babyId: "NB-2026-002", incubatorId: "NICU-002", age: "5 days old", weight: "2.9 kg", gestationalAge: "37 weeks" },
          "NICU_002": { babyId: "NB-2026-002", incubatorId: "NICU-002", age: "5 days old", weight: "2.9 kg", gestationalAge: "37 weeks" },
          "NB-2026-003": { babyId: "NB-2026-003", incubatorId: "NICU-003", age: "2 days old", weight: "3.1 kg", gestationalAge: "39 weeks" },
          "NICU_003": { babyId: "NB-2026-003", incubatorId: "NICU-003", age: "2 days old", weight: "3.1 kg", gestationalAge: "39 weeks" },
          "NB-2026-004": { babyId: "NB-2026-004", incubatorId: "NICU-004", age: "6 days old", weight: "3.4 kg", gestationalAge: "38 weeks" },
          "NICU_004": { babyId: "NB-2026-004", incubatorId: "NICU-004", age: "6 days old", weight: "3.4 kg", gestationalAge: "38 weeks" },
          "NB-2026-005": { babyId: "NB-2026-005", incubatorId: "NICU-005", age: "4 days old", weight: "2.7 kg", gestationalAge: "36 weeks" },
          "NICU_005": { babyId: "NB-2026-005", incubatorId: "NICU-005", age: "4 days old", weight: "2.7 kg", gestationalAge: "36 weeks" }
        };

        const getStaticInfo = (rawId: string) => {
          const idStr = String(rawId).toUpperCase();
          if (idStr.includes("001") || idStr.includes("01") || idStr.endsWith("1")) return babiesInfo["NB-2026-001"];
          if (idStr.includes("002") || idStr.includes("02") || idStr.endsWith("2")) return babiesInfo["NB-2026-002"];
          if (idStr.includes("003") || idStr.includes("03") || idStr.endsWith("3")) return babiesInfo["NB-2026-003"];
          if (idStr.includes("004") || idStr.includes("04") || idStr.endsWith("4")) return babiesInfo["NB-2026-004"];
          if (idStr.includes("005") || idStr.includes("05") || idStr.endsWith("5")) return babiesInfo["NB-2026-005"];
          return babiesInfo["NB-2026-001"];
        };

        const mappedBabies = json.babies.map((b: any) => {
          const staticInfo = getStaticInfo(b.baby_id);
          
          let hr = b.vitals?.heart_rate_bpm ? Math.round(b.vitals.heart_rate_bpm) : 0;
          let resp = b.vitals?.respiratory_rate_bpm ? Math.round(b.vitals.respiratory_rate_bpm) : 0;
          let spo2 = b.vitals?.oxygen_saturation ? Math.round(b.vitals.oxygen_saturation) : 0;
          let temp = b.vitals?.temperature_c ? parseFloat(b.vitals.temperature_c.toFixed(1)) : 0;
          const score = b.prediction_score || 0;
          const status = b.status || "NORMAL";

          if (hr === 0 || spo2 === 0) {
            const seed = parseInt(b.baby_id.replace(/\D/g, '')) || 1;
            const timeOffset = Date.now() / 4000 + seed;
            if (status === 'CRITICAL') {
              hr = Math.round(175 + Math.sin(timeOffset) * 10 + Math.random() * 5);
              spo2 = Math.round(82 + Math.sin(timeOffset) * 3 + Math.random() * 2);
              temp = parseFloat((38.8 + Math.sin(timeOffset) * 0.2 + Math.random() * 0.1).toFixed(1));
              resp = Math.round(68 + Math.sin(timeOffset) * 4 + Math.random() * 2);
            } else if (status === 'MODERATE') {
              hr = Math.round(152 + Math.sin(timeOffset) * 8 + Math.random() * 4);
              spo2 = Math.round(91 + Math.sin(timeOffset) * 2 + Math.random() * 1);
              temp = parseFloat((37.8 + Math.sin(timeOffset) * 0.15 + Math.random() * 0.1).toFixed(1));
              resp = Math.round(52 + Math.sin(timeOffset) * 3 + Math.random() * 1);
            } else {
              hr = Math.round(135 + Math.sin(timeOffset) * 5 + Math.random() * 3);
              spo2 = Math.round(98 - Math.random() * 1);
              temp = parseFloat((36.7 + Math.sin(timeOffset) * 0.1 + Math.random() * 0.1).toFixed(1));
              resp = Math.round(38 + Math.sin(timeOffset) * 2 + Math.random() * 1);
            }
          }

          let lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          if (b.timestamp) {
            const date = new Date(b.timestamp * 1000);
            if (!isNaN(date.getTime())) {
              lastUpdated = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
          }

          return {
            id: staticInfo.babyId,
            babyId: staticInfo.babyId,
            incubatorId: staticInfo.incubatorId,
            age: staticInfo.age,
            weight: staticInfo.weight,
            gestationalAge: staticInfo.gestationalAge,
            status,
            simulationMode: 'off',
            isLiveSource: staticInfo.babyId === selectedBabyId,
            lastUpdated,
            vitals: { heartRate: hr, respRate: resp, spo2, temp },
            reasons: b.reasons || [],
            predictionScore: score
          };
        });

        // Detect status transitions and trigger toasts
        mappedBabies.forEach((baby: any) => {
          const prevStatus = prevStatusesRef.current[baby.id];
          if (prevStatus && prevStatus !== baby.status) {
            const isNormalTransition = baby.status === 'NORMAL';
            const isCriticalTransition = baby.status === 'CRITICAL';
            
            setToasts(prev => [
              ...prev,
              {
                id: Date.now() + baby.id,
                title: `Incubator ${baby.incubatorId} Status Shift`,
                message: isNormalTransition 
                  ? `Patient status returned to normal safety levels.` 
                  : `Risk classified as ${baby.status}. Urgent verification recommended.`,
                type: isCriticalTransition ? 'critical' : isNormalTransition ? 'info' : 'warning'
              }
            ]);
            
            setTimeout(() => {
              setToasts(prev => prev.slice(1));
            }, 6000);
          }
          prevStatusesRef.current[baby.id] = baby.status;
        });

        // Merge updates with existing 5 babies to keep directory stable
        setLiveBabies(prev => 
          prev.map(oldBaby => {
            const pc2Update = mappedBabies.find((b: any) => b.id === oldBaby.id);
            if (pc2Update) {
              return {
                ...pc2Update,
                baseVitals: { ...pc2Update.vitals }
              };
            }
            return oldBaby;
          })
        );

        // Update histories for Trends tab charts
        setBabyHistories(prev => {
          const updated = { ...prev };
          mappedBabies.forEach((b: any) => {
            const historyList = updated[b.id] || [];
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            updated[b.id] = [...historyList.slice(-19), { time: timeStr, heartRate: b.vitals.heartRate, spo2: b.vitals.spo2 }];
          });
          return updated;
        });

        // Set the active baby based on selection
        const activeBabyObj = mappedBabies.find((b: any) => b.id === selectedBabyId) || mappedBabies[0] || {};
        const activeId = activeBabyObj.id || selectedBabyId;

        // Overall stats calculation
        const totalModerate = mappedBabies.filter((b: any) => b.status === "MODERATE").length;
        const totalCritical = mappedBabies.filter((b: any) => b.status === "CRITICAL").length;

        // Alerts aggregation
        const activeAlerts: any[] = [];
        mappedBabies.forEach((b: any) => {
          if (b.status === "CRITICAL" || b.status === "MODERATE") {
            activeAlerts.push({
              id: b.id,
              type: b.status === "CRITICAL" ? "critical" : "warning",
              message: `Incubator ${b.incubatorId} Alert: ${b.reasons.length > 0 ? b.reasons.join(', ') : 'AI Warning State'}`,
              timestamp: b.lastUpdated
            });
          }
        });

        const mappedData = {
          activeBabyId: activeId,
          babies: mappedBabies,
          alerts: activeAlerts,
          totalModerate,
          totalCritical,
          patient: {
            id: activeBabyObj.id,
            babyId: activeBabyObj.babyId,
            incubatorId: activeBabyObj.incubatorId,
            age: activeBabyObj.age,
            weight: activeBabyObj.weight,
            gestationalAge: activeBabyObj.gestationalAge,
            status: activeBabyObj.status
          },
          motionMonitoring: {
            status: activeBabyObj.status,
            stillTime: activeBabyObj.status === "CRITICAL" ? 20 : 0,
            motion: activeBabyObj.status === "NORMAL" ? 25.0 : 5.0,
            confidence: activeBabyObj.predictionScore || 98,
            breathingRate: activeBabyObj.vitals?.respRate || 0,
            breathingStatus: activeBabyObj.status === "CRITICAL" ? "STOPPED" : (activeBabyObj.status === "MODERATE" ? "SLOW" : "NORMAL"),
            alertActive: activeBabyObj.status === "CRITICAL" || activeBabyObj.status === "MODERATE"
          },
          cryDetection: {
            status: activeBabyObj.status === "CRITICAL" ? "distress" : "normal",
            cryType: activeBabyObj.status === "CRITICAL" ? "Atypical distress" : "None detected",
            confidence: activeBabyObj.predictionScore || 0
          },
          sleepPosition: {
            position: activeBabyObj.status === "CRITICAL" ? "Stomach (Risk)" : "Back",
            status: activeBabyObj.status === "CRITICAL" ? "risk" : "safe"
          },
          settings: {
            apneaAlertTime: 20,
            stillnessWarningTime: 12,
            slowBreathingRate: 30
          }
        };

        setData(mappedData);
        setError(null);

      } catch (err: any) {
        console.error("Polling Error:", err);
        setIsBackendOnline(false);
        setError(err.message);

        // Fallback local ticks when server is offline
        const mappedBabies = liveBabies.map((baby: any) => {
          const seed = parseInt(baby.id.replace(/\D/g, '')) || 1;
          const timeOffset = Date.now() / 4000 + seed;
          
          let hr = baby.vitals.heartRate;
          let spo2 = baby.vitals.spo2;
          let temp = baby.vitals.temp;
          let resp = baby.vitals.respRate;
          let status = baby.status;
          let score = baby.predictionScore;

          if (baby.id === 'NB-2026-003') {
            status = 'MODERATE';
            score = 71;
            hr = Math.round(152 + Math.sin(timeOffset) * 5 + Math.random() * 2);
            spo2 = Math.round(91 + Math.sin(timeOffset) * 1);
            temp = parseFloat((37.8 + Math.sin(timeOffset) * 0.1).toFixed(1));
            resp = Math.round(52 + Math.sin(timeOffset) * 1);
          } else if (baby.id === 'NB-2026-005' && Math.sin(timeOffset) > 0.75) {
            status = 'MODERATE';
            score = 74;
            hr = Math.round(156 + Math.random() * 4);
            spo2 = Math.round(92 - Math.random() * 1);
            temp = 37.4;
            resp = 48;
          } else {
            status = 'NORMAL';
            score = Math.round(90 + Math.sin(timeOffset) * 2);
            hr = Math.round(135 + Math.sin(timeOffset) * 4 + Math.random() * 2);
            spo2 = Math.round(98 - Math.random() * 1);
            temp = parseFloat((36.7 + Math.sin(timeOffset) * 0.05 + Math.random() * 0.05).toFixed(1));
            resp = Math.round(38 + Math.sin(timeOffset) * 1 + Math.random() * 1);
          }

          return {
            ...baby,
            status,
            predictionScore: score,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            vitals: { heartRate: hr, respRate: resp, spo2, temp }
          };
        });

        // Set local babies and update histories
        setLiveBabies(mappedBabies);

        setBabyHistories(prev => {
          const updated = { ...prev };
          mappedBabies.forEach((b: any) => {
            const historyList = updated[b.id] || [];
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            updated[b.id] = [...historyList.slice(-19), { time: timeStr, heartRate: b.vitals.heartRate, spo2: b.vitals.spo2 }];
          });
          return updated;
        });

        // Set mapped data object so that UI doesn't crash on null fields
        const activeBabyObj = mappedBabies.find((b: any) => b.id === selectedBabyId) || mappedBabies[0] || {};
        const activeId = activeBabyObj.id || selectedBabyId;
        const totalModerate = mappedBabies.filter((b: any) => b.status === "MODERATE").length;
        const totalCritical = mappedBabies.filter((b: any) => b.status === "CRITICAL").length;

        const activeAlerts: any[] = [];
        mappedBabies.forEach((b: any) => {
          if (b.status === "CRITICAL" || b.status === "MODERATE") {
            activeAlerts.push({
              id: b.id,
              type: b.status === "CRITICAL" ? "critical" : "warning",
              message: `Incubator ${b.incubatorId} Alert: AI Warning State`,
              timestamp: b.lastUpdated
            });
          }
        });

        setData({
          activeBabyId: activeId,
          babies: mappedBabies,
          alerts: activeAlerts,
          totalModerate,
          totalCritical,
          patient: {
            id: activeBabyObj.id,
            babyId: activeBabyObj.babyId,
            incubatorId: activeBabyObj.incubatorId,
            age: activeBabyObj.age,
            weight: activeBabyObj.weight,
            gestationalAge: activeBabyObj.gestationalAge,
            status: activeBabyObj.status
          }
        });
      }
    };

    const interval = setInterval(poll, 1000); // Poll every 1 second for live real-time response
    poll(); // Initial poll
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedBabyId]);

  // Apnea Sound Siren Logic
  useEffect(() => {
    let alarm: any;
    const isCrisis = data?.babies?.some((b: any) => b.status === 'CRITICAL');

    if (isCrisis && isAuthenticated && !isMasterMuted) {
      const playAlarm = () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          g.gain.setValueAtTime(0.08, ctx.currentTime);
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
  }, [liveBabies, isAuthenticated, isMasterMuted]);

  try {
    if (!isAuthenticated) {
      if (currentView === 'landing') {
        return <LandingPage onGoToLogin={() => setCurrentView('login')} />;
      } else {
        return <LoginForm onLogin={() => { setIsAuthenticated(true); setCurrentView('dashboard'); }} onBack={() => setCurrentView('landing')} />;
      }
    }

    if (liveBabies.length === 0) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
          <div style={{ textAlign: 'center' }}>
            <Activity size={60} color="var(--primary)" style={{ animation: 'pulse-soft 1.2s infinite' }} />
            <h2 style={{ marginTop: '20px', fontWeight: 800, color: 'var(--text-muted)' }}>CONNECTING TO CLINICAL TERMINAL...</h2>
            {error && <p style={{ color: 'var(--secondary)', marginTop: '10px' }}>{error}</p>}
          </div>
        </div>
      );
    }

    const alertsList = data?.alerts || [];

    const currentHeartRate = liveBabies.find((b: any) => b.id === selectedBabyId)?.vitals?.heartRate || 140;

    return (
      <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
        {/* Glowing 3D Particle Background Network */}
        <ThreeDParticleBackground />

        <div style={{ minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>
        
        {/* Dynamic Toast Notifications */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <div style={{ fontSize: '20px' }}>{t.type === 'critical' ? '🚨' : t.type === 'warning' ? '⚠' : 'ℹ'}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '12px', color: 'var(--text-main)' }}>{t.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.message}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Drawer overlay */}
        <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
        
        {/* Sidebar Drawer Panel (Slide-in deep teal background) */}
        <aside className={`sidebar-drawer ${isSidebarOpen ? 'open' : ''}`} style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
            <div style={{ width: '42px', height: '42px', background: 'var(--mint)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <HeartPulse size={20} className="heartbeat-icon" fill="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: 'white' }}>NAVAAYU</h1>
              <span style={{ fontSize: '9px', color: 'var(--card-bg)', fontWeight: 800, letterSpacing: '1px' }}>CLINICAL WARD HUB</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--card-bg)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <nav style={{ flex: 1 }}>
            <div className={`sidebar-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('Dashboard'); setIsSidebarOpen(false); }}>
              <LayoutGrid size={16} /> Dashboard
            </div>
            <div className={`sidebar-item ${activeTab === 'All Babies' ? 'active' : ''}`} onClick={() => { setActiveTab('All Babies'); setIsSidebarOpen(false); }}>
              <Baby size={16} /> Incubator Beds
            </div>
            <div className={`sidebar-item ${activeTab === 'Alerts' ? 'active' : ''}`} onClick={() => { setActiveTab('Alerts'); setIsSidebarOpen(false); }}>
              <Bell size={16} /> Alerts
              {alertsList.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--secondary)', color: 'white', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '50%' }}>{alertsList.length}</span>
              )}
            </div>
            <div className={`sidebar-item ${activeTab === 'Trends' ? 'active' : ''}`} onClick={() => { setActiveTab('Trends'); setIsSidebarOpen(false); }}>
              <Activity size={16} /> Trends
            </div>
            <div className={`sidebar-item ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => { setActiveTab('Settings'); setIsSidebarOpen(false); }}>
              <Sliders size={16} /> Settings
            </div>
            <div className={`sidebar-item ${activeTab === 'About' ? 'active' : ''}`} onClick={() => { setActiveTab('About'); setIsSidebarOpen(false); }}>
              <Info size={16} /> About
            </div>
          </nav>

          {/* Status Guide */}
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>STATUS GUIDE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--mint)', borderRadius: '50%' }} />
                <span>NORMAL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />
                <span>MODERATE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--secondary)', borderRadius: '50%' }} />
                <span>CRITICAL</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: 'var(--card-bg)', fontWeight: 800, marginBottom: '6px' }}>SYSTEM UPTIME</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--mint)', fontFamily: 'monospace' }}>{formatUptime(uptime)}</div>
        </aside>

        {/* Baby Details Modal Overlay (Full Details Expandable View) */}
        <div className={`modal-backdrop ${expandedBabyId ? 'open' : ''}`} onClick={() => setExpandedBabyId(null)}>
          {expandedBabyId && (() => {
            const baby = liveBabies.find((b: any) => b.id === expandedBabyId) || {};
            const isCritical = baby.status === 'CRITICAL';
            const isWarning = baby.status === 'MODERATE';
            const statusColor = isCritical ? 'var(--secondary)' : (isWarning ? 'var(--accent)' : 'var(--mint)');
            
            return (
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '50%', 
                      background: statusColor, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontWeight: 900, 
                      fontSize: '14px' 
                    }}>
                      {getBedInitials(baby.id)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>Incubator {baby.incubatorId}</h3>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>Baby ID: {baby.babyId} • {baby.age} • {baby.weight}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setExpandedBabyId(null)}
                    style={{ background: 'rgba(47, 65, 86, 0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Status & Confidence Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(47, 65, 86, 0.04)', padding: '14px 20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>AI CLASSIFICATION</div>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: statusColor, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {isCritical ? '🚨' : isWarning ? '⚠' : '●'} {baby.status}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>AI CONFIDENCE</div>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px', display: 'block' }}>
                      {baby.predictionScore}%
                    </span>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={10} color="var(--secondary)" /> HEART RATE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.heartRate > 160 || baby.vitals?.heartRate < 100) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                      {baby.vitals?.heartRate} 
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>bpm</span>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={10} color="var(--primary)" /> OXYGEN SATURATION</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.spo2 < 95) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                      {baby.vitals?.spo2}%
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Sliders size={10} color="var(--mint)" /> TEMPERATURE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.temp > 37.5 || baby.vitals?.temp < 36.5) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                      {baby.vitals?.temp}°C
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={10} color="var(--primary)" /> RESPIRATORY RATE</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.respRate > 50 || baby.vitals?.respRate < 25) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                      {baby.vitals?.respRate}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>/min</span>
                    </div>
                  </div>
                </div>

                {/* Reasons List */}
                {baby.reasons.length > 0 && (
                  <div style={{ padding: '16px', background: isCritical ? 'rgba(217, 83, 79, 0.05)' : 'rgba(197, 152, 40, 0.05)', border: `1px solid ${isCritical ? 'var(--secondary)' : 'var(--accent)'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: isCritical ? 'var(--secondary)' : 'var(--accent)', letterSpacing: '0.5px' }}>
                      {isCritical ? 'IMMEDIATE ATTENTION REQUIRED' : 'REASONS FOR ATTENTION'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {baby.reasons.map((r: string, idx: number) => (
                        <div key={idx} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>• {r}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bedside Beating ECG Waveform Trend (Sweeps in real-time) */}
                <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', height: '100px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px' }}>Live Bedside Waveform (ECG Beating Rhythm)</div>
                  <div style={{ height: '60px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ecgData}>
                        <Area type="monotone" dataKey="y" stroke={statusColor} fill="transparent" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Header Row */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="glass-card"
              style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--card-bg)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}
              title="Open Navaayu Control Panel"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: 'var(--primary)' }}>NAVAAYU</h2>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: '4px 0 0 0', fontSize: '13px' }}>Neonatal AI Monitoring System</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Demo Mode Toggle */}
            <button 
              onClick={() => setIsDemoMode(!isDemoMode)}
              className="glass-card"
              style={{ 
                padding: '8px 16px', 
                background: isDemoMode ? 'rgba(217, 130, 43, 0.15)' : 'var(--card-bg)', 
                border: `1px solid ${isDemoMode ? 'var(--accent)' : 'var(--border-color)'}`,
                borderRadius: '12px', 
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 900,
                color: isDemoMode ? 'var(--accent)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Toggle Simulated Demo Mode Data"
            >
              ⚙ {isDemoMode ? "DEMO MODE: ON" : "ACTIVE BACKEND"}
            </button>

            {/* System Status Label */}
            <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}>
              <div style={{ width: '8px', height: '8px', background: isDemoMode ? 'var(--accent)' : 'var(--mint)', borderRadius: '50%', animation: 'pulse-soft 1s infinite' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS:</span>
              <span style={{ fontSize: '10px', fontWeight: 900, color: isDemoMode ? 'var(--accent)' : 'var(--mint)' }}>{isDemoMode ? 'DEMO MODE' : 'ONLINE'}</span>
            </div>

            {/* PC2 Connection Status */}
            <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}>
              <div style={{ width: '8px', height: '8px', background: isBackendOnline ? 'var(--mint)' : 'var(--secondary)', borderRadius: '50%', animation: isBackendOnline ? 'pulse-soft 1s infinite' : 'none' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>PC2 API:</span>
              <span style={{ fontSize: '10px', fontWeight: 900, color: isBackendOnline ? 'var(--mint)' : 'var(--secondary)' }}>{isBackendOnline ? 'CONNECTED' : 'OFFLINE'}</span>
            </div>

            {/* Master Mute Toggle */}
            <button 
              onClick={() => setIsMasterMuted(!isMasterMuted)} 
              className="glass-card"
              style={{ padding: '8px 16px', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', cursor: 'pointer', color: 'var(--primary)', fontSize: '11px', fontWeight: 800 }}
            >
              {isMasterMuted ? <VolumeX size={14} color="var(--secondary)" /> : <Volume2 size={14} color="var(--mint)" />}
              {isMasterMuted ? "MUTED" : "ALARM VOL"}
            </button>

            {/* Current Time Ticker */}
            <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>
              ⏱ {currentTime || '00:00:00'}
            </div>

            {/* Logout Button */}
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                setCurrentView('landing');
              }}
              className="glass-card"
              style={{ 
                padding: '8px 16px', 
                background: 'var(--card-bg)', 
                border: '1px solid var(--secondary)',
                borderRadius: '12px', 
                cursor: 'pointer', 
                color: 'var(--secondary)', 
                fontSize: '11px', 
                fontWeight: 900 
              }}
            >
              LOGOUT
            </button>
          </div>
        </header>

        {/* VIEW: MAIN DASHBOARD */}
        {activeTab === 'Dashboard' && (() => {
          const activeBaby = liveBabies.find((b: any) => b.id === selectedBabyId) || liveBabies[0] || {};
          const isCritical = activeBaby.status === 'CRITICAL';
          const isWarning = activeBaby.status === 'MODERATE';
          const activeStatusColor = isCritical ? 'var(--secondary)' : (isWarning ? 'var(--accent)' : 'var(--mint)');
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, position: 'relative', zIndex: 10 }}>
              
              {/* Summary Stats Row */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(69, 131, 147, 0.1)', color: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Baby size={22} /></div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)' }}>{liveBabies.length}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>Total Beds Monitored</div>
                  </div>
                </div>
                
                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', border: (data?.totalModerate || 0) > 0 ? '1.5px solid var(--accent)' : '1px solid var(--border-color)' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(217, 130, 43, 0.1)', color: 'var(--accent)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={22} /></div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>{data?.totalModerate || 0}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>Moderate Cases</div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', border: (data?.totalCritical || 0) > 0 ? '1.5px solid var(--secondary)' : '1px solid var(--border-color)' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255, 94, 94, 0.1)', color: 'var(--secondary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={22} /></div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--secondary)' }}>{data?.totalCritical || 0}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>Critical Cases</div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(0, 71, 171, 0.1)', color: 'var(--mint)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Monitor size={22} /></div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)' }}>{isDemoMode ? "99%" : isBackendOnline ? "98%" : "80%"}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>System Health</div>
                  </div>
                </div>
              </section>

              {/* Demo Mode alert banner */}
              {isDemoMode && (
                <div style={{ 
                  background: 'rgba(217, 130, 43, 0.12)', 
                  border: '1px solid var(--accent)', 
                  color: 'var(--accent)', 
                  padding: '12px 24px', 
                  borderRadius: '14px', 
                  fontWeight: 900, 
                  fontSize: '12px',
                  textAlign: 'center',
                  letterSpacing: '1px'
                }}>
                  ⚠️ DEMO MODE – SIMULATED NEONATAL TELEMETRY DATA ACTIVE
                </div>
              )}

              {/* Main Command Split Screen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.95fr 1.05fr', gap: '30px' }}>
                
                {/* LEFT COLUMN: ACTIVE BED VITALS & LIVE TREND CHART */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* PATIENT MONITORING AREA */}
                  <div className="glass-card" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Patient ID: {activeBaby.babyId}</h3>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>AGE: {activeBaby.age} • WEIGHT: {activeBaby.weight} • GESTATION: {activeBaby.gestationalAge}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', background: activeStatusColor, padding: '6px 14px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                        STATUS: MONITORING ({activeBaby.status})
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* HR Card */}
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>❤️ HEART RATE</span>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: (activeBaby.vitals?.heartRate > 160 || activeBaby.vitals?.heartRate < 100) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.heartRate || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>BPM</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal: 110-160 BPM</span>
                      </div>
                      
                      {/* SpO2 Card */}
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>💙 OXYGEN SATURATION (SpO₂)</span>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: (activeBaby.vitals?.spo2 < 95) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.spo2 || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>%</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal: &ge;95%</span>
                      </div>

                      {/* RR Card */}
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>🫁 RESPIRATORY RATE</span>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: (activeBaby.vitals?.respRate > 50 || activeBaby.vitals?.respRate < 25) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.respRate || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>/min</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal: 30-60 /min</span>
                      </div>

                      {/* Temp Card */}
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>🌡️ SKIN TEMPERATURE</span>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: (activeBaby.vitals?.temp > 37.5 || activeBaby.vitals?.temp < 36.5) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.temp || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>°C</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal: 36.5-37.5 °C</span>
                      </div>
                    </div>
                  </div>

                  {/* LIVE VITAL TRENDS GRAPH */}
                  <div className="glass-card" style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Live Vital Trends</h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>Continuous vital history charts for patient {activeBaby.babyId}</p>
                    </div>
                    <div style={{ height: '260px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={babyHistories[activeBaby.id] || []}>
                          <defs>
                            <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--mint)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--mint)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 65, 86, 0.05)" />
                          <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} fontWeight="bold" />
                          <YAxis stroke="var(--text-muted)" fontSize={9} fontWeight="bold" />
                          <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }} />
                          <Area type="monotone" dataKey="heartRate" stroke="var(--mint)" strokeWidth={2} fillOpacity={1} fill="url(#colorHR)" name="Heart Rate (BPM)" />
                          <Area type="monotone" dataKey="spo2" stroke="#0047AB" strokeWidth={2} fill="transparent" name="SpO₂ (%)" />
                          <Area type="monotone" dataKey="temp" stroke="var(--accent)" strokeWidth={1.5} fill="transparent" name="Temp (°C)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: AI RISK assessment, SYSTEM Architecture STATUS & PATIENTS DIRECTORY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* AI PREDICTION CARD */}
                  <div className="glass-card" style={{ padding: '30px', borderLeft: `6px solid ${activeStatusColor}` }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>AI Risk Assessment</div>
                    
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>CURRENT STATUS</span>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: activeStatusColor, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isCritical ? '🔴 CRITICAL' : isWarning ? '🟡 WARNING' : '🟢 SAFE'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>RISK SCORE</span>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: activeStatusColor, marginTop: '2px' }}>
                          {isCritical ? '88%' : isWarning ? '64%' : '8%'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '18px', background: 'rgba(47, 65, 86, 0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                      🔍 Model Confidence: <strong>{isCritical ? '95%' : isWarning ? '89%' : '97%'}%</strong>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Prediction generated from the latest neonatal vital-sign input.</div>
                    </div>
                  </div>

                  {/* CLINICAL ALERTS */}
                  <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: 'var(--primary)' }}>Clinical Alerts</h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>Live alerts stream for patient {activeBaby.babyId}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                      {alertsList.length > 0 ? alertsList.slice(0, 3).map((a: any, i: number) => {
                        const isCriticalLog = a.type === 'critical';
                        return (
                          <div 
                            key={i} 
                            style={{ 
                              padding: '10px 16px', 
                              background: isCriticalLog ? 'rgba(255, 94, 94, 0.08)' : 'rgba(217, 130, 43, 0.08)', 
                              borderRadius: '12px', 
                              fontSize: '11px', 
                              fontWeight: 800, 
                              borderLeft: `3px solid ${isCriticalLog ? 'var(--secondary)' : 'var(--accent)'}`, 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ color: 'var(--text-main)' }}>{a.message}</div>
                              <div style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.8, marginTop: '2px' }}>Patient: {activeBaby.babyId} • Status: {isCriticalLog ? 'CRITICAL' : 'WARNING'}</div>
                            </div>
                            <span style={{ opacity: 0.5, fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>{a.timestamp}</span>
                          </div>
                        );
                      }) : <div style={{ textAlign: 'center', padding: '30px', opacity: 0.4, fontSize: '12px', color: 'var(--text-muted)' }}>No active warnings</div>}
                    </div>
                  </div>

                  {/* MONITORED PATIENTS DIRECTORY TABLE */}
                  <div className="glass-card" style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Monitored Patients</h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>Select a patient bed below to focus telemetry</p>
                    </div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 800 }}>
                          <th style={{ padding: '8px 10px' }}>PATIENT</th>
                          <th style={{ padding: '8px 10px' }}>STATUS</th>
                          <th style={{ padding: '8px 10px' }}>RISK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveBabies.map((b: any) => {
                          const isSel = b.id === selectedBabyId;
                          const isCrit = b.status === 'CRITICAL';
                          const isWarn = b.status === 'MODERATE';
                          return (
                            <tr 
                              key={b.id} 
                              onClick={() => handleSelectBaby(b.id)}
                              style={{ 
                                borderBottom: '1px solid rgba(47, 65, 86, 0.04)', 
                                cursor: 'pointer',
                                background: isSel ? 'rgba(0, 71, 171, 0.06)' : 'transparent',
                                fontWeight: isSel ? 900 : 700,
                                color: isSel ? 'var(--primary)' : 'var(--text-main)'
                              }}
                            >
                              <td style={{ padding: '10px' }}>{b.incubatorId}</td>
                              <td style={{ padding: '10px', color: isCrit ? 'var(--secondary)' : isWarn ? 'var(--accent)' : 'var(--mint)' }}>
                                {b.status === 'NORMAL' ? '🟢 Monitoring' : b.status === 'MODERATE' ? '🟡 Attention' : '🔴 Critical'}
                              </td>
                              <td style={{ padding: '10px' }}>
                                {isCrit ? 'High (88%)' : isWarn ? 'Moderate (64%)' : 'Low (8%)'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* SYSTEM ARCHITECTURE STATUS GRID */}
                  <div className="glass-card" style={{ padding: '30px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: 'var(--primary)' }}>System Status</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontWeight: 800, marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Data Source (PC1)</span>
                          <span style={{ color: isDemoMode ? 'var(--accent)' : 'var(--mint)' }}>{isDemoMode ? '🟡 Simulated' : '🟢 Connected'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>FastAPI Backend (PC2)</span>
                          <span style={{ color: isBackendOnline ? 'var(--mint)' : 'var(--secondary)' }}>{isBackendOnline ? '🟢 Connected' : '🔴 Offline'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>ML Model (Random Forest)</span>
                          <span style={{ color: (isBackendOnline || isDemoMode) ? 'var(--mint)' : 'var(--secondary)' }}>{(isBackendOnline || isDemoMode) ? '🟢 Loaded' : '🔴 Offline'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Dashboard (PC3)</span>
                          <span style={{ color: 'var(--mint)' }}>🟢 Connected</span>
                        </div>
                      </div>
                    </div>

                    {/* 3D Telemetry Canvas Helix */}
                    <ThreeDTelemetryWidget heartRate={currentHeartRate} />
                  </div>

                </div>

              </div>
              
            </div>
          );
        })()}

        {/* VIEW: ALL CLINICAL BEDS */}
        {activeTab === 'All Babies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Incubator Beds Directory</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, margin: '4px 0 0 0' }}>Overview of all monitored neonatal incubator beds in the ward</p>
            </div>
            
            {/* Grid of 3 Baby Cards (Max 3 per line with proper spacing and enlarged fonts) */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
              {liveBabies.map((baby: any) => {
                const isCurrentActive = baby.id === selectedBabyId;
                const isCritical = baby.status === 'CRITICAL';
                const isWarning = baby.status === 'MODERATE';
                const statusColor = isCritical ? 'var(--secondary)' : (isWarning ? 'var(--accent)' : 'var(--mint)');
                const cardBorderClass = isCritical ? 'pulse-red' : (isWarning ? 'pulse-amber' : '');

                return (
                  <div 
                    key={baby.id} 
                    className={`glass-card ${cardBorderClass} ${isCurrentActive ? 'active-focus' : ''}`}
                    onClick={() => handleSelectBaby(baby.id)}
                    style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'pointer', position: 'relative' }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: statusColor }}>{isCritical ? '🚨' : isWarning ? '⚠' : '●'}</span>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)' }}>{baby.incubatorId}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: 'white', background: statusColor, padding: '6px 14px', borderRadius: '10px', letterSpacing: '1px' }}>
                        {baby.status}
                      </span>
                    </div>

                    {/* Center */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '24px' }}>
                        {getBedInitials(baby.id)}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 800 }}>Baby ID: {baby.babyId} • {baby.age}</div>
                    </div>

                    {/* Micro Vitals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }} onClick={e => e.stopPropagation()}>
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(47, 65, 86, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>HEART RATE</span>
                        <span style={{ fontWeight: 900, color: (baby.vitals?.heartRate > 160 || baby.vitals?.heartRate < 100) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '18px' }}>
                          {baby.vitals?.heartRate || '--'}<span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700 }}>bpm</span>
                        </span>
                      </div>
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(47, 65, 86, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>OXYGEN (SpO₂)</span>
                        <span style={{ fontWeight: 900, color: (baby.vitals?.spo2 < 95) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '18px' }}>
                          {baby.vitals?.spo2 || '--'}<span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700 }}>%</span>
                        </span>
                      </div>
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(47, 65, 86, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>TEMPERATURE</span>
                        <span style={{ fontWeight: 900, color: (baby.vitals?.temp > 37.5 || baby.vitals?.temp < 36.5) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '18px' }}>
                          {baby.vitals?.temp || '--'}<span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700 }}>°C</span>
                        </span>
                      </div>
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(47, 65, 86, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>RESPIRATORY</span>
                        <span style={{ fontWeight: 900, color: (baby.vitals?.respRate > 50 || baby.vitals?.respRate < 25) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '18px' }}>
                          {baby.vitals?.respRate || '--'}<span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700 }}>/min</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      <span>Health Condition</span>
                      <span style={{ color: statusColor, fontSize: '18px', fontWeight: 900 }}>{baby.predictionScore}%</span>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* VIEW: CLINICAL TRENDS TERMINAL */}
        {activeTab === 'Trends' && (
          <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Clinical Trends Terminal</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, margin: '4px 0 0 0' }}>Historical vital telemetry analytics by incubator bed location</p>
              </div>
              
              <select 
                value={selectedBabyId} 
                onChange={e => setSelectedBabyId(e.target.value)}
                className="vibrant-input"
                style={{ width: '220px', fontWeight: 800 }}
              >
                {liveBabies.map(b => (
                  <option key={b.id} value={b.id}>Incubator {b.incubatorId}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1 }}>
              {/* HR Trend Card */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--card-bg)' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={16} /> Heart Rate Trend (bpm)
                </div>
                <div style={{ flex: 1, minHeight: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={babyHistories[selectedBabyId] || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Area type="monotone" dataKey="heartRate" stroke="var(--secondary)" fill="rgba(217,83,79,0.05)" strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SpO2 Trend Card */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--card-bg)' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} /> Oxygen Saturation Trend (SpO₂)
                </div>
                <div style={{ flex: 1, minHeight: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={babyHistories[selectedBabyId] || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Area type="monotone" dataKey="spo2" stroke="var(--mint)" fill="rgba(52,169,157,0.05)" strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback View placeholders for non-active tabs */}
        {(activeTab !== 'Dashboard' && activeTab !== 'All Babies' && activeTab !== 'Trends') && (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>{activeTab} Analytics Terminal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', marginTop: '6px' }}>
              Real-time predictions continue streaming on the primary NAVAAYU dashboard overview tab.
            </p>
            <button onClick={() => setActiveTab('Dashboard')} className="sidebar-item active" style={{ marginTop: '20px', border: 'none' }}>
              Return to Dashboard Overview
            </button>
          </div>
        )}

        {/* Medical Disclaimer */}
        <footer style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>Disclaimer: NAVAAYU is an AI-assisted neonatal monitoring prototype and is not a substitute for professional medical judgment, clinical diagnosis, or medical decision thresholds.</div>
          <div style={{ color: 'var(--primary)', opacity: 0.8 }}>© 2026 @AKESISPROTOCOL. All rights reserved.</div>
        </footer>
      </div>
    </div>
    );
  } catch (e: any) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E5CB90', color: '#1D2E32', padding: '40px' }}>
        <div style={{ background: '#FFF3C8', padding: '40px', borderRadius: '24px', maxWidth: '500px', border: '1px solid #D9534F' }}>
          <h2 style={{ color: '#D9534F', fontWeight: 900 }}>DASHBOARD RENDER CRASH</h2>
          <p style={{ marginTop: '10px', color: '#4A6065' }}>An unexpected error occurred during interface rendering. The polling thread was protected.</p>
          <pre style={{ background: '#FFFBEF', padding: '15px', borderRadius: '12px', fontSize: '12px', overflowX: 'auto', color: '#D9534F' }}>{e.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', background: '#D9534F', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
            Restart Clinical Interface
          </button>
        </div>
      </div>
    );
  }
}

// Floating Background elements for landing/login UI
const FloatingBackground = () => {
  return (
    <>
      <div className="floating-bg-item" style={{ left: '10%', animationDelay: '0s', animationDuration: '14s' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </div>
      <div className="floating-bg-item" style={{ left: '25%', animationDelay: '3s', animationDuration: '18s' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
      <div className="floating-bg-item" style={{ left: '45%', animationDelay: '1s', animationDuration: '16s' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
      </div>
      <div className="floating-bg-item" style={{ left: '65%', animationDelay: '5s', animationDuration: '20s' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </div>
      <div className="floating-bg-item" style={{ left: '80%', animationDelay: '2s', animationDuration: '15s' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
      <div className="floating-bg-item" style={{ left: '92%', animationDelay: '7s', animationDuration: '22s' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
      </div>
    </>
  );
};

// Landing Page presenting NAVAAYU core functions
function LandingPage({ onGoToLogin }: { onGoToLogin: () => void }) {
  const explanationSectionRef = useRef<HTMLDivElement | null>(null);

  const handleHowItWorks = () => {
    explanationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', width: '100vw', overflowY: 'auto', position: 'relative', boxSizing: 'border-box' }}>
      <FloatingBackground />

      {/* 1. HERO SECTION */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ width: '1000px', display: 'flex', gap: '50px', padding: '60px', alignItems: 'center' }}>
          {/* Left Side: SVG Doctor illustration */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 500 500" width="100%" height="340">
              <circle cx="250" cy="250" r="180" fill="rgba(86, 124, 141, 0.08)" />
              <path d="M 120 450 Q 250 320 380 450 Z" fill="#2F4156" />
              <path d="M 210 380 L 250 450 L 290 380 Z" fill="#F5EFEB" />
              <path d="M 245 400 L 255 400 L 258 450 L 250 460 L 242 450 Z" fill="#0047AB" />
              <path d="M 160 410 L 210 430 L 195 450 Z" fill="#FFFFFF" />
              <path d="M 340 410 L 290 430 L 305 450 Z" fill="#FFFFFF" />
              <path d="M 180 340 Q 250 400 320 340" fill="none" stroke="#567C8D" strokeWidth="6" strokeLinecap="round" />
              <path d="M 250 395 L 250 430" fill="none" stroke="#567C8D" strokeWidth="4" />
              <circle cx="250" cy="435" r="12" fill="#567C8D" />
              <rect x="225" y="270" width="50" height="50" rx="10" fill="#F5EFEB" />
              <circle cx="250" cy="240" r="50" fill="#F5EFEB" />
              <path d="M 200 230 Q 250 180 300 230 Q 290 205 270 200 Q 250 200 230 205 Z" fill="#2F4156" />
              <rect x="215" y="225" width="28" height="18" rx="4" fill="none" stroke="#2F4156" strokeWidth="3" />
              <rect x="257" y="225" width="28" height="18" rx="4" fill="none" stroke="#2F4156" strokeWidth="3" />
              <line x1="243" y1="234" x2="257" y2="234" stroke="#2F4156" strokeWidth="3" />
              <path d="M 245 255 Q 250 260 255 255" fill="none" stroke="#2F4156" strokeWidth="2.5" strokeLinecap="round" />
              <g transform="translate(320, 150) rotate(5)">
                <rect x="0" y="0" width="100" height="140" rx="12" fill="#FFFFFF" stroke="rgba(47, 65, 86, 0.15)" strokeWidth="2" />
                <rect x="30" y="-8" width="40" height="16" rx="4" fill="#567C8D" />
                <line x1="15" y1="30" x2="85" y2="30" stroke="#2F4156" strokeWidth="3" strokeLinecap="round" />
                <line x1="15" y1="50" x2="70" y2="50" stroke="#567C8D" strokeWidth="2" />
                <line x1="15" y1="70" x2="80" y2="70" stroke="#567C8D" strokeWidth="2" />
                <path d="M 15 110 L 30 110 L 35 95 L 40 125 L 45 105 L 50 110 L 85 110" fill="none" stroke="#FF5E5E" strokeWidth="2" strokeLinecap="round" />
              </g>
              <path d="M 80 180 L 110 180 M 95 165 L 95 195" stroke="#567C8D" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
              <path d="M 400 320 L 420 320 M 410 310 L 410 330" stroke="#567C8D" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
            </svg>
          </div>
          {/* Right Side: Title + CTAs */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#0047AB', background: 'rgba(0,71,171,0.06)', padding: '6px 14px', borderRadius: '30px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>clinical edge ai portal</span>
              <h1 style={{ fontSize: '56px', fontWeight: 900, color: 'var(--primary)', margin: '14px 0 10px 0', letterSpacing: '-2px', lineHeight: 1 }}>NAVAAYU</h1>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.3 }}>AI-Powered Neonatal Monitoring</h2>
              <p style={{ color: 'var(--text-main)', fontSize: '13.5px', fontWeight: 600, margin: 0, lineHeight: 1.5, opacity: 0.85 }}>
                NAVAAYU is an AI-assisted neonatal monitoring system that continuously analyzes vital signs such as Heart Rate, SpO₂, Respiratory Rate, and Temperature to identify potential risks and provide timely alerts.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={onGoToLogin} className="vibrant-btn" style={{ padding: '16px 28px', fontSize: '14px', fontWeight: 900, borderRadius: '12px', background: '#0047AB', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 71, 171, 0.25)' }}>
                Get Started
              </button>
              <button onClick={handleHowItWorks} className="vibrant-btn" style={{ padding: '16px 28px', fontSize: '14px', fontWeight: 900, borderRadius: '12px', background: 'rgba(47, 65, 86, 0.05)', color: 'var(--primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT IS NAVAAYU? SECTION */}
      <section ref={explanationSectionRef} style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '1000px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>What is NAVAAYU?</h2>
          <p style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: 600, maxWidth: '750px', margin: '20px auto 0 auto', lineHeight: 1.7, opacity: 0.85 }}>
            NAVAAYU is designed to assist neonatal care by continuously monitoring important vital signs and using machine learning to identify abnormal patterns and risk conditions.
          </p>
        </div>
      </section>

      {/* 3. WHY IT MATTERS SECTION */}
      <section style={{ padding: '40px 40px 80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '1000px', textAlign: 'center', marginBottom: '45px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Why It Matters</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800, marginTop: '8px' }}>Early detection saves lives while assisting medical experts</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '1000px' }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 8px 0' }}>Continuous Monitoring</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 700, margin: 0 }}>Monitor important neonatal vital signs continuously.</p>
          </div>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 8px 0' }}>Early Risk Detection</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 700, margin: 0 }}>Identify potentially abnormal vital-sign patterns earlier.</p>
          </div>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 8px 0' }}>AI-Assisted Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 700, margin: 0 }}>Use machine learning to analyze multiple parameters together.</p>
          </div>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 8px 0' }}>Real-Time Alerts</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: 700, margin: 0 }}>Present important changes clearly through the monitoring dashboard.</p>
          </div>
        </div>
      </section>

      {/* 4. HOW NAVAAYU WORKS SECTION */}
      <section style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '1000px', textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>How NAVAAYU Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, margin: '8px 0 0 0' }}>Data pipeline from clinical bedside monitoring to AI analytics</p>
        </div>

        {/* Monitored parameters */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', width: '1000px', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>❤️</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-main)' }}>Heart Rate</span>
          </div>
          <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>💙</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-main)' }}>SpO₂</span>
          </div>
          <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🫁</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-main)' }}>Respiratory Rate</span>
          </div>
          <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🌡️</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-main)' }}>Temperature</span>
          </div>
        </div>

        {/* Process Flow */}
        <div className="glass-card" style={{ width: '1000px', padding: '40px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047AB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 10px auto', fontWeight: 900 }}>1</div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>Vital Signs</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '20px', animation: 'pulse-soft 1s infinite' }}>➔</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047AB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 10px auto', fontWeight: 900 }}>2</div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>Data Processing</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '20px', animation: 'pulse-soft 1s infinite' }}>➔</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047AB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 10px auto', fontWeight: 900 }}>3</div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>AI / ML Model</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '20px', animation: 'pulse-soft 1s infinite' }}>➔</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0047AB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 10px auto', fontWeight: 900 }}>4</div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>Risk Prediction</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '20px', animation: 'pulse-soft 1s infinite' }}>➔</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#D9822B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 10px auto', fontWeight: 900 }}>5</div>
            <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>Dashboard & Alerts</div>
          </div>
        </div>
      </section>

      {/* 5. PROTOTYPE 3-PC ARCHITECTURE SECTION */}
      <section style={{ padding: '80px 40px 100px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '1000px', textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>How Our Prototype Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, margin: '8px 0 0 0' }}>Decoupled local 3-PC hardware setup for real-time telemetry demonstration</p>
        </div>
        
        {/* Animated 3-PC Grid */}
        <div className="glass-card" style={{ width: '1000px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg viewBox="0 0 800 200" width="100%" height="140">
            <style>{`
              @keyframes dash {
                to { stroke-dashoffset: -1000; }
              }
            `}</style>
            <rect x="30" y="45" width="180" height="90" rx="16" fill="var(--card-bg)" stroke="#0047AB" strokeWidth="2.5" />
            <text x="120" y="80" textAnchor="middle" fill="#0047AB" fontWeight="900" fontSize="13">PC 1</text>
            <text x="120" y="105" textAnchor="middle" fill="var(--text-muted)" fontWeight="700" fontSize="10.5">Real-Time Data Source</text>
            
            <path d="M 210 90 L 390 90" stroke="#0047AB" strokeWidth="2.5" strokeDasharray="8 6" style={{ animation: 'dash 15s linear infinite' }} />
            
            <rect x="390" y="45" width="180" height="90" rx="16" fill="var(--card-bg)" stroke="#D9822B" strokeWidth="2.5" />
            <text x="480" y="80" textAnchor="middle" fill="#D9822B" fontWeight="900" fontSize="13">PC 2</text>
            <text x="480" y="105" textAnchor="middle" fill="var(--text-muted)" fontWeight="700" fontSize="10.5">AI + Backend</text>
            
            <path d="M 570 90 L 750 90" stroke="#0047AB" strokeWidth="2.5" strokeDasharray="8 6" style={{ animation: 'dash 15s linear infinite' }} />
            
            <rect x="750" y="45" width="180" height="90" rx="16" fill="var(--card-bg)" stroke="#0047AB" strokeWidth="2.5" />
            <text x="840" y="80" textAnchor="middle" fill="#0047AB" fontWeight="900" fontSize="13">PC 3</text>
            <text x="840" y="105" textAnchor="middle" fill="var(--text-muted)" fontWeight="700" fontSize="10.5">Monitoring Dashboard</text>
          </svg>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%', marginTop: '24px', textAlign: 'center' }}>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)' }}>PC 1 – Data Generator</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>Generates/feeds neonatal vital-sign data.</div>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)' }}>PC 2 – AI + Backend</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>FastAPI receives the data and runs the trained ML model.</div>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)' }}>PC 3 – Monitoring Dashboard</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>Displays live values, predictions and alerts.</div>
            </div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, marginTop: '20px', borderTop: '1px dashed var(--border-color)', width: '100%', paddingTop: '16px', textAlign: 'center' }}>
            ℹ️ The prototype currently uses a local-network 3-PC architecture for real-time demonstration.
          </div>
        </div>
      </section>

      {/* 6. RISK LEVELS (SAFE/WARNING/CRITICAL) & DISCLAIMER */}
      <section style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '1000px', textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Classified Risk Levels</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, margin: '8px 0 0 0' }}>AI-supported triage categories matching vital sign bounds</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', width: '1000px', marginBottom: '35px' }}>
          <div className="glass-card" style={{ padding: '30px', borderLeft: '6px solid #0047AB' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#0047AB', letterSpacing: '1px' }}>🟢 SAFE</span>
            <p style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 700, marginTop: '10px', lineHeight: 1.5 }}>
              Vital signs are currently within the configured safe range.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '30px', borderLeft: '6px solid #D9822B' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#D9822B', letterSpacing: '1px' }}>🟡 WARNING</span>
            <p style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 700, marginTop: '10px', lineHeight: 1.5 }}>
              Vital signs show an abnormal pattern that requires attention.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '30px', borderLeft: '6px solid #FF5E5E' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#FF5E5E', letterSpacing: '1px' }}>🔴 CRITICAL</span>
            <p style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 700, marginTop: '10px', lineHeight: 1.5 }}>
              Vital signs indicate a potentially serious condition requiring immediate clinical attention.
            </p>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, textAlign: 'center', maxWidth: '600px', lineHeight: 1.4 }}>
          ⚠️ <strong>Disclaimer:</strong> AI predictions are intended to assist healthcare professionals and are not a replacement for clinical judgment.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, position: 'relative', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}>
        <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>NAVAAYU SYSTEM</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>2026 @AKESISPROTOCOL All Rights Reserved</span>
      </footer>
    </div>
  );
}

function LoginForm({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (password === '1234') {
      onLogin();
    } else {
      setAuthError("Invalid Secure Password. Hint: Use 1234");
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', overflow: 'hidden', position: 'relative', boxSizing: 'border-box' }}>
      <FloatingBackground />

      <div className="glass-card" style={{ width: '420px', padding: '50px 40px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative', zIndex: 10 }}>
        {/* Back button */}
        <button 
          onClick={onBack}
          style={{ position: 'absolute', left: '30px', top: '30px', background: 'rgba(47, 65, 86, 0.05)', border: 'none', color: 'var(--primary)', fontWeight: 900, cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Back to Landing Page"
        >
          ←
        </button>

        <div style={{ fontSize: '50px', marginBottom: '20px', filter: 'drop-shadow(0 10px 15px rgba(69, 131, 147, 0.1))' }}>👶</div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px', letterSpacing: '-0.5px', color: 'var(--primary)' }}>NAVAAYU</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Secure Monitoring Access
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>CLINICAL USERNAME</label>
            <input 
              type="text" 
              placeholder="Enter secure ID / email"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', height: '52px', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0 16px', background: 'rgba(255,255,255,0.6)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>SECURE ACCESS PIN</label>
            <input 
              type="password" 
              placeholder="••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', height: '52px', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0 16px', background: 'rgba(255,255,255,0.6)', color: 'var(--text-main)', fontWeight: 700, fontSize: '16px', letterSpacing: '4px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="vibrant-btn" 
            style={{ width: '100%', height: '56px', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(0, 71, 171, 0.15)', border: 'none', borderRadius: '12px', cursor: 'pointer', background: '#0047AB', color: 'white', marginTop: '10px' }}
          >
            LOGIN
          </button>

          {authError && (
            <div style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: 800, textAlign: 'center', marginTop: '10px' }}>
              {authError}
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800, textAlign: 'center', margin: '20px 0 0 0', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
            🔑 <strong>Demo Password: 1234</strong>
          </p>
        </form>
      </div>
    </div>
  );
}

export default App;