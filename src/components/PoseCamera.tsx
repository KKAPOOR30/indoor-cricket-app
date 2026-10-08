"use client";

import { useRef, useState, useEffect } from "react";
import { usePoseLandmarker, LANDMARK_NAMES, CRICKET_LANDMARKS } from "@/hooks/usePoseLandmarker";
import clsx from "clsx";

interface PoseCameraProps {
  onBack: () => void;
}

export default function PoseCamera({ onBack }: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Display toggles
  const [showConnections, setShowConnections] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [highlightCricket, setHighlightCricket] = useState(true);
  const [showStats, setShowStats] = useState(true);

  const { isModelLoading, modelReady, error: modelError, stats } = usePoseLandmarker({
    videoRef,
    canvasRef,
    enabled: cameraReady,
    showConnections,
    showLandmarks,
    highlightCricketPoints: highlightCricket,
  });

  // ── Start camera ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera permission denied."
            : "Could not access camera.";
        setCameraError(msg);
      }
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Legend items
  const legend = [
    { color: "bg-red-500", label: "Wrists (bat position)" },
    { color: "bg-yellow-400", label: "Key cricket joints" },
    { color: "bg-green-400", label: "All other landmarks" },
  ];

  const cricketIndices = Object.values(CRICKET_LANDMARKS);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0f0a]">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-green-900/40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-2">
          {/* Model status badge */}
          {isModelLoading && (
            <span className="flex items-center gap-1.5 text-yellow-400 text-xs px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
              Loading model…
            </span>
          )}
          {modelReady && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs px-3 py-1 rounded-full bg-green-900/30 border border-green-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              MediaPipe Pose · Lite
            </span>
          )}
          {(modelError || cameraError) && (
            <span className="text-red-400 text-xs px-3 py-1 rounded-full bg-red-900/30 border border-red-800/40">
              ⚠ {modelError ?? cameraError}
            </span>
          )}
        </div>

        {/* FPS */}
        <span className="text-green-600 text-sm font-mono min-w-[60px] text-right">
          {modelReady && cameraReady ? `${stats.fps} fps` : "—"}
        </span>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Video + canvas ── */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black border border-green-900/30 shadow-2xl shadow-black/80">

            {/* Video — mirrored so it feels natural */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto object-cover scale-x-[-1]"
              style={{ minHeight: 320, maxHeight: 540 }}
            />

            {/* Canvas overlay — same mirror transform as video */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
              style={{ objectFit: "fill" }}
            />

            {/* Camera not ready */}
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
                <div className="w-8 h-8 rounded-full border-4 border-green-500/30 border-t-green-400 animate-spin" />
                <p className="text-green-300 text-sm">Starting camera…</p>
              </div>
            )}

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                <p className="text-red-400 text-center text-sm">{cameraError}</p>
              </div>
            )}

            {/* Model loading overlay (only while camera is ready but model isn't) */}
            {cameraReady && isModelLoading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-yellow-800/50 text-yellow-300 text-xs">
                <div className="w-3 h-3 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                Loading pose model (first run may take ~10s)…
              </div>
            )}

            {/* Body confidence bar */}
            {modelReady && cameraReady && (
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <span className="text-green-400/70 text-xs whitespace-nowrap">Body in frame</span>
                  <div className="flex-1 h-1.5 rounded-full bg-green-950">
                    <div
                      className="h-full rounded-full bg-green-400 transition-all duration-300"
                      style={{ width: `${Math.round(stats.bodyConfidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-green-400 text-xs font-mono w-8 text-right">
                    {Math.round(stats.bodyConfidence * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        {showStats && (
          <div className="w-64 border-l border-green-900/30 flex flex-col overflow-y-auto p-4 gap-5 text-xs">

            {/* Toggles */}
            <div>
              <p className="text-green-600 font-semibold uppercase tracking-wider mb-2">Display</p>
              {[
                { label: "Skeleton connections", value: showConnections, set: setShowConnections },
                { label: "All landmarks", value: showLandmarks, set: setShowLandmarks },
                { label: "Cricket highlights", value: highlightCricket, set: setHighlightCricket },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-2 py-1 cursor-pointer group">
                  <button
                    role="checkbox"
                    aria-checked={value}
                    onClick={() => set(!value)}
                    className={clsx(
                      "w-8 h-4 rounded-full transition-colors relative shrink-0",
                      value ? "bg-green-500" : "bg-green-950 border border-green-800"
                    )}
                  >
                    <span
                      className={clsx(
                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                        value ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <span className="text-green-300/80 group-hover:text-green-200">{label}</span>
                </label>
              ))}
            </div>

            {/* Legend */}
            <div>
              <p className="text-green-600 font-semibold uppercase tracking-wider mb-2">Legend</p>
              <div className="flex flex-col gap-1.5">
                {legend.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
                    <span className="text-green-300/70">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key landmark coordinates */}
            <div>
              <p className="text-green-600 font-semibold uppercase tracking-wider mb-2">
                Cricket Landmarks
              </p>
              {stats.landmarks ? (
                <div className="flex flex-col gap-1">
                  {cricketIndices.map((idx) => {
                    const lm = stats.landmarks![idx];
                    if (!lm) return null;
                    const vis = (lm.visibility ?? 0);
                    const isWrist = idx === 15 || idx === 16;
                    return (
                      <div
                        key={idx}
                        className={clsx(
                          "flex items-center justify-between py-0.5 px-1.5 rounded",
                          isWrist ? "bg-red-950/40 border border-red-900/30" : "border border-transparent"
                        )}
                      >
                        <span className={clsx("font-medium", isWrist ? "text-red-300" : "text-green-400/80")}>
                          {LANDMARK_NAMES[idx]}
                        </span>
                        <span
                          className="font-mono text-right"
                          style={{ color: vis > 0.7 ? "#4ade80" : vis > 0.4 ? "#facc15" : "#f87171" }}
                        >
                          {vis > 0.3
                            ? `${lm.x.toFixed(2)}, ${lm.y.toFixed(2)}`
                            : "hidden"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-green-800 italic">No pose detected</p>
              )}
            </div>

            {/* Raw data hint for future data collection */}
            <div className="mt-auto pt-3 border-t border-green-900/30">
              <p className="text-green-800 italic leading-relaxed">
                Landmark coordinates will be used to train the shot classifier. Data collection tools coming soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-green-900/30 text-xs text-green-700">
        <span>33 landmarks · Lite model · GPU accelerated</span>
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-green-600 hover:text-green-400 transition-colors"
        >
          {showStats ? "Hide stats →" : "← Show stats"}
        </button>
      </div>
    </div>
  );
}
