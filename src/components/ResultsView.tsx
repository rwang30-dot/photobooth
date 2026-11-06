"use client";

import React, { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Share2,
  Download,
  Check,
  Palette,
  Sparkles,
  Sliders,
  ChevronDown,
} from "lucide-react";
import {
  generatePhotoStrip,
  BorderTheme,
  FilterType,
  THEME_CONFIGS,
  FILTER_CONFIGS,
} from "@/lib/stripGenerator";

interface ResultsViewProps {
  photos: string[];
  onRetake: () => void;
}

export default function ResultsView({ photos, onRetake }: ResultsViewProps) {
  const [stripUrl, setStripUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [theme, setTheme] = useState<BorderTheme>("film");
  const [filter, setFilter] = useState<FilterType>("normal");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#ffffff", "#f43f5e", "#fbbf24", "#38bdf8"],
      });
    } catch (e) {
      console.debug("Confetti error", e);
    }
  }, []);

  // Check if native file sharing is supported on this browser
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      try {
        const testFile = new File(["test"], "test.png", { type: "image/png" });
        if (
          "canShare" in navigator &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [testFile] }) &&
          "share" in navigator &&
          typeof navigator.share === "function"
        ) {
          setCanNativeShare(true);
        } else {
          setCanNativeShare(false);
        }
      } catch {
        setCanNativeShare(false);
      }
    }
  }, []);

  // Generate photo strip whenever theme or filter changes
  const buildStrip = useCallback(async () => {
    setIsGenerating(true);
    try {
      const url = await generatePhotoStrip(photos, {
        theme,
        filter,
        showDate: true,
      });
      setStripUrl(url);
    } catch (err) {
      console.error("Failed to generate photo strip:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [photos, theme, filter]);

  useEffect(() => {
    buildStrip();
  }, [buildStrip]);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Direct download fallback
  const downloadDirect = () => {
    if (!stripUrl) return;
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `photobooth-strip-${dateStamp}.png`;
    const link = document.createElement("a");
    link.href = stripUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded photo strip!");
  };

  // Handle Save button
  const handleSave = async () => {
    if (!stripUrl || isSaving) return;
    setIsSaving(true);

    try {
      const res = await fetch(stripUrl);
      const blob = await res.blob();
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `photobooth-strip-${dateStamp}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Check if Web Share API with files is supported
      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] }) &&
        "share" in navigator &&
        typeof navigator.share === "function"
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Photo Booth Strip",
            text: "Taken with Photo Booth!",
          });
          showToast("Shared! Tap 'Save Image' in sheet to save to Photos.");
        } catch (shareErr: unknown) {
          const err = shareErr as { name?: string };
          // If user didn't explicitly cancel, fallback to download
          if (err.name !== "AbortError") {
            downloadDirect();
          }
        }
      } else {
        // Laptop / desktop or unsupported browser: download directly
        downloadDirect();
      }
    } catch (err) {
      console.error("Save error:", err);
      downloadDirect();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-zinc-950 text-white select-none overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 inset-x-4 z-50 flex items-center justify-center pointer-events-none animate-bounce">
          <div className="bg-zinc-800/95 border border-zinc-700/80 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header (Safe Area) */}
      <div className="w-full pt-safe px-5 pb-3 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h1 className="text-base font-bold tracking-tight text-white">Your Photo Strip</h1>
        </div>

        {/* Quick Download icon button */}
        <button
          onClick={downloadDirect}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
          aria-label="Download image"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Scrollable Preview Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center justify-start space-y-4">
        {/* Strip Image Card with Photo Booth Shadow */}
        <div className="relative group max-w-[310px] w-full my-auto flex flex-col items-center">
          {isGenerating ? (
            <div className="w-[280px] h-[580px] rounded-2xl bg-zinc-900/60 animate-pulse flex flex-col items-center justify-center gap-3 border border-zinc-800">
              <Sparkles className="w-6 h-6 text-zinc-500 animate-spin" />
              <span className="text-xs text-zinc-400 font-medium">Printing photo strip...</span>
            </div>
          ) : stripUrl ? (
            <div className="relative transition-transform duration-200 shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stripUrl}
                alt="Combined Photo Booth Strip"
                className="w-full max-h-[58dvh] object-contain block mx-auto rounded-md shadow-2xl"
              />
            </div>
          ) : null}
        </div>

        {/* Customization controls */}
        <div className="w-full max-w-sm bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 space-y-3">
          {/* Border Theme Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400 px-1">
              <span>Border Style</span>
              <span className="text-zinc-500 text-[11px] capitalize">{THEME_CONFIGS[theme].name}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(Object.keys(THEME_CONFIGS) as BorderTheme[]).map((tKey) => {
                const isSelected = theme === tKey;
                return (
                  <button
                    key={tKey}
                    onClick={() => setTheme(tKey)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all border ${
                      isSelected
                        ? "bg-white text-black border-white shadow-sm scale-[1.02]"
                        : "bg-zinc-800/70 text-zinc-400 border-zinc-700/50 hover:text-zinc-200"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 flex items-center justify-center"
                      style={{ backgroundColor: THEME_CONFIGS[tKey].bg }}
                    >
                      {tKey === "film" && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                    </span>
                    <span className="truncate max-w-full">
                      {tKey === "film" ? "35mm" : THEME_CONFIGS[tKey].name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Preset Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400 px-1">
              <span>Photo Filter</span>
              <span className="text-zinc-500 text-[11px] capitalize">{FILTER_CONFIGS[filter].name}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(FILTER_CONFIGS) as FilterType[]).map((fKey) => {
                const isSelected = filter === fKey;
                return (
                  <button
                    key={fKey}
                    onClick={() => setFilter(fKey)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm scale-[1.02]"
                        : "bg-zinc-800/70 text-zinc-400 border-zinc-700/50 hover:text-zinc-200"
                    }`}
                  >
                    <span className="truncate">{FILTER_CONFIGS[fKey].name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar (Safe Area) */}
      <div className="w-full pb-safe pt-3 px-4 bg-zinc-950/95 border-t border-zinc-900 backdrop-blur-lg z-20">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          {/* Retake Button */}
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold text-sm active:scale-[0.98] transition-all hover:bg-zinc-800"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400" />
            <span>Retake</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!stripUrl || isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white text-black font-semibold text-sm shadow-xl shadow-white/10 active:scale-[0.98] transition-all hover:bg-zinc-100 disabled:opacity-50"
          >
            {canNativeShare ? (
              <Share2 className="w-4 h-4 text-black" />
            ) : (
              <Download className="w-4 h-4 text-black" />
            )}
            <span>{canNativeShare ? "Save" : "Save"}</span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 text-center mt-2 font-medium">
          {canNativeShare
            ? "Tap Save to open Photos share sheet"
            : "Saves high-res image strip"}
        </p>
      </div>
    </div>
  );
}
