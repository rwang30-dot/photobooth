"use client";

import React, { useState } from "react";
import { CameraOff, RotateCw, Settings, HelpCircle, ChevronRight, Smartphone, Laptop } from "lucide-react";

interface PermissionDeniedViewProps {
  onRetry: () => void;
  errorMessage?: string;
}

export default function PermissionDeniedView({
  onRetry,
  errorMessage,
}: PermissionDeniedViewProps) {
  const [activeTab, setActiveTab] = useState<"iphone" | "desktop">("iphone");

  return (
    <div className="flex flex-col items-center justify-between min-h-[100dvh] w-full max-w-md mx-auto p-safe bg-zinc-950 text-white">
      {/* Header */}
      <div className="w-full flex items-center justify-center pt-8">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/5">
          <CameraOff className="w-10 h-10 text-red-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 text-center my-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Camera Access Needed
          </h1>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
            The photo booth needs camera access to take your photos. Here is how to turn it on:
          </p>
        </div>

        {/* Device Switcher */}
        <div className="flex bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 max-w-xs mx-auto">
          <button
            onClick={() => setActiveTab("iphone")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "iphone"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab("desktop")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "desktop"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Laptop / Mac
          </button>
        </div>

        {/* Step by step card */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 text-left space-y-3.5 shadow-xl">
          {activeTab === "iphone" ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-sm text-zinc-300">
                  Tap the <strong className="text-white">aA</strong> or{" "}
                  <strong className="text-white">Website Settings</strong> icon on the left of Safari&apos;s address bar.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-sm text-zinc-300">
                  Tap <strong className="text-white">Website Settings</strong> &rarr;{" "}
                  <strong className="text-white">Camera</strong> and select{" "}
                  <strong className="text-emerald-400">Allow</strong>.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-sm text-zinc-300">
                  Or go to iPhone <strong className="text-white">Settings &gt; Safari &gt; Camera</strong> and set to Allow.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-sm text-zinc-300">
                  Click the <strong className="text-white">Camera</strong> or{" "}
                  <strong className="text-white">Lock / Tune</strong> icon in your browser&apos;s URL bar.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-sm text-zinc-300">
                  Switch the Camera setting to <strong className="text-emerald-400">Allow</strong> or{" "}
                  <strong className="text-emerald-400">Always Allow</strong>.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-sm text-zinc-300">
                  Click <strong className="text-white">Try Again</strong> below.
                </div>
              </div>
            </>
          )}
        </div>

        {errorMessage && (
          <p className="text-xs text-zinc-500 font-mono bg-zinc-900/50 py-1.5 px-3 rounded-lg border border-zinc-800 inline-block max-w-full truncate">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Bottom Button */}
      <div className="w-full px-4 pb-6 space-y-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-black font-semibold text-base shadow-lg shadow-white/10 active:scale-[0.98] transition-transform"
        >
          <RotateCw className="w-5 h-5 text-black" />
          Try Again
        </button>
      </div>
    </div>
  );
}
