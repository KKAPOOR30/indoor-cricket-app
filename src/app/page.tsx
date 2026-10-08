"use client";

import { useState } from "react";
import CameraFeed from "@/components/CameraFeed";
import PoseCamera from "@/components/PoseCamera";

type AppState = "home" | "camera-check" | "playing";

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("home");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const handleStartCamera = () => {
    setCameraError(null);
    setCameraReady(false);
    setAppState("camera-check");
  };

  const handleCameraReady = () => setCameraReady(true);

  const handleCameraError = (msg: string) => setCameraError(msg);

  const handleBack = () => {
    setAppState("home");
    setCameraError(null);
    setCameraReady(false);
  };

  const handlePlay = () => setAppState("playing");

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-green-900/40">
        <div className="flex items-center gap-3">
          {/* Cricket ball icon */}
          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3C12 3 9 7 9 12s3 9 3 9" />
              <path d="M12 3C12 3 15 7 15 12s-3 9-3 9" />
              <path d="M3 12h18" />
            </svg>
          </div>
          <span className="text-green-400 font-bold text-lg tracking-wide">Indoor Cricket</span>
        </div>
        <span className="text-green-600 text-sm">v0.1 · Alpha</span>
      </nav>

      {/* ── HOME STATE ── */}
      {appState === "home" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
          {/* Hero */}
          <div className="flex flex-col items-center gap-4 max-w-xl">
            {/* Animated cricket ball */}
            <div className="relative w-24 h-24 mb-2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-900 shadow-2xl shadow-red-900/60 flex items-center justify-center animate-bounce">
                <svg viewBox="0 0 48 48" className="w-16 h-16 text-red-200 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="24" cy="24" r="20" />
                  <path d="M24 4C24 4 18 13 18 24s6 20 6 20" />
                  <path d="M24 4C24 4 30 13 30 24s-6 20-6 20" />
                  <path d="M4 24h40" />
                </svg>
              </div>
              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-red-600/20 blur-xl animate-pulse" />
            </div>

            <h1 className="text-5xl font-black text-white leading-tight">
              Play Cricket.
              <br />
              <span className="text-green-400">No pitch required.</span>
            </h1>
            <p className="text-green-200/70 text-lg leading-relaxed">
              Face your webcam, swing your bat, and let the game track every shot in real time.
              Powered by your camera — no VR headset, no sensors.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: "📷", label: "Webcam tracking" },
              { icon: "🏏", label: "Swing detection" },
              { icon: "📊", label: "Live scoring" },
              { icon: "📱", label: "Phone bat (coming soon)" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-950/60 border border-green-800/40 text-green-300 text-sm"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleStartCamera}
            className="group relative px-10 py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-lg transition-all duration-200 shadow-xl shadow-green-900/40 hover:shadow-green-500/30 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Enable Camera &amp; Start
            </span>
          </button>

          <p className="text-green-700 text-xs max-w-xs">
            Your camera feed is processed entirely in your browser. Nothing is uploaded or stored.
          </p>
        </div>
      )}

      {/* ── CAMERA CHECK STATE ── */}
      {appState === "camera-check" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <h2 className="text-2xl font-bold text-white">Camera Preview</h2>
          <p className="text-green-300/70 text-sm text-center max-w-sm">
            Make sure your full body is visible. Stand ~2–3 metres from the camera.
          </p>

          {/* Camera feed component */}
          <CameraFeed
            onReady={handleCameraReady}
            onError={handleCameraError}
          />

          {/* Error state */}
          {cameraError && (
            <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 max-w-md text-sm">
              <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-semibold text-red-200 mb-1">Camera access failed</p>
                <p>{cameraError}</p>
                <p className="mt-2 text-red-400/70">
                  Make sure you allowed camera access in your browser and no other app is using it.
                </p>
              </div>
            </div>
          )}

          {/* Status indicator */}
          {!cameraError && (
            <div className="flex items-center gap-2 text-sm">
              {cameraReady ? (
                <span className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Camera ready
                </span>
              ) : (
                <span className="flex items-center gap-2 text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  Requesting access…
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-2">
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border border-green-800/50 text-green-400 hover:bg-green-950/40 transition-colors text-sm font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handlePlay}
              disabled={!cameraReady}
              className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-sm transition-all hover:scale-105 active:scale-95"
            >
              Test Pose Tracking →
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING STATE — MediaPipe Pose test view ── */}
      {appState === "playing" && (
        <PoseCamera onBack={handleBack} />
      )}

      {/* ── FOOTER ── */}
      <footer className="text-center py-4 text-green-800 text-xs border-t border-green-900/30">
        All processing happens in your browser · No data is uploaded
      </footer>
    </main>
  );
}
