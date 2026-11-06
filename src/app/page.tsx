"use client";

import React, { useState } from "react";
import CameraView from "@/components/CameraView";
import ResultsView from "@/components/ResultsView";

export default function Home() {
  const [capturedPhotos, setCapturedPhotos] = useState<string[] | null>(null);

  const handleRetake = () => {
    setCapturedPhotos(null);
  };

  return (
    <main className="h-full w-full bg-black">
      {capturedPhotos && capturedPhotos.length > 0 ? (
        <ResultsView photos={capturedPhotos} onRetake={handleRetake} />
      ) : (
        <CameraView onPhotosCaptured={setCapturedPhotos} />
      )}
    </main>
  );
}
