"use client";

import { ChangeEvent, useEffect, useState } from "react";
import styles from "./enhance.module.css";

type LoadedImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

const EXTERNAL_ENHANCE_API_URL = process.env.NEXT_PUBLIC_IMAGE_ENHANCE_API_URL || "";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fileNameForDownload(originalName: string, format: "png" | "jpeg" | "webp"): string {
  const base = originalName.replace(/\.[^.]+$/, "").trim() || "image";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${base}-enhanced.${extension}`;
}

function readDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image dimensions"));
    };

    img.src = url;
  });
}

export default function EnhanceClient() {
  const [source, setSource] = useState<LoadedImage | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Upload an image to enhance it.");

  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("jpeg");
  const [quality, setQuality] = useState(92);
  const [strength, setStrength] = useState(55);
  const [denoise, setDenoise] = useState(20);

  useEffect(() => {
    return () => {
      if (source) {
        URL.revokeObjectURL(source.previewUrl);
      }
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }
    };
  }, [source, resultUrl]);

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    try {
      const dimensions = await readDimensions(previewUrl);

      setSource((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev.previewUrl);
        }
        return {
          file,
          previewUrl,
          width: dimensions.width,
          height: dimensions.height,
        };
      });

      setResultUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });

      setStatus("Image loaded. Click Enhance Image.");
    } catch {
      URL.revokeObjectURL(previewUrl);
      setStatus("Could not load this image.");
    }
  };

  const enhanceImage = async () => {
    if (!source || isProcessing) {
      return;
    }

    if (!EXTERNAL_ENHANCE_API_URL) {
      setStatus("Set NEXT_PUBLIC_IMAGE_ENHANCE_API_URL to use your Python enhancer API.");
      return;
    }

    setIsProcessing(true);
    setStatus("Enhancing image quality...");

    try {
      const form = new FormData();
      form.append("image", source.file);
      form.append("format", format);
      form.append("quality", String(clamp(quality, 70, 100)));
      form.append("strength", String(clamp(strength, 0, 100)));
      form.append("denoise", String(clamp(denoise, 0, 100)));

      const response = await fetch(EXTERNAL_ENHANCE_API_URL, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        setStatus("Enhancement API returned an error. Check your backend endpoint and request format.");
        setIsProcessing(false);
        return;
      }

      const blob = await response.blob();

      if (!blob) {
        setStatus("Enhancement API returned an empty file.");
        setIsProcessing(false);
        return;
      }

      const url = URL.createObjectURL(blob);

      setResultUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return url;
      });

      setStatus("Enhancement complete. Dimensions are unchanged.");
    } catch {
      setStatus("Enhancement request failed. Make sure your Python API is reachable.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl || !source) {
      return;
    }

    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = fileNameForDownload(source.file.name, format);
    link.click();
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Image Enhancer</h1>
          <p>
            Improve image quality at the same size. This tool reduces noise and sharpens details while preserving
            original dimensions.
          </p>
          <p className={styles.note}>Suggested subdomain: enhance.imageresizer.site</p>
        </section>

        <section className={styles.controls}>
          <label className={styles.uploadBtn}>
            <input type="file" accept="image/*" onChange={onUpload} />
            Upload image
          </label>

          <div className={styles.grid}>
            <label>
              Output format
              <select value={format} onChange={(e) => setFormat(e.target.value as "png" | "jpeg" | "webp")}>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </label>

            <label>
              Quality ({quality})
              <input
                type="range"
                min={70}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </label>

            <label>
              Detail enhancement ({strength})
              <input
                type="range"
                min={0}
                max={100}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
              />
            </label>

            <label>
              Noise reduction ({denoise})
              <input type="range" min={0} max={100} value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} />
            </label>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={enhanceImage} disabled={!source || isProcessing}>
              {isProcessing ? "Enhancing..." : "Enhance Image"}
            </button>
            <button className={styles.secondary} onClick={downloadResult} disabled={!resultUrl}>
              Download Enhanced Image
            </button>
          </div>

          <p className={styles.status}>{status}</p>
        </section>

        <section className={styles.preview}>
          <div className={styles.panel}>
            <h2>Original</h2>
            {source ? (
              <>
                <img src={source.previewUrl} alt="Original upload" className={styles.image} />
                <p>
                  {source.width}x{source.height}px
                </p>
              </>
            ) : (
              <p className={styles.empty}>Upload an image to preview it.</p>
            )}
          </div>

          <div className={styles.panel}>
            <h2>Enhanced</h2>
            {resultUrl ? (
              <>
                <img src={resultUrl} alt="Enhanced output" className={styles.image} />
                {source ? (
                  <p>
                    {source.width}x{source.height}px (same dimensions)
                  </p>
                ) : null}
              </>
            ) : (
              <p className={styles.empty}>Enhanced output will appear here.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
