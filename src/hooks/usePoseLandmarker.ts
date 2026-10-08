"use client";

import { useEffect, useRef, useState } from "react";
import type {
  PoseLandmarker as PoseLandmarkerType,
  DrawingUtils as DrawingUtilsType,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type { NormalizedLandmark };
export type LandmarkList = NormalizedLandmark[];

// MediaPipe 33-landmark indices relevant to cricket
export const CRICKET_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

// Label map for the stats panel
export const LANDMARK_NAMES: Record<number, string> = {
  0:  "Nose",
  11: "L Shoulder", 12: "R Shoulder",
  13: "L Elbow",    14: "R Elbow",
  15: "L Wrist",    16: "R Wrist",
  23: "L Hip",      24: "R Hip",
  25: "L Knee",     26: "R Knee",
  27: "L Ankle",    28: "R Ankle",
};

export interface PoseStats {
  fps: number;
  landmarks: LandmarkList | null;
  /** Average visibility of key cricket landmarks (0–1) */
  bodyConfidence: number;
}

interface UsePoseLandmarkerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  showConnections?: boolean;
  showLandmarks?: boolean;
  highlightCricketPoints?: boolean;
}

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

export function usePoseLandmarker({
  videoRef,
  canvasRef,
  enabled,
  showConnections = true,
  showLandmarks = true,
  highlightCricketPoints = true,
}: UsePoseLandmarkerOptions) {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PoseStats>({
    fps: 0,
    landmarks: null,
    bodyConfidence: 0,
  });

  // Refs — mutated without triggering re-renders
  const landmarkerRef = useRef<PoseLandmarkerType | null>(null);
  // Cache the class itself so we can access static POSE_CONNECTIONS in the loop
  const PoseLandmarkerClassRef = useRef<typeof PoseLandmarkerType | null>(null);
  const DrawingUtilsClassRef = useRef<typeof DrawingUtilsType | null>(null);

  const animFrameRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const fpsRef = useRef({ count: 0, lastTs: performance.now() });

  // ── Load model once ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsModelLoading(true);
    setError(null);

    async function load(delegate: "GPU" | "CPU") {
      const vision_module = await import("@mediapipe/tasks-vision");
      const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision_module;

      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });

      return { landmarker, PoseLandmarker, DrawingUtils };
    }

    (async () => {
      try {
        // Try GPU first, fall back to CPU
        const result = await load("GPU").catch(() => load("CPU"));

        if (cancelled) {
          result.landmarker.close();
          return;
        }

        landmarkerRef.current = result.landmarker;
        PoseLandmarkerClassRef.current = result.PoseLandmarker;
        DrawingUtilsClassRef.current = result.DrawingUtils;

        setModelReady(true);
        setIsModelLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("MediaPipe load failed:", err);
          setError("Failed to load pose model. Check your internet connection.");
          setIsModelLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // ── Detection + draw loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !modelReady) return;

    let running = true;

    function loop() {
      if (!running) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      const PoseLandmarkerClass = PoseLandmarkerClassRef.current;
      const DrawingUtilsClass = DrawingUtilsClassRef.current;

      if (
        !video ||
        !canvas ||
        !landmarker ||
        !PoseLandmarkerClass ||
        !DrawingUtilsClass ||
        video.readyState < 2
      ) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Sync canvas resolution to video intrinsic size
      const { videoWidth, videoHeight } = video;
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth || 1280;
        canvas.height = videoHeight || 720;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Only detect when a new video frame has arrived
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        const result = landmarker.detectForVideo(video, performance.now());
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result.landmarks.length > 0) {
          const lm = result.landmarks[0];
          const du = new DrawingUtilsClass(ctx);

          if (showConnections) {
            du.drawConnectors(lm, PoseLandmarkerClass.POSE_CONNECTIONS, {
              color: "rgba(0, 255, 120, 0.6)",
              lineWidth: 2,
            });
          }

          if (showLandmarks) {
            du.drawLandmarks(lm, {
              color: "rgba(255, 255, 255, 0.9)",
              fillColor: "rgba(0, 200, 100, 0.7)",
              radius: 4,
            });
          }

          // Cricket joint highlights
          if (highlightCricketPoints) {
            (Object.values(CRICKET_LANDMARKS) as number[]).forEach((idx) => {
              const point = lm[idx];
              if (!point || (point.visibility ?? 1) < 0.3) return;

              const x = point.x * canvas.width;
              const y = point.y * canvas.height;
              const isWrist = idx === 15 || idx === 16;

              ctx.beginPath();
              ctx.arc(x, y, isWrist ? 8 : 6, 0, Math.PI * 2);
              ctx.fillStyle = isWrist
                ? "rgba(255, 80, 80, 0.9)"
                : "rgba(255, 200, 0, 0.85)";
              ctx.fill();
              ctx.strokeStyle = "white";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            });
          }

          // Body confidence = mean visibility of cricket landmarks
          const cricketIndices = Object.values(CRICKET_LANDMARKS) as number[];
          const meanVis =
            cricketIndices.reduce(
              (sum, i) => sum + (lm[i]?.visibility ?? 0),
              0
            ) / cricketIndices.length;

          // FPS counter — update state at most once per second
          const now = performance.now();
          fpsRef.current.count++;
          if (now - fpsRef.current.lastTs >= 1000) {
            const fps = Math.round(
              (fpsRef.current.count * 1000) /
                (now - fpsRef.current.lastTs)
            );
            fpsRef.current = { count: 0, lastTs: now };
            setStats({ fps, landmarks: lm, bodyConfidence: meanVis });
          }
        } else {
          // No pose detected
          setStats((s) => ({ ...s, landmarks: null, bodyConfidence: 0 }));
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    enabled,
    modelReady,
    videoRef,
    canvasRef,
    showConnections,
    showLandmarks,
    highlightCricketPoints,
  ]);

  return { isModelLoading, modelReady, error, stats };
}
