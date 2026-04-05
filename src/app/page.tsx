"use client";

import Image from "next/image";
import {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./page.module.css";

type ResizeDirection = "top" | "right" | "bottom" | "left";

type UploadedImage = {
  id: string;
  fileName: string;
  src: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
};

const PRESETS = [
  { label: "LinkedIn Cover", width: 1500, height: 500 },
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Cover", width: 1640, height: 624 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
];

const MIN_DIMENSION = 50;
const MAX_DIMENSION = 5000;

function loadImageMetadata(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      resolve({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        src,
        originalWidth: image.width,
        originalHeight: image.height,
        width: image.width,
        height: image.height,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error(`Failed to load ${file.name}`));
    };

    image.src = src;
  });
}

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");

  const imageUrlsRef = useRef<string[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    scale: number;
  } | null>(null);

  useEffect(() => {
    imageUrlsRef.current = images.map((image) => image.src);
  }, [images]);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((src) => URL.revokeObjectURL(src));
    };
  }, []);

  useEffect(() => {
    if (!stageRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setStageSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });

    observer.observe(stageRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedId) ?? null,
    [images, selectedId],
  );

  const availableWidth = Math.max(stageSize.width - 28, MIN_DIMENSION);
  const availableHeight = Math.max(stageSize.height - 28, MIN_DIMENSION);
  const fitScale = selectedImage
    ? Math.min(1, availableWidth / selectedImage.width, availableHeight / selectedImage.height)
    : 1;
  const displayWidth = selectedImage ? Math.max(1, Math.round(selectedImage.width * fitScale)) : 0;
  const displayHeight = selectedImage ? Math.max(1, Math.round(selectedImage.height * fitScale)) : 0;

  const updateImageById = (id: string, nextWidth: number, nextHeight: number) => {
    const width = Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(nextWidth)));
    const height = Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(nextHeight)));

    setImages((prev) =>
      prev.map((image) =>
        image.id === id
          ? {
              ...image,
              width,
              height,
            }
          : image,
      ),
    );
  };

  const updateSelectedImage = (nextWidth: number, nextHeight: number) => {
    if (!selectedId) {
      return;
    }

    updateImageById(selectedId, nextWidth, nextHeight);
  };

  const appendFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const loadedImages = await Promise.allSettled(files.map((file) => loadImageMetadata(file)));
    const validImages = loadedImages
      .filter((result): result is PromiseFulfilledResult<UploadedImage> => result.status === "fulfilled")
      .map((result) => result.value);

    if (validImages.length === 0) {
      return;
    }

    setImages((prev) => [...prev, ...validImages]);
    setSelectedId((current) => current ?? validImages[0].id);
  };

  const handleFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    await appendFiles(files);
    event.target.value = "";
  };

  const handleWidthInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedImage) {
      return;
    }

    const nextWidth = Number(event.target.value);
    if (!Number.isFinite(nextWidth)) {
      return;
    }

    if (!lockAspectRatio) {
      updateSelectedImage(nextWidth, selectedImage.height);
      return;
    }

    const ratio = selectedImage.originalHeight / selectedImage.originalWidth;
    updateSelectedImage(nextWidth, nextWidth * ratio);
  };

  const handleHeightInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedImage) {
      return;
    }

    const nextHeight = Number(event.target.value);
    if (!Number.isFinite(nextHeight)) {
      return;
    }

    if (!lockAspectRatio) {
      updateSelectedImage(selectedImage.width, nextHeight);
      return;
    }

    const ratio = selectedImage.originalWidth / selectedImage.originalHeight;
    updateSelectedImage(nextHeight * ratio, nextHeight);
  };

  const applyPreset = (width: number, height: number) => {
    updateSelectedImage(width, height);
  };

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>, direction: ResizeDirection) => {
    if (!selectedImage) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      id: selectedImage.id,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: selectedImage.width,
      startHeight: selectedImage.height,
      scale: fitScale,
    };
  };

  const handleResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) {
      return;
    }

    const scale = dragRef.current.scale || 1;
    const deltaX = (event.clientX - dragRef.current.startX) / scale;
    const deltaY = (event.clientY - dragRef.current.startY) / scale;

    let nextWidth = dragRef.current.startWidth;
    let nextHeight = dragRef.current.startHeight;

    if (dragRef.current.direction === "right") {
      nextWidth = dragRef.current.startWidth + deltaX;
    }

    if (dragRef.current.direction === "left") {
      nextWidth = dragRef.current.startWidth - deltaX;
    }

    if (dragRef.current.direction === "bottom") {
      nextHeight = dragRef.current.startHeight + deltaY;
    }

    if (dragRef.current.direction === "top") {
      nextHeight = dragRef.current.startHeight - deltaY;
    }

    updateImageById(dragRef.current.id, nextWidth, nextHeight);
  };

  const stopResize = () => {
    dragRef.current = null;
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.src);
      }

      const next = prev.filter((image) => image.id !== id);
      setSelectedId((current) => (current === id ? (next[0]?.id ?? null) : current));
      return next;
    });
  };

  const clearAll = () => {
    images.forEach((image) => URL.revokeObjectURL(image.src));
    setImages([]);
    setSelectedId(null);
  };

  const removeSelected = () => {
    if (!selectedImage) {
      return;
    }

    removeImage(selectedImage.id);
  };

  const handleDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    await appendFiles(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const downloadSelected = async () => {
    if (!selectedImage) {
      return;
    }

    const source = new window.Image();
    source.src = selectedImage.src;

    await new Promise<void>((resolve, reject) => {
      source.onload = () => resolve();
      source.onerror = () => reject(new Error("Image loading failed."));
    });

    const targetW = selectedImage.width;
    const targetH = selectedImage.height;
    const sourceRatio = source.width / source.height;
    const targetRatio = targetW / targetH;

    let scaledWidth: number;
    let scaledHeight: number;

    if (sourceRatio > targetRatio) {
      scaledHeight = targetH;
      scaledWidth = targetH * sourceRatio;
    } else {
      scaledWidth = targetW;
      scaledHeight = targetW / sourceRatio;
    }

    const offsetX = (targetW - scaledWidth) / 2;
    const offsetY = (targetH - scaledHeight) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    if (exportFormat === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight);

    const mimeType = exportFormat === "png" ? "image/png" : "image/jpeg";
    const quality = exportFormat === "jpeg" ? 0.92 : undefined;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality));
    if (!blob) {
      return;
    }

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = selectedImage.fileName.replace(/\.[^/.]+$/, "");
    link.href = downloadUrl;
    link.download = `${safeName}-${targetW}x${targetH}.${exportFormat === "png" ? "png" : "jpg"}`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.seoIntro}>
          <h1>Image Resizer Online</h1>
          <p>
            Resize images in pixels and export for LinkedIn cover, Instagram post/story, Facebook cover, and YouTube
            thumbnail.
          </p>
        </section>

        <header className={styles.toolbar}>
          <label className={styles.primaryButton}>
            Upload
            <input type="file" accept="image/*" multiple onChange={handleFilesUpload} />
          </label>

          <select
            className={styles.selectField}
            value={selectedId ?? ""}
            onChange={(event) => setSelectedId(event.target.value || null)}
            disabled={images.length === 0}
          >
            {images.length === 0 && <option value="">No image selected</option>}
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                {image.fileName}
              </option>
            ))}
          </select>

          <button type="button" className={styles.secondaryButton} onClick={clearAll} disabled={images.length === 0}>
            Clear
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={removeSelected}
            disabled={!selectedImage}
          >
            Remove
          </button>
        </header>

        <section className={styles.workspace}>
          <section
            className={`${styles.stage} ${isDragging ? styles.stageDragging : ""}`}
            ref={stageRef}
            onPointerMove={handleResizeMove}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            onPointerLeave={stopResize}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            {!selectedImage && (
              <label className={styles.emptyStateUpload}>
                <input type="file" accept="image/*" multiple onChange={handleFilesUpload} />
                <strong>Drop images here</strong>
                <span>or click to upload</span>
              </label>
            )}

            {selectedImage && (
              <div className={styles.centerWrap}>
                <div className={styles.dimTop}>{selectedImage.width}px</div>
                <div className={styles.dimSide}>{selectedImage.height}px</div>
                <div className={styles.mainCard} style={{ width: displayWidth, height: displayHeight }}>
                  <Image
                    src={selectedImage.src}
                    alt={selectedImage.fileName}
                    width={displayWidth}
                    height={displayHeight}
                    unoptimized
                    className={styles.preview}
                    style={{ objectPosition: "50% 50%" }}
                  />

                  <button
                    type="button"
                    className={`${styles.resizeHandle} ${styles.handleTop}`}
                    onPointerDown={(event) => startResize(event, "top")}
                    aria-label="Resize height"
                    title="Resize height"
                  />
                  <button
                    type="button"
                    className={`${styles.resizeHandle} ${styles.handleRight}`}
                    onPointerDown={(event) => startResize(event, "right")}
                    aria-label="Resize width"
                    title="Resize width"
                  />
                  <button
                    type="button"
                    className={`${styles.resizeHandle} ${styles.handleBottom}`}
                    onPointerDown={(event) => startResize(event, "bottom")}
                    aria-label="Resize height"
                    title="Resize height"
                  />
                  <button
                    type="button"
                    className={`${styles.resizeHandle} ${styles.handleLeft}`}
                    onPointerDown={(event) => startResize(event, "left")}
                    aria-label="Resize width"
                    title="Resize width"
                  />
                </div>
              </div>
            )}
          </section>

          <aside className={styles.controls}>
            <div className={styles.group}>
              <p className={styles.groupTitle}>Dimensions</p>
              <div className={styles.fieldRow}>
                <label htmlFor="width">Width</label>
                <input
                  id="width"
                  type="number"
                  min={MIN_DIMENSION}
                  max={MAX_DIMENSION}
                  value={selectedImage?.width ?? ""}
                  onChange={handleWidthInput}
                  disabled={!selectedImage}
                />
              </div>
              <div className={styles.fieldRow}>
                <label htmlFor="height">Height</label>
                <input
                  id="height"
                  type="number"
                  min={MIN_DIMENSION}
                  max={MAX_DIMENSION}
                  value={selectedImage?.height ?? ""}
                  onChange={handleHeightInput}
                  disabled={!selectedImage}
                />
              </div>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={lockAspectRatio}
                  onChange={(event) => setLockAspectRatio(event.target.checked)}
                  disabled={!selectedImage}
                />
                Keep ratio
              </label>
            </div>

            <div className={styles.group}>
              <p className={styles.groupTitle}>Presets</p>
              <div className={styles.presetGrid}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={styles.presetButton}
                    onClick={() => applyPreset(preset.width, preset.height)}
                    disabled={!selectedImage}
                  >
                    <span>{preset.label}</span>
                    <small>
                      {preset.width} x {preset.height}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <p className={styles.groupTitle}>Export</p>
              <div className={styles.exportRow}>
                <label htmlFor="format">Format</label>
                <select
                  id="format"
                  className={styles.selectField}
                  value={exportFormat}
                  onChange={(event) => setExportFormat(event.target.value as "png" | "jpeg")}
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                </select>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={downloadSelected}
                disabled={!selectedImage}
              >
                Download
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
