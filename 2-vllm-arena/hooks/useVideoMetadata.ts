"use client";

import { useEffect, useState } from "react";

export function useVideoMetadata(src: string) {
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = src;

    function onLoaded() {
      if (Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    }

    video.addEventListener("loadedmetadata", onLoaded);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.src = "";
    };
  }, [src]);

  return duration;
}
