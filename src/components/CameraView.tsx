"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Share,
  Info,
} from "lucide-react";
import { playCountdownBeep, playShutterSound, playCelebrationSound } from "@/lib/sound";
import PermissionDeniedView from "./PermissionDeniedView";

interface CameraViewProps {
  onPhotosCaptured: (photos: string[]) => void;
}

export default function CameraView({ onPhotosCaptured }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMuted, setIsMuted] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState("");

  // Photo sequence state
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentShot, setCurrentShot] = useState(0); // 0 to 3
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [recentThumbnails, setRecentThumbnails] = useState<string[]>([]);
  const [showPwaTip, setShowPwaTip] = useState(false);

  // Check if running in standalone iOS PWA mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone =
        (window.navigator as unknown as { standalone?: boolean }).standalone ||
        window.matchMedia("(display-mode: standalone)").matches;
      // Show PWA tip if on iOS Safari and not installed
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos && !isStandalone) {
        setShowPwaTip(true);
      }
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async (mode: "user" | "environment") => {
    setHasPermissionError(false);
    setPermissionErrorMessage("");

    // Stop existing tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((err) => {
          console.warn("Auto-play error:", err);
        });
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const error = err as { name?: string; message?: string };
      setHasPermissionError(true);
      setPermissionErrorMessage(
        error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
          ? "Permission denied by user or system"
          : error.message || "Could not access camera"
      );
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Flip camera toggle
  const toggleCamera = () => {
    if (isCapturing) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Helper wait function
  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Snap single photo from video element
  const captureFrame = (): string => {
    const video = videoRef.current;
    if (!video) return "";

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 960;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.save();
    // Front camera is mirrored in preview, mirror the captured frame to match
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.95);
  };

  // Shutter trigger: 4 photos with countdown & flash
  const handleShutterTap = async () => {
    if (isCapturing || !stream) return;

    setIsCapturing(true);
    setRecentThumbnails([]);
    const photos: string[] = [];

    for (let shot = 0; shot < 4; shot++) {
      setCurrentShot(shot + 1);

      // 3-2-1 Countdown
      for (let count = 3; count >= 1; count--) {
        setCountdown(count);
        if (!isMuted) {
          playCountdownBeep(count === 1);
        }
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(35);
        }
        await wait(1000);
      }

      setCountdown(null);

      // Flash & Snap
      setIsFlashing(true);
      if (!isMuted) {
        playShutterSound();
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([60, 30, 60]);
      }

      const photoData = captureFrame();
      if (photoData) {
        photos.push(photoData);
        setRecentThumbnails([...photos]);
      }

      // Keep flash visible briefly
      await wait(350);
      setIsFlashing(false);

      // If not the last shot, pause 1.2s for posing
      if (shot < 3) {
        await wait(1200);
      }
    }

    if (!isMuted) {
      playCelebrationSound();
    }
    await wait(400);

    setIsCapturing(false);
    onPhotosCaptured(photos);
  };

  if (hasPermissionError) {
    return (
      <PermissionDeniedView
        onRetry={() => startCamera(facingMode)}
        errorMessage={permissionErrorMessage}
      />
    );
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
      {/* Live Camera Viewfinder */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
          facingMode === "user" ? "scale-x-[-1]" : "scale-x-100"
        }`}
      />

      {/* Subtle Viewfinder Framing Grid/Guide */}
      <div className="absolute inset-0 pointer-events-none opacity-20 border-[16px] border-black/40">
        <div className="w-full h-full border border-white/30 rounded-3xl" />
      </div>

      {/* Screen Flash Overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white pointer-events-none animate-flash z-50" />
      )}

      {/* Top Bar Controls (Safe Area) */}
      <div className="absolute top-0 inset-x-0 pt-safe px-4 z-40 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Logo Badge */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-white">BOOTH</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Flip Camera Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleCamera}
            disabled={isCapturing}
            className={`w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 ${
              isCapturing ? "opacity-30 cursor-not-allowed" : "hover:bg-black/60"
            }`}
            aria-label="Flip camera"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Standalone PWA tip for iOS Safari */}
      {showPwaTip && !isCapturing && (
        <div className="absolute top-16 inset-x-4 z-30 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 text-zinc-200 text-xs px-3.5 py-2.5 rounded-2xl shadow-xl animate-fade-in">
          <div className="flex items-center gap-2 flex-1 pr-2">
            <Share className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Tap <strong>Share</strong> &gt; <strong>Add to Home Screen</strong> for fullscreen app
            </span>
          </div>
          <button
            onClick={() => setShowPwaTip(false)}
            className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress Dots / Shot Counter while capturing */}
      {isCapturing && (
        <div className="absolute top-16 inset-x-0 z-40 flex flex-col items-center gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full flex items-center gap-3 shadow-lg">
            <span className="text-xs font-bold text-white tracking-wide">
              PHOTO {currentShot} OF 4
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < currentShot
                      ? "bg-emerald-400 scale-100"
                      : i === currentShot
                      ? "bg-white scale-125 ring-2 ring-white/50"
                      : "bg-white/25 scale-75"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Big Animated 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute w-44 h-44 rounded-full border-4 border-white/20 animate-ping opacity-60" />
            <div className="w-32 h-32 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
              <span
                key={countdown}
                className="text-7xl font-black text-white tracking-tighter animate-countdown drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              >
                {countdown}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Posing Banner between shots */}
      {isCapturing && countdown === null && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-2 shadow-2xl">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <span className="text-base font-semibold text-white">Strike a pose!</span>
          </div>
        </div>
      )}

      {/* Bottom Shutter Controls (Safe Area) */}
      <div className="absolute bottom-0 inset-x-0 pb-safe pt-6 px-6 z-40 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center">
        {/* Helper tip */}
        {!isCapturing && (
          <p className="text-xs text-white/70 font-medium mb-3 tracking-wide drop-shadow-md">
            Tap shutter to take 4 photos
          </p>
        )}

        <div className="w-full max-w-xs flex items-center justify-between">
          {/* Left: Thumbnail preview or placeholder */}
          <div className="w-12 h-12 flex items-center justify-center">
            {recentThumbnails.length > 0 ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-white/80 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recentThumbnails[recentThumbnails.length - 1]}
                  alt="Recent shot"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/30 text-[10px]">
                4x
              </div>
            )}
          </div>

          {/* Center: Big Round Shutter Button */}
          <button
            onClick={handleShutterTap}
            disabled={isCapturing}
            className={`relative w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center p-1.5 shadow-2xl active:scale-95 transition-all shutter-btn ${
              isCapturing ? "opacity-40 cursor-not-allowed" : "hover:scale-105"
            }`}
            aria-label="Take 4 photos"
          >
            <div
              className={`w-full h-full rounded-full bg-white transition-transform duration-150 shutter-inner shadow-inner ${
                isCapturing ? "bg-red-500 rounded-md scale-50" : ""
              }`}
            />
          </button>

          {/* Right: Camera icon spacer / status */}
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/40">
              <Camera className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
