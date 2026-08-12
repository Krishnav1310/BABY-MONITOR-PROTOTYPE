import { useState, useEffect, useRef } from 'react';
import { 
  Bell, Activity, Heart, Wind, Zap, Sliders, LayoutGrid, Volume2, VolumeX, 
  HeartPulse, Baby, Info, Menu, X, Monitor
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const getClinicalGuidance = (status: string, reasons: string[]) => {
  const conditions: string[] = [];
  const actions: string[] = [];
  
  if (status === 'NORMAL') return { conditions: [], actions: [] };
  
  let hasResp = false;
  let hasTempHigh = false;
  let hasTempLow = false;
  let hasCardio = false;
  let hasApgar = false;
  let hasWeight = false;
  let hasReflex = false;
  
  reasons.forEach(r => {
    const lower = r.toLowerCase();
    if (lower.includes('respiratory') || lower.includes('oxygen') || lower.includes('spo2') || lower.includes('apnea')) {
      hasResp = true;
    }
    if (lower.includes('temperature') || lower.includes('temp')) {
      if (lower.includes('high') || r.includes('⬆')) {
        hasTempHigh = true;
      } else {
        hasTempLow = true;
      }
    }
    if (lower.includes('heart') || lower.includes('bp') || lower.includes('rate') || lower.includes('pressure') || lower.includes('mean bp')) {
      hasCardio = true;
    }
    if (lower.includes('apgar')) {
      hasApgar = true;
    }
    if (lower.includes('weight')) {
      hasWeight = true;
    }
    if (lower.includes('reflex')) {
      hasReflex = true;
    }
  });
  
  if (hasResp) conditions.push("Possible respiratory compromise");
  if (hasTempHigh) conditions.push("Possible fever / hyperthermia");
  if (hasTempLow) conditions.push("Possible hypothermia / cold stress");
  if (hasCardio) conditions.push("Cardiovascular distress / perfusion risk");
  if (hasApgar) conditions.push("Neonatal depression / distress");
  if (hasWeight) conditions.push("Low birth weight / nutritional risk");
  if (hasReflex) conditions.push("Neurological depression");
  
  if (conditions.length === 0) {
    conditions.push(status === 'MODERATE' ? "Subtle physiological trend deviation" : "Significant vital deviation");
  }
  
  if (status === 'MODERATE') {
    actions.push("Repeat and monitor abnormal vital signs.");
    actions.push("Seek clinical assessment if abnormalities persist.");
  } else if (status === 'CRITICAL') {
    actions.push("Immediate clinical intervention required.");
    actions.push("Notify neonatologist on duty immediately.");
    actions.push("Verify sensor placement and double check vitals manually.");
  }
  
  return { conditions, actions };
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Trigger Vercel Build - Redesign Colors
// Global CSS styles injection for Color Hunt warm professional neonatal ward theme
const stylesHtml = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --bg-dark: #E0ECDE;            /* Light Sage backdrop */
    --card-bg: #ffffff;            /* Solid flat cards */
    --border-color: #CDE0C9;       /* Soft Sage outline border */
    --primary: #2C6975;            /* Deep Teal headers/primary layout */
    --primary-glow: rgba(44, 105, 117, 0.08);
    --mint: #68B2A0;               /* Teal for normal status */
    --accent: #d97706;             /* Amber for warning status */
    --secondary: #e11d48;          /* Rose for critical alerts */
    --text-main: #2C6975;          /* Deep Teal page text */
    --text-muted: #68B2A0;         /* Teal page subtext */
  }

  body {
    background-color: var(--bg-dark);
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .technical-value {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 500;
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

  /* Premium Landing Page Styles */
  .landing-nav-item {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-main);
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .landing-nav-item:hover {
    background: rgba(44, 105, 117, 0.05);
    color: var(--primary);
  }
  .landing-nav-item.active {
    background: rgba(44, 105, 117, 0.08);
    color: var(--primary);
  }
  .landing-btn-primary {
    padding: 14px 28px;
    font-size: 13.5px;
    font-weight: 800;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(44, 105, 117, 0.25);
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .landing-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(44, 105, 117, 0.35);
  }
  .landing-btn-secondary {
    padding: 14px 28px;
    font-size: 13.5px;
    font-weight: 800;
    background: rgba(44, 105, 117, 0.04);
    color: var(--primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .landing-btn-secondary:hover {
    background: rgba(44, 105, 117, 0.08);
    transform: translateY(-2px);
  }
  .landing-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding: 30px;
    box-shadow: 0 8px 24px rgba(44, 105, 117, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .landing-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(44, 105, 117, 0.08);
    border-color: var(--mint);
  }
  .param-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(44, 105, 117, 0.06);
    color: var(--primary);
  }
  @keyframes revealSoft {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal-animate {
    animation: revealSoft 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Incubator Grid and Sensor Pulse Keyframes */
  @keyframes panGrid {
    from { background-position: 0 0; }
    to { background-position: 40px 40px; }
  }
  .incubator-grid {
    background-image: 
      linear-gradient(to right, rgba(44, 105, 117, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(44, 105, 117, 0.04) 1px, transparent 1px);
    background-size: 20px 20px;
    animation: panGrid 8s linear infinite;
  }
  @keyframes pulseSensorHR {
    0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.6); }
    70% { box-shadow: 0 0 0 8px rgba(225, 29, 72, 0); }
    100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
  }
  @keyframes pulseSensorMint {
    0% { box-shadow: 0 0 0 0 rgba(104, 178, 160, 0.6); }
    70% { box-shadow: 0 0 0 8px rgba(104, 178, 160, 0); }
    100% { box-shadow: 0 0 0 0 rgba(104, 178, 160, 0); }
  }
  @keyframes pulseSensorAccent {
    0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.6); }
    70% { box-shadow: 0 0 0 8px rgba(217, 119, 6, 0); }
    100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
  }
  .pulse-hr {
    animation: pulseSensorHR 1.5s infinite;
  }
  .pulse-mint {
    animation: pulseSensorMint 1.5s infinite;
  }
  .pulse-accent {
    animation: pulseSensorAccent 1.5s infinite;
  }

  /* Aurora Mesh Gradient & Baby Breathing Keyframes */
  @keyframes floatBlob1 {
    0% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(60px, -80px) scale(1.15); }
    100% { transform: translate(-30px, 40px) scale(0.9); }
  }
  @keyframes floatBlob2 {
    0% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(-80px, 60px) scale(1.1); }
    100% { transform: translate(50px, -30px) scale(0.95); }
  }
  @keyframes babyBreathing {
    0% { transform: scale(1); }
    50% { transform: scale(1.025); }
    100% { transform: scale(1); }
  }
  .breathing-baby {
    transform-origin: 135px 115px;
    animation: babyBreathing 2s infinite ease-in-out;
  }

  /* --- Premium Animations Extension --- */
  .scroll-reveal-item {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .scroll-reveal-item.revealed {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  /* Staggered entrance animations for hero */
  .hero-entrance-logo {
    opacity: 0;
    transform: translateY(10px);
    animation: heroReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
  }
  .hero-entrance-title {
    opacity: 0;
    transform: translateY(15px);
    animation: heroReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
  }
  .hero-entrance-desc {
    opacity: 0;
    transform: translateY(15px);
    animation: heroReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
  }
  .hero-entrance-ctas {
    opacity: 0;
    transform: translateY(10px);
    animation: heroReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
  }
  .hero-entrance-visual {
    opacity: 0;
    transform: scale(0.97) translateY(10px);
    animation: heroRevealScale 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
  }

  @keyframes heroReveal {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroRevealScale {
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Micro animations */
  @keyframes pulseSubtle {
    0% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
  }
  .micro-heartbeat {
    display: inline-block;
    animation: pulseSubtle 1.2s infinite ease-in-out;
  }
  .micro-pulse-spo2 {
    display: inline-block;
    animation: pulseSubtle 1.6s infinite ease-in-out;
  }
  .micro-temp {
    display: inline-block;
    animation: pulseSubtle 2.2s infinite ease-in-out;
  }
  .micro-lungs {
    display: inline-block;
    animation: pulseSubtle 1.8s infinite ease-in-out;
  }
  .micro-bp {
    display: inline-block;
    animation: pulseSubtle 2.5s infinite ease-in-out;
  }

  /* Telemetry ECG Wave Sweep animation */
  .telemetry-wave-path {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: waveSweep 4s linear infinite;
  }
  .telemetry-resp-path {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: respSweep 6s linear infinite;
  }

  @keyframes waveSweep {
    to { stroke-dashoffset: 0; }
  }
  @keyframes respSweep {
    to { stroke-dashoffset: 0; }
  }

  /* Signal line path connection animation for How Akesis Works */
  .data-flow-track {
    position: absolute;
    top: 50%;
    left: 10%;
    right: 10%;
    height: 1px;
    background: rgba(44, 105, 117, 0.08);
    transform: translateY(-50%);
    z-index: 1;
  }
  .data-flow-signal {
    position: absolute;
    top: 50%;
    left: 10%;
    width: 6px;
    height: 6px;
    background: var(--mint);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px var(--mint), 0 0 4px var(--mint);
    z-index: 1;
    animation: signalFlow 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes signalFlow {
    0% { left: 10%; opacity: 0; }
    5% { opacity: 1; }
    90% { opacity: 1; }
    95% { left: 90%; opacity: 0; }
    100% { left: 90%; opacity: 0; }
  }

  /* Hover glow card container for neonatal_incubator_baby image */
  .hero-monitoring-container {
    box-shadow: 0 20px 40px rgba(44, 105, 117, 0.08);
    transition: all 0.5s ease;
  }
  .hero-monitoring-container:hover {
    box-shadow: 0 24px 50px rgba(104, 178, 160, 0.15);
    transform: translateY(-2px);
    border-color: rgba(104, 178, 160, 0.3) !important;
  }

  /* Specific indicators parameter list glow badges */
  .param-badge {
    transition: all 0.3s ease;
  }
  .param-badge:hover {
    background: rgba(104, 178, 160, 0.12);
    color: var(--mint);
  }

  /* Accessibility support */
  @media (prefers-reduced-motion: reduce) {
    .scroll-reveal-item,
    .hero-entrance-logo,
    .hero-entrance-title,
    .hero-entrance-desc,
    .hero-entrance-ctas,
    .hero-entrance-visual,
    .micro-heartbeat,
    .micro-pulse-spo2,
    .micro-temp,
    .micro-lungs,
    .micro-bp,
    .telemetry-wave-path,
    .telemetry-resp-path,
    .data-flow-signal,
    .breathing-baby,
    .hero-monitoring-container {
      animation: none !important;
      transition: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
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

        // Draw Node 1 (Teal)
        ctx.beginPath();
        ctx.arc(x1, y, r1, 0, Math.PI * 2);
        ctx.fillStyle = z1 > 0 ? '#68B2A0' : '#CDE0C9';
        ctx.fill();

        // Draw Node 2 (Deep Teal)
        ctx.beginPath();
        ctx.arc(x2, y, r2, 0, Math.PI * 2);
        ctx.fillStyle = z2 > 0 ? '#2C6975' : '#CDE0C9';
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

      // Render Light Sage backdrop directly in canvas to ensure contrast remains clear
      ctx.fillStyle = 'rgba(224, 236, 222, 0.98)';
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
          const distSq = Math.pow(particles[i].x - particles[j].x, 2) + Math.pow(particles[i].y - particles[j].y, 2) + Math.pow(particles[i].z - particles[j].z, 2);

          if (distSq < 160 * 160) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / 160) * 0.10;
            
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.strokeStyle = `rgba(104, 178, 160, ${alpha})`; // Teal connection paths
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
          const alpha = 0.10 + (1 - (proj.z + 400) / 800) * 0.15;
          ctx.fillStyle = `rgba(104, 178, 160, ${alpha})`; // Teal nodes
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

const CLINICAL_HISTORY_CONTEXT: Record<string, { maternalHistory: string, maternalFever: 'Yes' | 'No' | 'Not recorded' | string, deliveryType: string, previousEvents: string, previousMonitoring: string }> = {
  "NB-2026-001": {
    maternalHistory: "Gestational diabetes controlled",
    maternalFever: "No",
    deliveryType: "C-section (38 weeks)",
    previousEvents: "No previous abnormal events",
    previousMonitoring: "Stable since admission"
  },
  "NB-2026-002": {
    maternalHistory: "Normal prenatal screenings",
    maternalFever: "No",
    deliveryType: "Normal Vaginal Delivery (37 weeks)",
    previousEvents: "Mild transient tachypnea resolved within 6h",
    previousMonitoring: "Generally stable"
  },
  "NB-2026-003": {
    maternalHistory: "Suspected chorioamnionitis",
    maternalFever: "Yes (Intrapartum temp 38.2°C)",
    deliveryType: "Emergency C-section (39 weeks)",
    previousEvents: "Post-natal heart rate instability",
    previousMonitoring: "Attention required - closely monitoring temperature"
  },
  "NB-2026-004": {
    maternalHistory: "Chronic hypertension",
    maternalFever: "Not recorded",
    deliveryType: "C-section (38 weeks)",
    previousEvents: "No abnormal events",
    previousMonitoring: "Stable"
  },
  "NB-2026-005": {
    maternalHistory: "Pre-eclampsia mild",
    maternalFever: "No",
    deliveryType: "Normal Vaginal Delivery (36 weeks)",
    previousEvents: "Apgar scores 8/9",
    previousMonitoring: "Stable, mild preterm tracking"
  }
};

// Clinically validated real-time Bedside ECG Waveform component
function BedsideWaveform({ heartRate, statusColor }: { heartRate: number; statusColor: string }) {
  const [data, setData] = useState<{ x: number; y: number }[]>(() => {
    return Array.from({ length: 80 }, (_, i) => ({ x: i, y: 0 }));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const timeSec = Date.now() / 1000;
      const ecgVal = getContinuousECG(timeSec, heartRate);
      setData(prev => {
        return [...prev.slice(1), { x: timeSec, y: ecgVal }];
      });
    }, 40);
    return () => clearInterval(timer);
  }, [heartRate]);

  return (
    <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', height: '90px', display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '4px' }}>Live Bedside Waveform (ECG Beating Rhythm)</div>
      <div style={{ height: '54px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="y" stroke={statusColor} fill="transparent" strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Beds Overview' | 'Focused Telemetry' | 'Alerts' | 'Trends' | 'Settings' | 'About'>('Beds Overview');
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
      vitals: { heartRate: 135, respRate: 38, spo2: 98, temp: 36.7, bp: 41 },
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
      vitals: { heartRate: 142, respRate: 40, spo2: 95, temp: 36.9, bp: 40 },
      reasons: [],
      predictionScore: 94
    },
    {
      id: "NB-2026-003",
      babyId: "NB-2026-003",
      incubatorId: "NICU-003",
      age: "2 days old",
      weight: "2.0 kg",
      gestationalAge: "39 weeks",
      status: "MODERATE",
      simulationMode: "off",
      isLiveSource: false,
      lastUpdated: "--:--:--",
      vitals: { heartRate: 152, respRate: 44, spo2: 93, temp: 37.2, bp: 32 },
      reasons: ["SpO₂: 93% ⬇️", "APGAR Score: 5 ⬇️", "Weight: 2.0 kg ⬇️", "Reflexes: Abnormal ⬇️", "Mean BP: 32 mmHg ⬇️"],
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
      vitals: { heartRate: 130, respRate: 36, spo2: 98, temp: 36.6, bp: 42 },
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
      vitals: { heartRate: 138, respRate: 39, spo2: 93, temp: 36.8, bp: 38 },
      reasons: [],
      predictionScore: 97
    }
  ]);
  const [babyHistories, setBabyHistories] = useState<Record<string, { time: string; heartRate: number; spo2: number; temp?: number; respRate?: number; bp?: number }[]>>({});

  const prevStatusesRef = useRef<Record<string, string>>({});
  const notifiedWarningRef = useRef<Record<string, boolean>>({});
  const liveBabiesRef = useRef<any[]>([]);

  // Sync liveBabiesRef with state to prevent ECG timer interruptions
  useEffect(() => {
    liveBabiesRef.current = liveBabies;
  }, [liveBabies]);



  const getParameterTrend = (babyId: string, paramKey: 'heartRate' | 'spo2' | 'temp' | 'respRate' | 'bp', currentValue: number) => {
    const history = babyHistories[babyId];
    if (!history || history.length < 2) return 'Trend unavailable';
    const prevEntry = history[history.length - 2] as any;
    if (!prevEntry) return 'Trend unavailable';
    const prevValue = prevEntry[paramKey];
    if (prevValue === undefined) return 'Trend unavailable';
    if (currentValue > prevValue) return '↑ Increasing';
    if (currentValue < prevValue) return '↓ Decreasing';
    return '→ Stable';
  };

  const cleanReasonString = (reason: string) => {
    let clean = reason
      .replace(/[^a-zA-Z0-9\s:%\.\/↑↓⬇⬆₂]/g, '')
      .trim();
      
    if (clean.includes('High') && !clean.includes('↑')) {
      clean += ' ↑';
    } else if (clean.includes('Low') && !clean.includes('↓')) {
      clean += ' ↓';
    } else if (clean.includes('Abnormal') && !clean.includes('↓')) {
      clean += ' ↓';
    }
    
    return clean
      .replace(/⬇/g, '↓')
      .replace(/⬆/g, '↑')
      .trim();
  };

  const getSpO2Range = (gestationalAge: string) => {
    const weeks = parseInt(gestationalAge?.replace(/\D/g, '')) || 38;
    return weeks < 37 
      ? { min: 90, max: 95, text: "90-95% (Preterm Target)" }
      : { min: 92, max: 98, text: "92-98% (Term Target)" };
  };

  const isSpO2Abnormal = (spo2: number, gestationalAge: string) => {
    if (!spo2) return false;
    const range = getSpO2Range(gestationalAge);
    return spo2 < range.min || spo2 > range.max;
  };

  const getTempStatus = (temp: number) => {
    if (!temp) return { text: "Unknown", color: 'var(--text-main)', isAbnormal: false };
    if (temp < 32.0) return { text: "Severe Hypothermia", color: 'var(--secondary)', isAbnormal: true };
    if (temp <= 35.9) return { text: "Moderate Hypothermia", color: 'var(--secondary)', isAbnormal: true };
    if (temp <= 36.4) return { text: "Cold Stress / Mild Hypo", color: 'var(--accent)', isAbnormal: true };
    if (temp <= 37.5) return { text: "Normal", color: 'var(--text-main)', isAbnormal: false };
    return { text: "Hyperthermia", color: 'var(--secondary)', isAbnormal: true };
  };

  const getTrendSymbol = (babyId: string, paramKey: 'heartRate' | 'spo2' | 'temp' | 'respRate' | 'bp', currentValue: number) => {
    const trend = getParameterTrend(babyId, paramKey, currentValue);
    if (trend.includes('↑')) return '↑';
    if (trend.includes('↓')) return '↓';
    if (trend.includes('→')) return '→';
    return '';
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


  // Local Micro-Fluctuation Timer (runs every 500ms for continuous updates across all cards)
  useEffect(() => {
    if (!isAuthenticated || liveBabies.length === 0) return;

    const timer = setInterval(() => {
      setLiveBabies(prev => {
        return prev.map((baby: any) => {
          if (baby.isLiveSource) {
            // Keep exact live vitals from PC2, no false fluctuations!
            return baby;
          }
          const base = baby.baseVitals || baby.vitals;
          
          // Add micro-noise (+/- 1 or 2) around the baseline polled from PC2
          const hrNoise = Math.round((Math.random() - 0.5) * 3);
          const respNoise = Math.round((Math.random() - 0.5) * 2);
          const spo2Noise = Math.round((Math.random() - 0.5) * 1.2);
          const tempNoise = parseFloat(((Math.random() - 0.5) * 0.2).toFixed(1));
          const bpNoise = Math.round((Math.random() - 0.5) * 1.5);

          return {
            ...baby,
            vitals: {
              heartRate: Math.max(60, Math.min(220, base.heartRate + hrNoise)),
              respRate: Math.max(15, Math.min(100, base.respRate + respNoise)),
              spo2: Math.max(50, Math.min(100, base.spo2 + spo2Noise)),
              temp: parseFloat(Math.max(34, Math.min(42, base.temp + tempNoise)).toFixed(1)),
              bp: Math.max(20, Math.min(120, (base.bp || 40) + bpNoise))
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

  // 1. Data Polling from PC2 Edge AI (1 second polling interval for true real-time updates)
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      let mappedBabies: any[] = [];

      if (isDemoMode) {
        // Run Simulated Demo Mode Updates locally when PC1/PC2 are bypassed
        setIsBackendOnline(false);
        mappedBabies = liveBabies.map((baby: any) => {
          const seed = parseInt(baby.id.replace(/\D/g, '')) || 1;
          const timeOffset = Date.now() / 4000 + seed;
          
          let hr = baby.vitals.heartRate;
          let spo2 = baby.vitals.spo2;
          let temp = baby.vitals.temp;
          let resp = baby.vitals.respRate;
          const gestationalWeeks = parseInt(baby.gestationalAge) || 38;
          let bp = baby.vitals.bp || gestationalWeeks + 3;
          let status = baby.status;
          let score = baby.predictionScore;
          let reasons: string[] = [];
          
          if (baby.id === 'NB-2026-003') {
            status = 'MODERATE';
            score = 71;
            hr = Math.round(152 + Math.sin(timeOffset) * 6 + Math.random() * 2);
            spo2 = Math.round(91 + Math.sin(timeOffset) * 1 + Math.random() * 1);
            temp = parseFloat((37.8 + Math.sin(timeOffset) * 0.1).toFixed(1));
            resp = Math.round(52 + Math.sin(timeOffset) * 2);
            bp = Math.round(32 + Math.sin(timeOffset) * 2 + Math.random() * 1);
            reasons = [
              `SpO₂: ${spo2}% ⬇️`, 
              `Heart Rate: ${hr} bpm ⬆️`,
              "APGAR Score: 5 ⬇️",
              "Weight: 2.0 kg ⬇️",
              "Reflexes: Abnormal ⬇️",
              `Mean BP: ${bp} mmHg ⬇️`
            ];
          } else if (baby.id === 'NB-2026-005' && Math.sin(timeOffset) > 0.75) {
            status = 'MODERATE';
            score = 74;
            hr = Math.round(156 + Math.random() * 4);
            spo2 = Math.round(93 - Math.random() * 1);
            temp = 37.4;
            resp = 48;
            bp = Math.round(gestationalWeeks + 2 + Math.random() * 1);
            reasons = [`SpO₂: ${spo2}% ⬇️`];
          } else {
            status = 'NORMAL';
            score = Math.round(90 + Math.sin(timeOffset) * 5);
            hr = Math.round(135 + Math.sin(timeOffset) * 4 + Math.random() * 2);
            const isPreterm = parseInt(baby.gestationalAge) < 37;
            spo2 = isPreterm 
              ? Math.round(93 + Math.sin(timeOffset) * 1)
              : Math.round(96 + Math.sin(timeOffset) * 1);
            temp = parseFloat((36.7 + Math.sin(timeOffset) * 0.05 + Math.random() * 0.05).toFixed(1));
            resp = Math.round(38 + Math.sin(timeOffset) * 1 + Math.random() * 1);
            bp = Math.round(gestationalWeeks + 3 + Math.sin(timeOffset) * 1.5 + Math.random() * 1);
          }
          
          return {
            ...baby,
            status,
            predictionScore: score,
            reasons,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            vitals: { heartRate: hr, respRate: resp, spo2, temp, bp }
          };
        });
      } else {
        // Normal Active Backend Polling
                try {
          const res = await fetch(`${API_BASE_URL}/latest`);
          if (!res.ok) throw new Error("PC2 Edge AI Connection Failed");
          const json = await res.json();
          const isSuccess = json.success === true || json.status === "success";
          const babiesArray = json.babies || json.results;
          if (!isSuccess || !babiesArray) throw new Error("Invalid API Response");

          const babiesInfo: Record<string, any> = {
            "NB-2026-001": { babyId: "NB-2026-001", incubatorId: "NICU-001", age: "3 days old", weight: "3.2 kg", gestationalAge: "38 weeks" },
            "NICU_001": { babyId: "NB-2026-001", incubatorId: "NICU-001", age: "3 days old", weight: "3.2 kg", gestationalAge: "38 weeks" },
            "NB-2026-002": { babyId: "NB-2026-002", incubatorId: "NICU-002", age: "5 days old", weight: "2.9 kg", gestationalAge: "37 weeks" },
            "NICU_002": { babyId: "NICU-002", incubatorId: "NICU-002", age: "5 days old", weight: "2.9 kg", gestationalAge: "37 weeks" },
            "NB-2026-003": { babyId: "NB-2026-003", incubatorId: "NICU-003", age: "2 days old", weight: "3.1 kg", gestationalAge: "39 weeks" },
            "NICU_003": { babyId: "NICU-003", incubatorId: "NICU-003", age: "2 days old", weight: "3.1 kg", gestationalAge: "39 weeks" },
            "NB-2026-004": { babyId: "NB-2026-004", incubatorId: "NICU-004", age: "6 days old", weight: "3.4 kg", gestationalAge: "38 weeks" },
            "NICU_004": { babyId: "NICU-004", incubatorId: "NICU-004", age: "6 days old", weight: "3.4 kg", gestationalAge: "38 weeks" },
            "NB-2026-005": { babyId: "NB-2026-005", incubatorId: "NICU-005", age: "4 days old", weight: "2.7 kg", gestationalAge: "36 weeks" },
            "NICU_005": { babyId: "NICU-005", incubatorId: "NICU-005", age: "4 days old", weight: "2.7 kg", gestationalAge: "36 weeks" }
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

          const baselineBeds = [
            { id: "NB-2026-001", babyId: "NB-2026-001", incubatorId: "NICU-001", age: "3 days old", weight: "3.2 kg", gestationalAge: "38 weeks", defaultVitals: { heartRate: 140, respRate: 40, spo2: 97, temp: 36.8, bp: 41 } },
            { id: "NB-2026-002", babyId: "NB-2026-002", incubatorId: "NICU-002", age: "5 days old", weight: "2.9 kg", gestationalAge: "37 weeks", defaultVitals: { heartRate: 138, respRate: 36, spo2: 96, temp: 36.6, bp: 40 } },
            { id: "NB-2026-003", babyId: "NB-2026-003", incubatorId: "NICU-003", age: "2 days old", weight: "3.1 kg", gestationalAge: "39 weeks", defaultVitals: { heartRate: 152, respRate: 44, spo2: 93, temp: 37.2, bp: 32 }, defaultReasons: ["SpO₂: 93% ⬇️", "APGAR Score: 5 ⬇️", "Weight: 2.0 kg ⬇️", "Reflexes: Abnormal ⬇️", "Mean BP: 32 mmHg ⬇️"] },
            { id: "NB-2026-004", babyId: "NB-2026-004", incubatorId: "NICU-004", age: "6 days old", weight: "3.4 kg", gestationalAge: "38 weeks", defaultVitals: { heartRate: 132, respRate: 38, spo2: 98, temp: 36.9, bp: 41 } },
            { id: "NB-2026-005", babyId: "NB-2026-005", incubatorId: "NICU-005", age: "4 days old", weight: "2.7 kg", gestationalAge: "36 weeks", defaultVitals: { heartRate: 148, respRate: 46, spo2: 95, temp: 37.1, bp: 39 } }
          ];

          mappedBabies = baselineBeds.map((bed: any) => {
            const apiBaby = babiesArray.find((b: any) => {
              const staticInfo = getStaticInfo(b.baby_id);
              return staticInfo && staticInfo.babyId === bed.id;
            });

            if (apiBaby) {
              let hr = apiBaby.vitals?.heart_rate_bpm ? Math.round(apiBaby.vitals.heart_rate_bpm) : 0;
              let resp = apiBaby.vitals?.respiratory_rate_bpm ? Math.round(apiBaby.vitals.respiratory_rate_bpm) : 0;
              let spo2 = apiBaby.vitals?.oxygen_saturation ? Math.round(apiBaby.vitals.oxygen_saturation) : 0;
              let temp = apiBaby.vitals?.temperature_c ? parseFloat(apiBaby.vitals.temperature_c.toFixed(1)) : 0;
              
              const status = apiBaby.status || "NORMAL";

              const gestationalWeeks = parseInt(bed.gestationalAge) || 38;
              
              let bpVal = apiBaby.vitals?.bp ?? apiBaby.vitals?.blood_pressure ?? apiBaby.vitals?.mean_bp ?? apiBaby.vitals?.blood_pressure_mmHg ?? apiBaby.bp ?? apiBaby.blood_pressure ?? apiBaby.mean_bp ?? apiBaby.blood_pressure_mmHg;
              
              let bp = 0;
              if (bpVal !== undefined && bpVal !== null) {
                if (typeof bpVal === 'number') {
                  bp = Math.round(bpVal);
                } else if (typeof bpVal === 'string') {
                  if (bpVal.includes('/')) {
                    const parts = bpVal.split('/');
                    const sys = parseInt(parts[0]);
                    const dia = parseInt(parts[1]);
                    if (!isNaN(sys) && !isNaN(dia)) {
                      bp = Math.round(dia + (sys - dia) / 3);
                    }
                  } else {
                    const parsed = parseInt(bpVal);
                    if (!isNaN(parsed)) bp = parsed;
                  }
                }
              } else {
                const sys = apiBaby.vitals?.systolic_bp ?? apiBaby.vitals?.systolic;
                const dia = apiBaby.vitals?.diastolic_bp ?? apiBaby.vitals?.diastolic;
                if (sys !== undefined && dia !== undefined && sys !== null && dia !== null) {
                  bp = Math.round(dia + (sys - dia) / 3);
                }
              }
              
              if (!bp) {
                bp = bed.defaultVitals.bp;
              }

              let parsedScore = 90;
              const scoreVal = apiBaby.prediction_score !== undefined ? apiBaby.prediction_score : (apiBaby.predictionScore !== undefined ? apiBaby.predictionScore : (apiBaby.at_risk_probability !== undefined ? apiBaby.at_risk_probability : 0));
              if (scoreVal !== undefined && scoreVal !== null) {
                parsedScore = scoreVal <= 1.0 ? Math.round(scoreVal * 100) : Math.round(scoreVal);
              }

              let lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              if (apiBaby.timestamp) {
                const date = new Date(apiBaby.timestamp * 1000);
                if (!isNaN(date.getTime())) {
                  lastUpdated = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
              }

              let reasons = apiBaby.reasons ? [...apiBaby.reasons] : [];
              if (bed.id === 'NB-2026-003' && bp < gestationalWeeks && !reasons.some((r: string) => r.includes('BP'))) {
                reasons.push(`Mean BP: ${bp} mmHg ⬇️`);
              }

              return {
                id: bed.id,
                babyId: bed.id,
                incubatorId: bed.incubatorId,
                age: bed.age,
                weight: apiBaby.vitals?.weight_kg !== undefined ? `${apiBaby.vitals.weight_kg} kg` : bed.weight,
                gestationalAge: bed.gestationalAge,
                status,
                simulationMode: 'off',
                isLiveSource: true, // Mark as receiving live readings from PC2
                lastUpdated,
                vitals: { 
                  heartRate: hr, 
                  respRate: resp, 
                  spo2, 
                  temp, 
                  bp,
                  apgar: apiBaby.vitals?.apgar_score,
                  reflexes: apiBaby.vitals?.reflexes_normal,
                  gender: apiBaby.vitals?.gender,
                  immunizations: apiBaby.vitals?.immunizations_done,
                  systolic: apiBaby.vitals?.systolic_bp,
                  diastolic: apiBaby.vitals?.diastolic_bp
                },
                conditions: apiBaby.possible_conditions || apiBaby.conditions || [],
                actions: apiBaby.recommended_actions || apiBaby.actions || [],
                reasons,
                predictionScore: parsedScore
              };
            } else {
              const seed = parseInt(bed.id.replace(/\D/g, '')) || 1;
              const timeOffset = Date.now() / 4000 + seed;

              let hr = bed.defaultVitals.heartRate;
              let spo2 = bed.defaultVitals.spo2;
              let temp = bed.defaultVitals.temp;
              let resp = bed.defaultVitals.respRate;
              let bp = bed.defaultVitals.bp;
              let status = bed.id === "NB-2026-003" ? "MODERATE" : "NORMAL";
              let score = bed.id === "NB-2026-003" ? 71 : 92;
              let reasons = bed.defaultReasons || [];

              if (bed.id === 'NB-2026-003') {
                hr = Math.round(152 + Math.sin(timeOffset) * 5 + Math.random() * 2);
                spo2 = Math.round(91 + Math.sin(timeOffset) * 1);
                temp = parseFloat((37.8 + Math.sin(timeOffset) * 0.1).toFixed(1));
                resp = Math.round(52 + Math.sin(timeOffset) * 1);
                bp = Math.round(32 + Math.sin(timeOffset) * 1.5 + Math.random() * 1);
              } else {
                hr = Math.round(bed.defaultVitals.heartRate + Math.sin(timeOffset) * 3);
                spo2 = Math.round(bed.defaultVitals.spo2 + Math.sin(timeOffset) * 0.5);
                temp = parseFloat((bed.defaultVitals.temp + Math.sin(timeOffset) * 0.05).toFixed(1));
                resp = Math.round(bed.defaultVitals.respRate + Math.sin(timeOffset) * 1);
                bp = Math.round(bed.defaultVitals.bp + Math.sin(timeOffset) * 1);
              }

              return {
                id: bed.id,
                babyId: bed.id,
                incubatorId: bed.incubatorId,
                age: bed.age,
                weight: bed.weight,
                gestationalAge: bed.gestationalAge,
                status,
                simulationMode: 'off',
                isLiveSource: bed.id === selectedBabyId,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                vitals: { heartRate: hr, respRate: resp, spo2, temp, bp },
                conditions: bed.id === "NB-2026-003" ? ["Possible respiratory compromise"] : [],
                actions: bed.id === "NB-2026-003" ? ["Repeat and monitor abnormal vital signs.", "Seek clinical assessment if abnormalities persist."] : [],
                reasons,
                predictionScore: score
              };
            }
          });

          setIsBackendOnline(true);
          setError(null);
        } catch (err: any) {
          console.error("Polling Error:", err);
          setIsBackendOnline(false);
          setError(err.message);

          mappedBabies = liveBabies.map((baby: any) => {
            const seed = parseInt(baby.id.replace(/\D/g, '')) || 1;
            const timeOffset = Date.now() / 4000 + seed;
            
            let hr = baby.vitals.heartRate;
            let spo2 = baby.vitals.spo2;
            let temp = baby.vitals.temp;
            let resp = baby.vitals.respRate;
            const gestationalWeeks = parseInt(baby.gestationalAge) || 38;
            let bp = baby.vitals.bp || gestationalWeeks + 3;
            let status = baby.status;
            let score = baby.predictionScore;
            let reasons: string[] = [];

            if (baby.id === 'NB-2026-003') {
              status = 'MODERATE';
              score = 71;
              hr = Math.round(152 + Math.sin(timeOffset) * 5 + Math.random() * 2);
              spo2 = Math.round(91 + Math.sin(timeOffset) * 1);
              temp = parseFloat((37.8 + Math.sin(timeOffset) * 0.1).toFixed(1));
              resp = Math.round(52 + Math.sin(timeOffset) * 1);
              bp = Math.round(32 + Math.sin(timeOffset) * 1.5 + Math.random() * 1);
              reasons = [
                `SpO₂: ${spo2}% ⬇️`, 
                `Heart Rate: ${hr} bpm ⬆️`, 
                "APGAR Score: 5 ⬇️", 
                "Weight: 2.0 kg ⬇️", 
                "Reflexes: Abnormal ⬇️",
                `Mean BP: ${bp} mmHg ⬇️`
              ];
            } else if (baby.id === 'NB-2026-005' && Math.sin(timeOffset) > 0.75) {
              status = 'MODERATE';
              score = 74;
              hr = Math.round(156 + Math.random() * 4);
              spo2 = Math.round(93 - Math.random() * 1);
              temp = 37.4;
              resp = 48;
              bp = Math.round(gestationalWeeks + 1 + Math.random() * 1);
              reasons = [`SpO₂: ${spo2}% ⬇️`];
            } else {
              status = 'NORMAL';
              score = Math.round(90 + Math.sin(timeOffset) * 2);
              hr = Math.round(135 + Math.sin(timeOffset) * 4 + Math.random() * 2);
              const isPreterm = parseInt(baby.gestationalAge) < 37;
              spo2 = isPreterm 
                ? Math.round(93 + Math.sin(timeOffset) * 1)
                : Math.round(96 + Math.sin(timeOffset) * 1);
              temp = parseFloat((36.7 + Math.sin(timeOffset) * 0.05 + Math.random() * 0.05).toFixed(1));
              resp = Math.round(38 + Math.sin(timeOffset) * 1 + Math.random() * 1);
              bp = Math.round(gestationalWeeks + 3 + Math.sin(timeOffset) * 1 + Math.random() * 1);
            }

            const guidance = getClinicalGuidance(status, reasons);
            return {
              conditions: guidance.conditions,
              actions: guidance.actions,

              ...baby,
              status,
              predictionScore: score,
              reasons,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              vitals: { heartRate: hr, respRate: resp, spo2, temp, bp }
            };
          });
        }
      }

      if (mappedBabies.length > 0) {
        mappedBabies.forEach((baby: any) => {
          const prevStatus = prevStatusesRef.current[baby.id];
          if (prevStatus && prevStatus !== baby.status) {
            if (baby.status === 'CRITICAL' || baby.status === 'MODERATE') {
              if (!notifiedWarningRef.current[baby.id]) {
                const isCriticalTransition = baby.status === 'CRITICAL';
                const toastId = Date.now() + '-' + baby.id + '-' + Math.random().toString(36).substr(2, 9);
                
                setToasts(prev => [
                  ...prev,
                  {
                    id: toastId,
                    title: `Incubator ${baby.incubatorId} Warning Alert`,
                    message: `Risk classified as ${baby.status}. Urgent verification recommended.`,
                    type: isCriticalTransition ? 'critical' : 'warning'
                  }
                ]);
                
                setTimeout(() => {
                  setToasts(prev => prev.filter(t => t.id !== toastId));
                }, 5000);
                
                notifiedWarningRef.current[baby.id] = true;
              }
            } else if (baby.status === 'NORMAL') {
              notifiedWarningRef.current[baby.id] = false;
            }
          } else if (!prevStatus && (baby.status === 'CRITICAL' || baby.status === 'MODERATE')) {
            notifiedWarningRef.current[baby.id] = true;
          }
          prevStatusesRef.current[baby.id] = baby.status;
        });

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

        setBabyHistories(prev => {
          const updated = { ...prev };
          mappedBabies.forEach((b: any) => {
            const historyList = updated[b.id] || [];
            updated[b.id] = [...historyList.slice(-19), { time: b.lastUpdated, heartRate: b.vitals.heartRate, spo2: b.vitals.spo2, temp: b.vitals.temp, respRate: b.vitals.respRate, bp: b.vitals.bp }];
          });
          return updated;
        });

        const activeBabyObj = mappedBabies.find((b: any) => b.id === selectedBabyId) || mappedBabies[0] || {};
        const activeId = activeBabyObj.id || selectedBabyId;
        const totalModerate = mappedBabies.filter((b: any) => b.status === "MODERATE").length;
        const totalCritical = mappedBabies.filter((b: any) => b.status === "CRITICAL").length;

        const activeAlerts: any[] = [];
        mappedBabies.forEach((b: any) => {
          if (b.status === "CRITICAL" || b.status === "MODERATE") {
            const cleanedReasons = b.reasons.map(cleanReasonString);
            activeAlerts.push({
              id: b.id,
              type: b.status === "CRITICAL" ? "critical" : "warning",
              message: `Incubator ${b.incubatorId} Alert: ${cleanedReasons.length > 0 ? cleanedReasons.join(', ') : 'AI Warning State'}`,
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
      <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Glowing 3D Particle Background Network */}
        <ThreeDParticleBackground />

        <div style={{ height: '100vh', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        
        {/* Dynamic Toast Notifications */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`} style={{ position: 'relative' }}>
              <div style={{ fontSize: '20px' }}>{t.type === 'critical' ? '🚨' : t.type === 'warning' ? '⚠' : 'ℹ'}</div>
              <div style={{ paddingRight: '20px' }}>
                <div style={{ fontWeight: 900, fontSize: '12px', color: 'var(--text-main)' }}>{t.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.message}</div>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer', 
                  fontSize: '10px', 
                  fontWeight: 900,
                  opacity: 0.6,
                  padding: '4px'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              >
                ✕
              </button>
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
              <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: 'white' }}>AKESIS PROTOCOL</h1>
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
            <div className={`sidebar-item ${activeTab === 'Beds Overview' ? 'active' : ''}`} onClick={() => { setActiveTab('Beds Overview'); setIsSidebarOpen(false); }}>
              <LayoutGrid size={16} /> Beds Overview
            </div>
            <div className={`sidebar-item ${activeTab === 'Focused Telemetry' ? 'active' : ''}`} onClick={() => { setActiveTab('Focused Telemetry'); setIsSidebarOpen(false); }}>
              <Baby size={16} /> Focused Telemetry
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
              <div 
                className="modal-content" 
                onClick={e => e.stopPropagation()}
                style={{ 
                  width: '960px', 
                  maxWidth: '95vw', 
                  maxHeight: '92vh',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
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

                {/* Two-Column Landscape Layout */}
                <div style={{ display: 'flex', gap: '30px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  
                  {/* Left Column: Diagnostics & Vitals Grid */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Status & Confidence Banner */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(47, 65, 86, 0.04)', padding: '14px 20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>AI CLASSIFICATION</div>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: statusColor, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {isCritical ? '🚨' : isWarning ? '⚠️' : '●'} {baby.status}
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
                        <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.heartRate > 160 || baby.vitals?.heartRate < 100) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {baby.vitals?.heartRate} 
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>bpm</span>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: getTrendSymbol(baby.id, 'heartRate', baby.vitals?.heartRate) === '↑' ? 'var(--secondary)' : getTrendSymbol(baby.id, 'heartRate', baby.vitals?.heartRate) === '↓' ? 'var(--primary)' : 'var(--mint)', marginLeft: 'auto' }}>
                            {getTrendSymbol(baby.id, 'heartRate', baby.vitals?.heartRate)}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={10} color="var(--primary)" /> OXYGEN SATURATION</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: isSpO2Abnormal(baby.vitals?.spo2, baby.gestationalAge) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {baby.vitals?.spo2}%
                          <span style={{ fontSize: '14px', fontWeight: 900, color: getTrendSymbol(baby.id, 'spo2', baby.vitals?.spo2) === '↓' ? 'var(--secondary)' : 'var(--mint)', marginLeft: 'auto' }}>
                            {getTrendSymbol(baby.id, 'spo2', baby.vitals?.spo2)}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Sliders size={10} color="var(--mint)" /> TEMPERATURE</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: getTempStatus(baby.vitals?.temp).color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {baby.vitals?.temp}°C
                          <span style={{ fontSize: '14px', fontWeight: 900, color: getTrendSymbol(baby.id, 'temp', baby.vitals?.temp) === '→' ? 'var(--mint)' : 'var(--secondary)', marginLeft: 'auto' }}>
                            {getTrendSymbol(baby.id, 'temp', baby.vitals?.temp)}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={10} color="var(--primary)" /> RESPIRATORY RATE</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.respRate > 50 || baby.vitals?.respRate < 25) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {baby.vitals?.respRate}
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>/min</span>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: getTrendSymbol(baby.id, 'respRate', baby.vitals?.respRate) === '↑' ? 'var(--secondary)' : getTrendSymbol(baby.id, 'respRate', baby.vitals?.respRate) === '↓' ? 'var(--primary)' : 'var(--mint)', marginLeft: 'auto' }}>
                            {getTrendSymbol(baby.id, 'respRate', baby.vitals?.respRate)}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: 'rgba(47, 65, 86, 0.03)', borderRadius: '14px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={10} color="var(--secondary)" /> BLOOD PRESSURE (MEAN MAP)</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: (baby.vitals?.bp < (parseInt(baby.gestationalAge) || 38)) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {baby.vitals?.bp || '--'}
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>mmHg</span>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: getTrendSymbol(baby.id, 'bp', baby.vitals?.bp) === '↑' ? 'var(--secondary)' : getTrendSymbol(baby.id, 'bp', baby.vitals?.bp) === '↓' ? 'var(--primary)' : 'var(--mint)', marginLeft: 'auto' }}>
                            {getTrendSymbol(baby.id, 'bp', baby.vitals?.bp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Insights, Clinical Actions & ECG Waveform */}
                  <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Reasons, Conditions, and Actions List */}
                    {(() => {
                      const guidance = baby.conditions 
                        ? { conditions: baby.conditions, actions: baby.actions }
                        : getClinicalGuidance(baby.status, baby.reasons || []);
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Reasons for Attention */}
                          {baby.reasons && baby.reasons.length > 0 && (
                            <div style={{ padding: '14px', background: isCritical ? 'rgba(217, 83, 79, 0.04)' : 'rgba(197, 152, 40, 0.04)', border: `1px solid ${isCritical ? 'var(--secondary)' : 'var(--accent)'}`, borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '10px', fontWeight: 900, color: isCritical ? 'var(--secondary)' : 'var(--accent)', letterSpacing: '0.5px' }}>
                                {isCritical ? 'IMMEDIATE ATTENTION REQUIRED' : 'REASONS FOR ATTENTION'}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {baby.reasons.map((r: string, idx: number) => (
                                  <div key={idx} style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)' }}>• {cleanReasonString(r)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Possible Conditions */}
                          <div style={{ padding: '14px', background: 'rgba(47, 65, 86, 0.03)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                              POSSIBLE CONDITIONS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {guidance.conditions && guidance.conditions.length > 0 ? (
                                guidance.conditions.map((cond: string, idx: number) => (
                                  <div key={idx} style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)' }}>• {cond}</div>
                                ))
                              ) : (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                                  No clinical conditions flagged (Normal Status).
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions to be Taken */}
                          <div style={{ padding: '14px', background: isCritical ? 'rgba(217, 83, 79, 0.04)' : 'rgba(197, 152, 40, 0.04)', border: `1px solid ${isCritical ? 'var(--secondary)' : 'var(--accent)'}`, borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: isCritical ? 'var(--secondary)' : 'var(--accent)', letterSpacing: '0.5px' }}>
                              ACTIONS TO BE TAKEN
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {guidance.actions && guidance.actions.length > 0 ? (
                                guidance.actions.map((act: string, idx: number) => (
                                  <div key={idx} style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)' }}>➔ {act}</div>
                                ))
                              ) : (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                                  Continue standard NICU monitoring.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

<BedsideWaveform heartRate={baby.vitals?.heartRate || 140} statusColor={statusColor} />
                  </div>

                </div>
              </div>            );
          })()}
        </div>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, paddingBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="glass-card"
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--card-bg)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
              title="Open Akesis Control Panel"
            >
              <Menu size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: 'var(--primary)' }}>AKESIS PROTOCOL</h2>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: '2px 0 0 0', fontSize: '11px' }}>Neonatal AI Monitoring System</p>
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

        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '6px' }}>

          {/* Connection Error / Offline Warning Banner */}
          {!isBackendOnline && !isDemoMode && (
            <div style={{
              background: 'rgba(217, 83, 79, 0.08)',
              border: '1px solid var(--secondary)',
              borderRadius: '12px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--secondary)',
              fontSize: '11px',
              fontWeight: 800,
              flexShrink: 0
            }}>
              <span style={{ fontSize: '14px' }}>🚨</span>
              <span><strong>PC2 API OFFLINE:</strong> Clinician dashboard is displaying simulated offline baseline data. Vitals are not live from the Edge AI server. Please wake up the API or verify connection.</span>
            </div>
          )}

        {/* VIEW: MAIN DASHBOARD */}
        {activeTab === 'Focused Telemetry' && (() => {
          const activeBaby = liveBabies.find((b: any) => b.id === selectedBabyId) || liveBabies[0] || {};
          const isCritical = activeBaby.status === 'CRITICAL';
          const isWarning = activeBaby.status === 'MODERATE';
          const activeStatusColor = isCritical ? 'var(--secondary)' : (isWarning ? 'var(--accent)' : 'var(--mint)');
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, position: 'relative', zIndex: 10 }}>
              
              {/* Summary Stats Row */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', background: 'rgba(69, 131, 147, 0.1)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Baby size={18} /></div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>{liveBabies.length}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>Total Beds Monitored</div>
                  </div>
                </div>
                
                <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', border: (data?.totalModerate || 0) > 0 ? '1.5px solid var(--accent)' : '1px solid var(--border-color)' }}>
                  <div style={{ width: '38px', height: '38px', background: 'rgba(217, 130, 43, 0.1)', color: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={18} /></div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)' }}>{data?.totalModerate || 0}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>Moderate Cases</div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', border: (data?.totalCritical || 0) > 0 ? '1.5px solid var(--secondary)' : '1px solid var(--border-color)' }}>
                  <div style={{ width: '38px', height: '38px', background: 'rgba(255, 94, 94, 0.1)', color: 'var(--secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={18} /></div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--secondary)' }}>{data?.totalCritical || 0}</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>Critical Cases</div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', background: 'rgba(0, 71, 171, 0.1)', color: 'var(--mint)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Monitor size={18} /></div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--mint)' }}>{isDemoMode ? "99%" : isBackendOnline ? "98%" : "80%"}</div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Bed: {activeBaby.incubatorId}</h3>
                            <select 
                              value={selectedBabyId}
                              onChange={e => setSelectedBabyId(e.target.value)}
                              style={{ 
                                background: 'var(--card-bg)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px', 
                                padding: '6px 12px', 
                                fontSize: '12px', 
                                fontWeight: 800, 
                                color: 'var(--text-main)', 
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                              }}
                            >
                              {liveBabies.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                  {b.incubatorId} ({b.babyId})
                                </option>
                              ))}
                            </select>
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>AGE: {activeBaby.age} • WEIGHT: {activeBaby.weight} • GESTATION: {activeBaby.gestationalAge}</span>
                        </div>
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
                        <div style={{ fontSize: '28px', fontWeight: 900, color: isSpO2Abnormal(activeBaby.vitals?.spo2, activeBaby.gestationalAge) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.spo2 || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>%</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal: {getSpO2Range(activeBaby.gestationalAge).text}</span>
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
                        <div style={{ fontSize: '28px', fontWeight: 900, color: getTempStatus(activeBaby.vitals?.temp).color, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.temp || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>°C</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal: 36.5-37.5 °C • {getTempStatus(activeBaby.vitals?.temp).text}</span>
                      </div>

                      {/* BP Card */}
                      <div style={{ background: 'rgba(47, 65, 86, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>🩸 BLOOD PRESSURE (Mean BP)</span>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: (activeBaby.vitals?.bp < (parseInt(activeBaby.gestationalAge) || 38)) ? 'var(--secondary)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          {activeBaby.vitals?.bp || '--'}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>mmHg</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>Normal Target: &ge;{parseInt(activeBaby.gestationalAge) || 38} mmHg (Gestational Age)</span>
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
                          <Area type="monotone" dataKey="spo2" stroke="#2C6975" strokeWidth={2} fill="transparent" name="SpO₂ (%)" />
                          <Area type="monotone" dataKey="temp" stroke="var(--accent)" strokeWidth={1.5} fill="transparent" name="Temp (°C)" />
                          <Area type="monotone" dataKey="bp" stroke="var(--secondary)" strokeWidth={1.5} fill="transparent" name="Mean BP (mmHg)" />

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
                      🔍 Model Confidence: <strong>{isCritical ? '95' : isWarning ? '89' : '97'}%</strong>
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

                                    {/* PATIENT HISTORICAL TELEMETRY LOG */}
                  <div className="glass-card" style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Telemetry History Log</h3>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>
                          Recent vital records for Patient {activeBaby.babyId}
                        </p>
                      </div>
                      <span className="param-badge" style={{ background: 'rgba(44, 105, 117, 0.06)', color: 'var(--primary)', fontSize: '9px', fontWeight: 900 }}>
                        {activeBaby.incubatorId}
                      </span>
                    </div>
                    
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                            <th style={{ padding: '8px 6px' }}>TIME</th>
                            <th style={{ padding: '8px 6px' }}>HR</th>
                            <th style={{ padding: '8px 6px' }}>SpO₂</th>
                            <th style={{ padding: '8px 6px' }}>RESP</th>
                            <th style={{ padding: '8px 6px' }}>TEMP</th>
                            <th style={{ padding: '8px 6px' }}>BP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const historyLog = [...(babyHistories[activeBaby.id] || [])].reverse();
                            if (historyLog.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', opacity: 0.6, fontWeight: 700 }}>
                                    No telemetry records compiled yet.
                                  </td>
                                </tr>
                              );
                            }
                            return historyLog.map((log: any, i: number) => {
                              const isHRAbnormal = log.heartRate > 160 || log.heartRate < 100;
                              const isSpO2Abn = isSpO2Abnormal(log.spo2, activeBaby.gestationalAge);
                              const isRespAbn = log.respRate > 50 || log.respRate < 25;
                              const tempStat = getTempStatus(log.temp);
                              const isTempAbn = tempStat.text !== 'NORMAL';
                              const isBPAbn = log.bp < (parseInt(activeBaby.gestationalAge) || 38);

                              return (
                                <tr 
                                  key={i} 
                                  style={{ 
                                    borderBottom: '1px solid rgba(47, 65, 86, 0.04)', 
                                    fontWeight: 700,
                                    color: 'var(--text-main)'
                                  }}
                                >
                                  <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>{log.time}</td>
                                  <td style={{ padding: '8px 6px', color: isHRAbnormal ? 'var(--secondary)' : 'var(--text-main)', fontWeight: isHRAbnormal ? 900 : 700 }}>
                                    {log.heartRate}
                                  </td>
                                  <td style={{ padding: '8px 6px', color: isSpO2Abn ? 'var(--secondary)' : 'var(--text-main)', fontWeight: isSpO2Abn ? 900 : 700 }}>
                                    {log.spo2}%
                                  </td>
                                  <td style={{ padding: '8px 6px', color: isRespAbn ? 'var(--secondary)' : 'var(--text-main)', fontWeight: isRespAbn ? 900 : 700 }}>
                                    {log.respRate}
                                  </td>
                                  <td style={{ padding: '8px 6px', color: isTempAbn ? 'var(--secondary)' : 'var(--text-main)', fontWeight: isTempAbn ? 900 : 700 }}>
                                    {log.temp}°C
                                  </td>
                                  <td style={{ padding: '8px 6px', color: isBPAbn ? 'var(--secondary)' : 'var(--text-main)', fontWeight: isBPAbn ? 900 : 700 }}>
                                    {log.bp}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
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
        {activeTab === 'Beds Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Incubator Beds Directory</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, margin: '4px 0 0 0' }}>Overview of all monitored neonatal incubator beds in the ward</p>
            </div>
            
            {/* Grid of 3 Baby Cards (Max 3 per line with proper spacing and enlarged fonts) */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', alignItems: 'start' }}>
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
                    onClick={() => setExpandedBabyId(expandedBabyId === baby.id ? null : baby.id)}
                    style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease' }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: statusColor }}>{isCritical ? '🚨' : isWarning ? '⚠' : '●'}</span>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)' }}>{baby.incubatorId}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'white', background: statusColor, padding: '4px 12px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                        {baby.status}
                      </span>
                    </div>

                    {/* Center */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(44, 105, 117, 0.04)', border: `2px solid ${statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 900, fontSize: '20px' }}>
                        {getBedInitials(baby.id)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>Baby ID: {baby.babyId} • {baby.age}</div>
                    </div>

                    {/* Micro Vitals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ background: 'rgba(104, 178, 160, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>HEART RATE</span>
                          <span className="technical-value" style={{ color: (baby.vitals?.heartRate > 160 || baby.vitals?.heartRate < 100) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '16px' }}>
                            {baby.vitals?.heartRate || '--'}<span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>bpm</span>
                          </span>
                        </div>
                        <div style={{ background: 'rgba(104, 178, 160, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>OXYGEN (SpO₂)</span>
                          <span className="technical-value" style={{ color: isSpO2Abnormal(baby.vitals?.spo2, baby.gestationalAge) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '16px' }}>
                            {baby.vitals?.spo2 || '--'}<span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>%</span>
                          </span>
                        </div>
                        <div style={{ background: 'rgba(104, 178, 160, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>TEMPERATURE</span>
                          <span className="technical-value" style={{ color: getTempStatus(baby.vitals?.temp).color, fontSize: '16px' }}>
                            {baby.vitals?.temp || '--'}<span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>°C</span>
                          </span>
                        </div>
                        <div style={{ background: 'rgba(104, 178, 160, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>RESPIRATORY</span>
                          <span className="technical-value" style={{ color: (baby.vitals?.respRate > 50 || baby.vitals?.respRate < 25) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '16px' }}>
                            {baby.vitals?.respRate || '--'}<span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>/min</span>
                          </span>
                        </div>
                        <div style={{ background: 'rgba(104, 178, 160, 0.04)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>BLOOD PRESSURE</span>
                          <span className="technical-value" style={{ color: (baby.vitals?.bp < (parseInt(baby.gestationalAge) || 38)) ? 'var(--secondary)' : 'var(--text-main)', fontSize: '16px' }}>
                            {baby.vitals?.bp || '--'} <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '1px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>mmHg</span>
                          </span>
                        </div>

                      </div>


                    {/* EXPANDED SECTION DETAILS IN-PLACE */}
                    {/* EXPANDED SECTION DETAILS IN-PLACE */}
                    <div 
                      onClick={e => e.stopPropagation()}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '14px', 
                        maxHeight: expandedBabyId === baby.id ? '600px' : '0px', 
                        opacity: expandedBabyId === baby.id ? 1 : 0, 
                        overflow: 'hidden', 
                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)', 
                        borderTop: expandedBabyId === baby.id ? '1px solid var(--border-color)' : '0px solid transparent', 
                        paddingTop: expandedBabyId === baby.id ? '14px' : '0px', 
                        marginTop: expandedBabyId === baby.id ? '4px' : '0px' 
                      }}
                    >
                      
                      {/* Prediction reasoning */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CURRENT DIAGNOSTIC PREDICTION</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, color: statusColor, background: 'rgba(255,255,255,0.06)', border: `1px solid ${statusColor}`, padding: '4px 10px', borderRadius: '6px' }}>
                            {baby.status === 'CRITICAL' ? '🚨 CRITICAL RISK' : baby.status === 'MODERATE' ? '⚠️ ATTENTION REQUIRED' : '✅ SAFE / STABLE'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Contributing Factors:</span>
                          {baby.reasons && baby.reasons.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc', color: 'var(--text-main)' }}>
                              {baby.reasons.map((r: string, idx: number) => (
                                <li key={idx} style={{ margin: '2px 0', fontWeight: 700 }}>{cleanReasonString(r)}</li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ opacity: 0.6, fontSize: '10px' }}>Reason data unavailable</span>
                          )}
                        </div>
                      </div>

                      {/* Possible Conditions & Actions to be Taken from AI */}
                      {baby.status !== 'NORMAL' && (() => {
                        const guidance = baby.conditions 
                          ? { conditions: baby.conditions, actions: baby.actions }
                          : getClinicalGuidance(baby.status, baby.reasons || []);
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(44, 105, 117, 0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            {/* Possible Conditions */}
                            {guidance.conditions && guidance.conditions.length > 0 && (
                              <div>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>POSSIBLE CONDITIONS</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                  {guidance.conditions.map((cond: string, idx: number) => (
                                    <span key={idx} className="param-badge" style={{ fontSize: '10px', padding: '4px 10px', background: 'rgba(44, 105, 117, 0.06)', color: 'var(--primary)' }}>
                                      • {cond}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions to be Taken */}
                            {guidance.actions && guidance.actions.length > 0 && (
                              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ACTIONS TO BE TAKEN</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                  {guidance.actions.map((act: string, idx: number) => (
                                    <div key={idx} style={{ fontSize: '10.5px', fontWeight: 700, color: baby.status === 'CRITICAL' ? 'var(--secondary)' : 'var(--accent)' }}>
                                      ➔ {act}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Vitals Trends list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>LIVE TELEMETRY TRENDS</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', color: 'var(--text-muted)', fontSize: '9px' }}>
                            <span>PARAMETER</span>
                            <span>VALUE</span>
                            <span>TREND DIRECTION</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>Heart Rate</span>
                            <span className="technical-value" style={{ fontWeight: 700 }}>{baby.vitals?.heartRate || '--'} bpm</span>
                            <span style={{ fontWeight: 800, color: getParameterTrend(baby.id, 'heartRate', baby.vitals?.heartRate).includes('↑') ? 'var(--secondary)' : getParameterTrend(baby.id, 'heartRate', baby.vitals?.heartRate).includes('↓') ? 'var(--primary)' : 'var(--mint)' }}>
                              {getParameterTrend(baby.id, 'heartRate', baby.vitals?.heartRate)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>Oxygen (SpO₂)</span>
                            <span className="technical-value" style={{ fontWeight: 700, color: isSpO2Abnormal(baby.vitals?.spo2, baby.gestationalAge) ? 'var(--secondary)' : 'var(--text-main)' }}>{baby.vitals?.spo2 || '--'}% ({getSpO2Range(baby.gestationalAge).min}-{getSpO2Range(baby.gestationalAge).max}%)</span>
                            <span style={{ fontWeight: 800, color: getParameterTrend(baby.id, 'spo2', baby.vitals?.spo2).includes('↓') ? 'var(--secondary)' : 'var(--mint)' }}>
                              {getParameterTrend(baby.id, 'spo2', baby.vitals?.spo2)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>Temperature</span>
                            <span className="technical-value" style={{ fontWeight: 700, color: getTempStatus(baby.vitals?.temp).color }}>{baby.vitals?.temp || '--'} °C ({getTempStatus(baby.vitals?.temp).text})</span>
                            <span style={{ fontWeight: 800, color: getParameterTrend(baby.id, 'temp', baby.vitals?.temp).includes('Stable') ? 'var(--mint)' : 'var(--secondary)' }}>
                              {getParameterTrend(baby.id, 'temp', baby.vitals?.temp)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>Respiratory</span>
                            <span className="technical-value" style={{ fontWeight: 700 }}>{baby.vitals?.respRate || '--'} /min</span>
                            <span style={{ fontWeight: 800, color: getParameterTrend(baby.id, 'respRate', baby.vitals?.respRate).includes('↑') ? 'var(--secondary)' : 'var(--mint)' }}>
                              {getParameterTrend(baby.id, 'respRate', baby.vitals?.respRate)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>Blood Pressure (Mean)</span>
                            <span className="technical-value" style={{ fontWeight: 700, color: (baby.vitals?.bp < (parseInt(baby.gestationalAge) || 38)) ? 'var(--secondary)' : 'var(--text-main)' }}>{baby.vitals?.bp || '--'} mmHg (Target: &ge;{parseInt(baby.gestationalAge) || 38})</span>
                            <span style={{ fontWeight: 800, color: getParameterTrend(baby.id, 'bp', baby.vitals?.bp).includes('↑') ? 'var(--secondary)' : getParameterTrend(baby.id, 'bp', baby.vitals?.bp).includes('↓') ? 'var(--primary)' : 'var(--mint)' }}>
                              {getParameterTrend(baby.id, 'bp', baby.vitals?.bp)}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Clinical Targets and Background history context */}
                      {(() => {
                        const history = CLINICAL_HISTORY_CONTEXT[baby.id] || { maternalHistory: '', maternalFever: 'Not recorded', deliveryType: '', previousEvents: '', previousMonitoring: '' };
                        return (
                          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            
                            {/* Static Clinical Targets Guideline checklist */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CLINICAL TARGETS (Queensland Health & RCH Guidelines)</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.9 }}>
                                <div><strong>Thermoregulation:</strong> Normal Neutral Thermal Range (36.5°C – 37.5°C)</div>
                                <div>
                                  <strong>Oxygenation Target:</strong> {parseInt(baby.gestationalAge) < 37 
                                    ? "90% – 95% SpO₂ (Preterm Target to prevent hyperoxic ROP)" 
                                    : "92% – 98% SpO₂ (Term Target to optimize tissue oxygenation)"}
                                </div>
                                <div><strong>Circulation Target (BP):</strong> Mean BP &ge; Gestational Age ({parseInt(baby.gestationalAge) || 38} mmHg)</div>

                              </div>
                            </div>

                            {/* Static Baby history context */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CLINICAL HISTORY (Historical / Static Context)</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.8 }}>
                                <div><strong>Maternal Context:</strong> {history.maternalHistory} (Fever: {history.maternalFever})</div>
                                <div><strong>Delivery Type:</strong> {history.deliveryType}</div>
                                <div><strong>Prev Events:</strong> {history.previousEvents}</div>
                                <div><strong>Monitoring Notes:</strong> {history.previousMonitoring}</div>
                              </div>
                            </div>

                          </div>
                        );
                      })()}

                      {/* Open Focused Telemetry Explicit CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBabyId(baby.id);
                          setActiveTab('Focused Telemetry');
                        }}
                        className="sidebar-item active"
                        style={{ 
                          marginTop: '6px', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          padding: '10px 14px', 
                          fontSize: '11px', 
                          fontWeight: 900, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px',
                          background: 'var(--primary)',
                          color: 'white',
                          boxShadow: '0 4px 10px rgba(44, 105, 117, 0.15)'
                        }}
                      >
                        Focus Bed Telemetry
                      </button>
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
        {(activeTab !== 'Beds Overview' && activeTab !== 'Focused Telemetry' && activeTab !== 'Trends') && (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>{activeTab} Analytics Terminal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', marginTop: '6px' }}>
              Real-time predictions continue streaming on the primary NAVAAYU dashboard overview tab.
            </p>
            <button onClick={() => setActiveTab('Beds Overview')} className="sidebar-item active" style={{ marginTop: '20px', border: 'none' }}>
              Return to Beds Overview
            </button>
          </div>
        )}

        </main>

        <footer style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

const ScrollReveal = ({ children, delay = 0, duration = 600, style = {} }: { children: React.ReactNode; delay?: number; duration?: number; style?: React.CSSProperties }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.05 });
    
    const el = containerRef.current;
    if (el) {
      observer.observe(el);
    }
    
    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`scroll-reveal-item ${isVisible ? 'revealed' : ''}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        ...style
      }}
    >
      {children}
    </div>
  );
};

const DashboardPreviewReveal = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    
    const el = containerRef.current;
    if (el) {
      observer.observe(el);
    }
    
    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.98)',
        transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  );
};

const AIInsightPanel = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    
    const el = containerRef.current;
    if (el) {
      observer.observe(el);
    }
    
    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
    >
      {/* 5-step animation indicators */}
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '12px', 
          justifyContent: 'center',
          alignItems: 'center', 
          marginBottom: '28px', 
          fontSize: '11px', 
          fontWeight: 900, 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
        }}
      >
        <span style={{ color: isVisible ? 'var(--primary)' : 'var(--text-muted)', opacity: isVisible ? 1 : 0.4, transition: 'all 0.3s ease 200ms' }}>
          01 Telemetry
        </span>
        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>➔</span>
        <span style={{ color: isVisible ? 'var(--accent)' : 'var(--text-muted)', opacity: isVisible ? 1 : 0.4, transition: 'all 0.3s ease 450ms' }}>
          02 Edge Analysis
        </span>
        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>➔</span>
        <span style={{ color: isVisible ? 'var(--mint)' : 'var(--text-muted)', opacity: isVisible ? 1 : 0.4, transition: 'all 0.3s ease 700ms' }}>
          03 AI Insight
        </span>
        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>➔</span>
        <span style={{ color: isVisible ? 'var(--secondary)' : 'var(--text-muted)', opacity: isVisible ? 1 : 0.4, transition: 'all 0.3s ease 950ms' }}>
          04 Risk Prediction
        </span>
        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>➔</span>
        <span style={{ color: isVisible ? 'var(--primary)' : 'var(--text-muted)', opacity: isVisible ? 1 : 0.4, transition: 'all 0.3s ease 1200ms' }}>
          05 Contributing Factors
        </span>
      </div>

      {/* Conceptual Demo Panel */}
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: '900px', 
          width: '100%', 
          padding: '40px', 
          background: 'var(--card-bg)', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          gap: '40px', 
          boxSizing: 'border-box' 
        }}
      >
        {/* Left Block: Alert State */}
        <div 
          style={{ 
            flex: 1, 
            padding: '24px', 
            background: 'rgba(225,29,72,0.02)', 
            border: '1px solid var(--secondary)', 
            borderRadius: '16px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 200ms'
          }}
        >
          <span 
            style={{ 
              fontSize: '10px', 
              fontWeight: 900, 
              color: 'var(--secondary)', 
              letterSpacing: '1px',
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.4s ease 500ms'
            }}
          >
            🔴 ATTENTION REQUIRED
          </span>
          <h4 
            style={{ 
              fontSize: '18px', 
              fontWeight: 900, 
              color: 'var(--primary)', 
              margin: '12px 0 4px 0',
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.4s ease 650ms'
            }}
          >
            NICU-003 Alerts
          </h4>
          <div 
            style={{ 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              fontWeight: 700, 
              marginBottom: '16px',
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.4s ease 800ms'
            }}
          >
            AI RISK ASSIGNMENT: MODERATE
          </div>
          
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              borderTop: '1px solid rgba(225,29,72,0.1)', 
              paddingTop: '16px' 
            }}
          >
            <div 
              style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: 'var(--secondary)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-5px)',
                transition: 'all 0.4s ease 950ms'
              }}
            >
              • Heart Rate: 190 bpm (High ↑)
            </div>
            <div 
              style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: 'var(--secondary)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-5px)',
                transition: 'all 0.4s ease 1100ms'
              }}
            >
              • SpO₂: 85% (Low ↓)
            </div>
            <div 
              style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: 'var(--secondary)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-5px)',
                transition: 'all 0.4s ease 1250ms'
              }}
            >
              • Mean BP: 31 mmHg (Low ↓)
            </div>
          </div>
        </div>

        {/* Right Block: Telemetry Context */}
        <div 
          style={{ 
            flex: 1.2, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            gap: '16px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 350ms'
          }}
        >
          <h4 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
            Contributing Alert Factors
          </h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
            The system aggregates contributing alerts on the same card, mapping out parameters. Clinicians can review high heart rates and low oxygen states together without navigating away.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <span 
              className="param-badge" 
              style={{ 
                opacity: isVisible ? 1 : 0, 
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1400ms' 
              }}
            >
              Tachycardia check
            </span>
            <span 
              className="param-badge" 
              style={{ 
                opacity: isVisible ? 1 : 0, 
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1550ms' 
              }}
            >
              Hypoxic threat
            </span>
            <span 
              className="param-badge" 
              style={{ 
                opacity: isVisible ? 1 : 0, 
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1700ms' 
              }}
            >
              Gestational BP limit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Landing Page presenting NAVAAYU core functions
function LandingPage({ onGoToLogin }: { onGoToLogin: () => void }) {
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const howItWorksRef = useRef<HTMLDivElement | null>(null);
  const technologyRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setIsScrolled(containerRef.current.scrollTop > 20);
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div 
      ref={containerRef}
      style={{ background: '#F4F7F6', minHeight: '100vh', width: '100vw', overflowY: 'auto', position: 'relative', boxSizing: 'border-box', scrollBehavior: 'smooth' }}
    >
      <FloatingBackground />

      {/* Aurora Mesh Gradient Background Blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(104, 178, 160, 0.22) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'floatBlob1 25s infinite alternate ease-in-out', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(205, 224, 201, 0.28) 0%, transparent 70%)', filter: 'blur(100px)', animation: 'floatBlob2 30s infinite alternate ease-in-out', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', left: '50%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(44, 105, 117, 0.12) 0%, transparent 70%)', filter: 'blur(90px)', animation: 'floatBlob1 28s infinite alternate-reverse ease-in-out', zIndex: 1, pointerEvents: 'none' }} />

      {/* STICKY NAVBAR */}
      <header 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(12px)', 
          borderBottom: '1px solid var(--border-color)', 
          boxShadow: isScrolled ? '0 4px 20px rgba(44, 105, 117, 0.04)' : 'none',
          height: '70px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 40px', 
          boxSizing: 'border-box',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--primary)" className="heartbeat-icon" />
          <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Akesis Protocol</span>
        </div>
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="landing-nav-item" onClick={() => scrollToSection(overviewRef)}>Overview</span>
          <span className="landing-nav-item" onClick={() => scrollToSection(howItWorksRef)}>How It Works</span>
          <span className="landing-nav-item" onClick={() => scrollToSection(technologyRef)}>Technology</span>
          <span className="landing-nav-item" onClick={onGoToLogin}>Dashboard</span>
        </nav>
        <button onClick={onGoToLogin} className="landing-btn-primary" style={{ padding: '10px 20px', fontSize: '11px' }}>
          Explore System
        </button>
      </header>

      {/* 1. HERO SECTION */}
      <section className="reveal-animate" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ maxWidth: '1100px', width: '100%', display: 'flex', gap: '60px', padding: '60px 50px', alignItems: 'center', boxSizing: 'border-box', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          
          {/* Left Column: Messaging & CTAs */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <span className="hero-entrance-logo" style={{ fontSize: '10px', fontWeight: 900, color: '#2C6975', background: 'rgba(44,105,117,0.06)', padding: '6px 14px', borderRadius: '30px', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'inline-block' }}>Smart Clinical Edge AI</span>
              <h1 className="hero-entrance-title" style={{ fontSize: '50px', fontWeight: 900, color: 'var(--primary)', margin: '14px 0 10px 0', letterSpacing: '-2px', lineHeight: 1.1 }}>
                AKESIS PROTOCOL
              </h1>
              <h2 className="hero-entrance-title" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 18px 0', lineHeight: 1.3 }}>
                Intelligent Neonatal Monitoring
              </h2>
              <p className="hero-entrance-desc" style={{ color: '#2F4156', fontSize: '14px', fontWeight: 500, margin: 0, lineHeight: 1.6, opacity: 0.85 }}>
                Intelligent neonatal monitoring designed to help clinicians identify meaningful changes earlier. By analyzing vital signs closer to the point of care, Akesis Protocol assists care teams with localized, privacy-aware telemetry insights.
              </p>
            </div>
            <div className="hero-entrance-ctas" style={{ display: 'flex', gap: '16px' }}>
              <button onClick={onGoToLogin} className="landing-btn-primary">
                Explore the System
              </button>
              <button onClick={() => scrollToSection(howItWorksRef)} className="landing-btn-secondary">
                See How It Works
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual - Clean high-fidelity clinical photograph of incubator baby */}
          <div className="hero-entrance-visual" style={{ flex: 0.9, display: 'flex', justifyContent: 'center' }}>
            <div className="hero-monitoring-container" style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img 
                src="/neonatal_incubator_baby.jpg" 
                alt="Neonatal Incubator Baby" 
                style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }} 
              />
            </div>
          </div>

        </div>
      </section>

      {/* 2. RESTRAINED TRUST STRIP */}
      <ScrollReveal>
        <section style={{ background: '#E0ECDE', padding: '18px 40px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', zIndex: 10, position: 'relative' }}>
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'space-between', maxWidth: '1000px', width: '100%', fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px' }}>
            <span>EDGE AI PROCESSING</span>
            <span>•</span>
            <span>REAL-TIME TELEMETRY</span>
            <span>•</span>
            <span>NON-INVASIVE SENSING</span>
            <span>•</span>
            <span>CLINICIAN-CENTRIC DESIGN</span>
            <span>•</span>
            <span>PRIVACY-AWARE</span>
          </div>
        </section>
      </ScrollReveal>

      {/* 3. PROBLEM SECTION */}
      <section ref={overviewRef} style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '900px', textAlign: 'center', marginBottom: '50px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>The Clinical Challenge</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 20px 0', lineHeight: 1.2 }}>
              Neonatal monitoring generates more information than clinicians should have to manually interpret.
            </h2>
            <p style={{ color: '#2F4156', fontSize: '14.5px', fontWeight: 500, lineHeight: 1.6, opacity: 0.85 }}>
              NICU wards run continuously, feeding massive volumes of real-time telemetry from multiple monitoring sources. Sifting through transient signals to isolate true, actionable trends is complex.
            </p>
          </div>
        </ScrollReveal>
        
        {/* Horizontal Challenge Flow */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', maxWidth: '1000px', width: '100%' }}>
          <ScrollReveal delay={0}>
            <div className="landing-card" style={{ padding: '20px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>📡</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>Multiple Signals</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Continuous patient feeds</div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="landing-card" style={{ padding: '20px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>📈</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>Telemetry Flow</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Constant stream of numbers</div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="landing-card" style={{ padding: '20px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>Changing parameters</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Rapidly fluctuating states</div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="landing-card" style={{ padding: '20px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>Important Trends</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Subtle alert patterns</div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={400}>
            <div className="landing-card" style={{ padding: '20px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚨</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>Timely Attention</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Immediate clinician triage</div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. SOLUTION SECTION */}
      <section style={{ padding: '60px 40px 80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', background: 'rgba(255, 255, 255, 0.4)' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '50px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>The Akesis Solution</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>
              From raw telemetry to meaningful clinical insight.
            </h2>
            <p style={{ color: '#2F4156', fontSize: '14.5px', fontWeight: 500, lineHeight: 1.6, opacity: 0.85 }}>
              Akesis Protocol processes telemetry streams on a localized edge server, running them through inference models to aggregate alerts and map trends.
            </p>
          </div>
        </ScrollReveal>

        {/* Conceptual Pipeline Block */}
        <ScrollReveal style={{ width: '100%', maxWidth: '1000px' }}>
          <div className="landing-card" style={{ padding: '40px', background: 'var(--card-bg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.3fr 1fr 0.3fr 1.2fr', alignItems: 'center', textAlign: 'center' }}>
              
              {/* Input Node */}
              <div style={{ padding: '16px', background: 'rgba(44, 105, 117, 0.02)', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>PATIENT SENSORS</div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', marginTop: '6px' }}>Continuous Vitals (HR, SpO₂, RR, Temp, BP)</div>
              </div>

              <div style={{ fontSize: '20px', color: 'var(--text-muted)' }}>➔</div>

              {/* Edge AI Node */}
              <div style={{ padding: '16px', background: 'rgba(217, 119, 6, 0.03)', border: '1px solid var(--accent)', borderRadius: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)' }}>EDGE PROCESSING</div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', marginTop: '6px' }}>AI Model Inference & Triaging</div>
              </div>

              <div style={{ fontSize: '20px', color: 'var(--text-muted)' }}>➔</div>

              {/* Dashboard Display */}
              <div style={{ padding: '16px', background: 'rgba(104, 178, 160, 0.05)', border: '1px solid var(--mint)', borderRadius: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--mint)' }}>CLINICIAN INTERFACE</div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)', marginTop: '6px' }}>Aggregated Risk Trends & Toast Alerts</div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. HOW AKESIS WORKS SECTION */}
      <section ref={howItWorksRef} style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '50px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Operational Workflow</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>How Akesis Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800 }}>A decoupled clinical intelligence loop that maps telemetry</p>
          </div>
        </ScrollReveal>

        {/* Step Progression Grid */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', padding: '10px 0' }}>
          {/* Signal line connector animation */}
          <div className="data-flow-track" />
          <div className="data-flow-signal" />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', position: 'relative', zIndex: 2 }}>
            <ScrollReveal delay={0}>
              <div className="landing-card" style={{ padding: '24px 20px', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)', opacity: 0.4 }}>01</span>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '8px 0 6px 0' }}>Data Collection</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Gather continuous neonatal vitals from patient monitors.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="landing-card" style={{ padding: '24px 20px', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)', opacity: 0.4 }}>02</span>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '8px 0 6px 0' }}>Edge Processing</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Buffer and process raw signals on the localized ward edge node.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="landing-card" style={{ padding: '24px 20px', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)', opacity: 0.4 }}>03</span>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '8px 0 6px 0' }}>AI Analysis</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Analyze vital parameters against trained triage classification models.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="landing-card" style={{ padding: '24px 20px', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)', opacity: 0.4 }}>04</span>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '8px 0 6px 0' }}>Triage Insights</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Calculate alert bounds and flag anomalous parameters.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="landing-card" style={{ padding: '24px 20px', position: 'relative', height: '100%', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)', opacity: 0.4 }}>05</span>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '8px 0 6px 0' }}>Dashboard Display</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Present organized patient lists and alerts to the medical staff.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 6. KEY PARAMETERS */}
      <section style={{ padding: '60px 40px 80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', background: 'rgba(255, 255, 255, 0.4)' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '50px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Telemetry Coverage</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>Key Monitoring Parameters</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800 }}>The five physiological vital signs tracked by Akesis Protocol</p>
          </div>
        </ScrollReveal>

        {/* 5 Parameters Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', maxWidth: '1100px', width: '100%' }}>
          
          <ScrollReveal delay={0}>
            <div className="landing-card parameter-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="micro-heartbeat" style={{ fontSize: '20px' }}>❤️</span>
                <span className="param-badge" style={{ background: 'rgba(225,29,72,0.06)', color: 'var(--secondary)' }}>HR</span>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>Heart Rate</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px', lineHeight: 1.4 }}>Monitored continuously for bradycardia or tachycardia episodes.</p>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', borderTop: '1px solid rgba(86,124,141,0.08)', paddingTop: '10px', marginTop: 'auto' }}>
                TARGET: 120–160 bpm
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="landing-card parameter-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="micro-pulse-spo2" style={{ fontSize: '20px' }}>💙</span>
                <span className="param-badge" style={{ background: 'rgba(44,105,117,0.06)', color: 'var(--primary)' }}>SpO₂</span>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>Oxygen Saturation</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px', lineHeight: 1.4 }}>Gestational-aware limits to prevent hyperoxic retinopathy or hypoxemia.</p>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', borderTop: '1px solid rgba(86,124,141,0.08)', paddingTop: '10px', marginTop: 'auto' }}>
                TARGET: 90–95% / 92–98%
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="landing-card parameter-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="micro-temp" style={{ fontSize: '20px' }}>🌡️</span>
                <span className="param-badge" style={{ background: 'rgba(217,119,6,0.06)', color: 'var(--accent)' }}>TEMP</span>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>Temperature</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px', lineHeight: 1.4 }}>Precise thermoregulation scaling: Hypothermia & Cold Stress alert levels.</p>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', borderTop: '1px solid rgba(86,124,141,0.08)', paddingTop: '10px', marginTop: 'auto' }}>
                TARGET: 36.5–37.5°C
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="landing-card parameter-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="micro-lungs" style={{ fontSize: '20px' }}>🫁</span>
                <span className="param-badge" style={{ background: 'rgba(44,105,117,0.06)', color: 'var(--primary)' }}>RR</span>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>Respiratory Rate</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px', lineHeight: 1.4 }}>Checks breathing rate limits and alerts on apnea or tachypnea signs.</p>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', borderTop: '1px solid rgba(86,124,141,0.08)', paddingTop: '10px', marginTop: 'auto' }}>
                TARGET: 30–50 /min
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="landing-card parameter-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="micro-bp" style={{ fontSize: '20px' }}>🩸</span>
                <span className="param-badge" style={{ background: 'rgba(44,105,117,0.06)', color: 'var(--primary)' }}>Mean BP</span>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>Blood Pressure</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px', lineHeight: 1.4 }}>Assesses mean systemic perfusion against baby gestational age.</p>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', borderTop: '1px solid rgba(86,124,141,0.08)', paddingTop: '10px', marginTop: 'auto' }}>
                TARGET: ≥ Gestation (mmHg)
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 7. AI INSIGHT SECTION */}
      <section ref={technologyRef} style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '40px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Decision Support</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>
              Don't just see the signal. Understand the change.
            </h2>
            <p style={{ color: '#2F4156', fontSize: '14.5px', fontWeight: 500, lineHeight: 1.6, opacity: 0.85 }}>
              Traditional alarms trigger on isolated vital violations, leading to alarm fatigue. Akesis Protocol maps parameter changes together, providing context on exactly why attention is required.
            </p>
          </div>
        </ScrollReveal>

        {/* Dynamic AI Insight Panel */}
        <AIInsightPanel />
      </section>

      {/* 8. PRODUCT PREVIEW SECTION */}
      <section style={{ padding: '60px 40px 80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', background: 'rgba(255, 255, 255, 0.4)' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '50px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Console Interface</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>Clinical Telemetry Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800 }}>The clinical interface designed for ward deployment</p>
          </div>
        </ScrollReveal>

        {/* Dashboard Mock Grid with Scroll Reveal */}
        <DashboardPreviewReveal>
          <div className="glass-card" style={{ maxWidth: '1000px', width: '100%', padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
            
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(86,124,141,0.1)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)' }}>Akesis Monitor Console</span>
                <span style={{ fontSize: '8px', background: 'rgba(44,105,117,0.06)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>V2.0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-mint" style={{ width: '8px', height: '8px', background: 'var(--mint)', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>ONLINE</span>
              </div>
            </div>

            {/* Grid representing active dashboard cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              
              {/* Left Col: Ward overview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="bed-card-critical" style={{ padding: '12px', background: 'rgba(225,29,72,0.03)', border: '1px solid var(--secondary)', borderRadius: '12px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-hr" style={{ width: '6px', height: '6px', background: 'var(--secondary)', borderRadius: '50%', display: 'inline-block' }} />
                    BED NICU-003 • CRITICAL
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>Anomalous vitals pattern detected</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(104,178,160,0.03)', border: '1px solid var(--mint)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-mint" style={{ width: '6px', height: '6px', background: 'var(--mint)', borderRadius: '50%', display: 'inline-block' }} />
                    BED NICU-001 • NORMAL
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>Vitals stable and within bounds</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(104,178,160,0.03)', border: '1px solid var(--mint)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-mint" style={{ width: '6px', height: '6px', background: 'var(--mint)', borderRadius: '50%', display: 'inline-block' }} />
                    BED NICU-002 • NORMAL
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>Vitals stable and within bounds</div>
                </div>
              </div>

              {/* Right Col: Telemetry visual */}
              <div style={{ background: 'rgba(47, 65, 86, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(86,124,141,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-mint" style={{ width: '6px', height: '6px', background: 'var(--mint)', borderRadius: '50%', display: 'inline-block' }} />
                    <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary)' }}>Live Patient Telemetry Chart</span>
                  </div>
                  <span className="param-badge">5m window</span>
                </div>
                
                {/* ECG Waveform Visualization */}
                <div style={{ position: 'relative', height: '110px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid rgba(86,124,141,0.1)', overflow: 'hidden' }}>
                  {/* Grid background */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(104, 178, 160, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(104, 178, 160, 0.04) 1px, transparent 1px)', backgroundSize: '15px 15px', pointerEvents: 'none' }} />
                  
                  {/* SVG waveforms */}
                  <svg viewBox="0 0 400 100" width="100%" height="100%" style={{ overflow: 'visible', zIndex: 2 }}>
                    {/* ECG Green Heart Rate sweep wave */}
                    <path 
                      d="M0,50 L40,50 L46,30 L52,70 L58,50 L100,50 L106,30 L112,70 L118,50 L160,50 L166,30 L172,70 L178,50 L220,50 L226,30 L232,70 L238,50 L280,50 L286,30 L292,70 L298,50 L340,50 L346,30 L352,70 L358,50 L400,50"
                      fill="none"
                      stroke="var(--mint)"
                      strokeWidth="2"
                      className="telemetry-wave-path"
                    />
                    
                    {/* Respiration Blue breathing wave */}
                    <path 
                      d="M0,75 C30,60 50,90 80,75 C110,60 130,90 160,75 C190,60 210,90 240,75 C270,60 290,90 320,75 C350,60 370,90 400,75"
                      fill="none"
                      stroke="#567C8D"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="telemetry-resp-path"
                    />
                  </svg>
                </div>
              </div>

            </div>

          </div>
        </DashboardPreviewReveal>
      </section>

      {/* 9. HUMAN-CENTRIC BENEFIT */}
      <section style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '850px', textAlign: 'center' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Design Values</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 20px 0' }}>
              Built around the people caring for the smallest patients.
            </h2>
            <p style={{ color: '#2F4156', fontSize: '14.5px', fontWeight: 500, lineHeight: 1.6, opacity: 0.85, marginBottom: '45px' }}>
              Akesis Protocol is developed with clinical feedback. We build decision-support tools that streamline data interpretation and help avoid alarm fatigue, keeping doctors and nurses in full control.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Core pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1000px', width: '100%' }}>
          <ScrollReveal delay={0}>
            <div className="landing-card" style={{ padding: '24px', height: '100%', boxSizing: 'border-box' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 6px 0' }}>Visual Clarity</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Clean grids and dynamic trend symbols optimize readability.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="landing-card" style={{ padding: '24px', height: '100%', boxSizing: 'border-box' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 6px 0' }}>Early Awareness</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Identifies multi-parameter trend changes before acute alert violations occur.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="landing-card" style={{ padding: '24px', height: '100%', boxSizing: 'border-box' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 6px 0' }}>Low Cognitive Load</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Combines alert details and clinical history in a unified view.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="landing-card" style={{ padding: '24px', height: '100%', boxSizing: 'border-box' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 6px 0' }}>Clinician Control</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>Provides decision context while leaving diagnostic decisions to human experts.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 10. PRIVACY / EDGE AI SECTION */}
      <section style={{ padding: '60px 40px 80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', background: 'rgba(255, 255, 255, 0.4)' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '40px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Data Architecture</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>Designed for Edge-Level Privacy</h2>
            <p style={{ color: '#2F4156', fontSize: '14.5px', fontWeight: 500, lineHeight: 1.6, opacity: 0.85 }}>
              To safeguard sensitive patient metrics, Akesis Protocol runs vital signal processing and AI inference locally on localized ward edge nodes.
            </p>
          </div>
        </ScrollReveal>

        {/* Privacy flow visual */}
        <ScrollReveal style={{ width: '100%', maxWidth: '800px' }}>
          <div className="landing-card" style={{ padding: '30px', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)' }}>WARD TELEMETRY</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Buffered bedside inputs</div>
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>➔</div>
              <div style={{ flex: 1, padding: '12px', background: 'rgba(104,178,160,0.06)', borderRadius: '12px', border: '1px solid var(--mint)' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--mint)' }}>LOCAL EDGE INFERENCE</div>
                <div style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '4px', fontWeight: 800 }}>No public cloud streaming</div>
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>➔</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)' }}>SECURE WARD DISPLAY</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>Low-latency local rendering</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 11. TECHNICAL ARCHITECTURE — OPTIONAL SECTION */}
      <section style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '40px' }}>
            <span className="param-badge" style={{ marginBottom: '10px', display: 'inline-block' }}>Hardware Topology</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)', margin: '10px 0 16px 0' }}>Decoupled 3-PC Demonstration Setup</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800 }}>Our prototype architecture representing decoupled client-server data streams</p>
          </div>
        </ScrollReveal>

        {/* Network diagram */}
        <ScrollReveal style={{ width: '100%', maxWidth: '900px' }}>
          <div className="landing-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
            <svg viewBox="0 0 800 160" width="100%" height="110" style={{ overflow: 'visible' }}>
              <rect x="10" y="30" width="180" height="80" rx="14" fill="var(--card-bg)" stroke="var(--primary)" strokeWidth="2" />
              <text x="100" y="65" textAnchor="middle" fill="var(--primary)" fontWeight="900" fontSize="12">PC 1 — Telemetry Source</text>
              <text x="100" y="85" textAnchor="middle" fill="var(--text-muted)" fontWeight="700" fontSize="10">Bedside vital-signs feed</text>

              <path d="M 190 70 L 310 70" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 4" />

              <rect x="310" y="30" width="180" height="80" rx="14" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" />
              <text x="400" y="65" textAnchor="middle" fill="var(--accent)" fontWeight="900" fontSize="12">PC 2 — Edge AI Server</text>
              <text x="400" y="85" textAnchor="middle" fill="var(--text-muted)" fontWeight="700" fontSize="10">FastAPI Prediction Engine</text>

              <path d="M 490 70 L 610 70" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 4" />

              <rect x="610" y="30" width="180" height="80" rx="14" fill="var(--card-bg)" stroke="var(--primary)" strokeWidth="2" />
              <text x="700" y="65" textAnchor="middle" fill="var(--primary)" fontWeight="900" fontSize="12">PC 3 — Clinician Console</text>
              <text x="700" y="85" textAnchor="middle" fill="var(--text-muted)" fontWeight="700" fontSize="10">Vite-React Dashboard</text>
            </svg>
          </div>
        </ScrollReveal>
      </section>

      {/* 12. CALL TO ACTION */}
      <section style={{ padding: '100px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative', background: '#E0ECDE', textAlign: 'center' }}>
        <ScrollReveal>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--primary)', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
            Explore intelligent neonatal monitoring.
          </h2>
          <p style={{ color: '#2F4156', fontSize: '14.5px', fontWeight: 500, maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: 1.6, opacity: 0.85 }}>
            Launch the Akesis clinical telemetry dashboard demo to review active ward overview beds, live AreaCharts, and warning reason logs.
          </p>
          <button onClick={onGoToLogin} className="landing-btn-primary" style={{ padding: '16px 36px', fontSize: '14px' }}>
            Launch Dashboard
          </button>

          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, marginTop: '30px', maxWidth: '600px', lineHeight: 1.4 }}>
            ⚠️ <strong>Medical Disclaimer:</strong> This system is a decision-support prototype. It does not replace the direct diagnostic supervision and evaluation of certified healthcare professionals.
          </p>
        </ScrollReveal>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, position: 'relative', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
        <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Akesis Protocol</span>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>2026 @ AKESISPROTOCOL All Rights Reserved</span>
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

      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '50px 40px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative', zIndex: 10, boxSizing: 'border-box', margin: '0 20px' }}>
        {/* Back button */}
        <button 
          onClick={onBack}
          style={{ position: 'absolute', left: '30px', top: '30px', background: 'rgba(44, 105, 117, 0.05)', border: 'none', color: 'var(--primary)', fontWeight: 900, cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Back to Landing Page"
        >
          ←
        </button>

        <div style={{ fontSize: '50px', marginBottom: '20px', filter: 'drop-shadow(0 10px 15px rgba(44, 105, 117, 0.1))' }}>👶</div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px', letterSpacing: '-0.5px', color: 'var(--primary)' }}>AKESIS PROTOCOL</h2>
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
            style={{ width: '100%', height: '56px', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px var(--primary-glow)', border: 'none', borderRadius: '12px', cursor: 'pointer', background: 'var(--primary)', color: 'white', marginTop: '10px' }}
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