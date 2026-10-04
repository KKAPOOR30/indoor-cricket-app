"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface CameraFeedProps {
  onReady: () => void;
  onError: (message: string) => void;
}

export default function CameraFeed({ onReady, onError }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(
    async (facing: "user" | "environment") => {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      setIsLoading(true);

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video metadata to be loaded before calling onReady
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsLoading(false);
            onReady();
          };
        }
      } catch (err) {
        setIsLoading(false);
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            onError("Camera permission was denied. Please allow camera access and try again.");
          } else if (err.name === "NotFoundError") {
            onError("No camera was found on this device.");
          } else if (err.name === "NotReadableError") {
            onError("Camera is already in use by another application.");
          } else {
            onError(`Camera error: ${err.message}`);
          }
        } else {
          onError("An unexpected error occurred while accessing the camera.");
        }
      }
    },
    [onReady, onError]
  );

  // Start camera on mount
  useEffect(() => {
    startCamera(facingMode);

    // Cleanup on unmount — stop all tracks
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  return (
    <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-green-800/40 shadow-2xl shadow-black/60 bg-black">
      {/* Video element — mirrored for front-facing (natural feel) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-auto object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        style={{ minHeight: "320px", maxHeight: "480px" }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-green-500/30 border-t-green-400 animate-spin" />
          <p className="text-green-300 text-sm">Connecting to camera…</p>
        </div>
      )}

      {/* Corner guides overlay — shows when camera is ready */}
      {!isLoading && (
        <>
          {/* Corner brackets */}
          {[
            "top-3 left-3 border-t-2 border-l-2",
            "top-3 right-3 border-t-2 border-r-2",
            "bottom-3 left-3 border-b-2 border-l-2",
            "bottom-3 right-3 border-b-2 border-r-2",
          ].map((cls) => (
            <div key={cls} className={`absolute w-6 h-6 border-green-400/70 ${cls}`} />
          ))}

          {/* Body position guide */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-green-800/50 text-green-300 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Stand 2–3 m back · Full body in frame
            </div>
          </div>

          {/* Flip camera button (useful on mobile) */}
          <button
            onClick={handleFlipCamera}
            title="Flip camera"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-green-800/50 flex items-center justify-center text-green-300 hover:text-green-100 hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
