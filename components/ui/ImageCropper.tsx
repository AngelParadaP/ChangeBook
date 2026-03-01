"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Square, RectangleHorizontal, RectangleVertical } from "lucide-react";

export interface AspectRatioOption {
  label: string;
  value: number; // width / height
  icon?: "square" | "landscape" | "portrait";
}

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number; // default/initial aspect ratio
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
  quality?: number;
  /** If provided, shows aspect ratio selector buttons */
  aspectRatios?: AspectRatioOption[];
}

export default function ImageCropper({
  imageSrc,
  aspectRatio: initialAspectRatio,
  onCropComplete,
  onCancel,
  quality = 0.85,
  aspectRatios,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [activeRatio, setActiveRatio] = useState(initialAspectRatio);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Calculate crop area dimensions (for display only)
  const CONTAINER_SIZE = 360;
  const cropWidth = activeRatio >= 1 ? CONTAINER_SIZE : CONTAINER_SIZE * activeRatio;
  const cropHeight = activeRatio >= 1 ? CONTAINER_SIZE / activeRatio : CONTAINER_SIZE;

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Calculate initial zoom to fill the crop area
      const cw = activeRatio >= 1 ? CONTAINER_SIZE : CONTAINER_SIZE * activeRatio;
      const ch = activeRatio >= 1 ? CONTAINER_SIZE / activeRatio : CONTAINER_SIZE;
      const scaleX = cw / img.width;
      const scaleY = ch / img.height;
      const initialZoom = Math.max(scaleX, scaleY);
      setZoom(initialZoom);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // When aspect ratio changes, recalculate zoom & reset offset
  const handleRatioChange = (newRatio: number) => {
    setActiveRatio(newRatio);
    const img = imageRef.current;
    if (!img) return;
    const cw = newRatio >= 1 ? CONTAINER_SIZE : CONTAINER_SIZE * newRatio;
    const ch = newRatio >= 1 ? CONTAINER_SIZE / newRatio : CONTAINER_SIZE;
    const scaleX = cw / img.width;
    const scaleY = ch / img.height;
    const newZoom = Math.max(scaleX, scaleY);
    setZoom(newZoom);
    setOffset({ x: 0, y: 0 });
  };

  // Draw canvas (display only — low res preview)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawWidth = img.width * zoom;
    const drawHeight = img.height * zoom;
    const drawX = (cropWidth - drawWidth) / 2 + offset.x;
    const drawY = (cropHeight - drawHeight) / 2 + offset.y;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }, [zoom, offset, imageLoaded, cropWidth, cropHeight]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Clamp offset so the image always covers the crop window
  const clampOffset = useCallback((ox: number, oy: number, currentZoom: number) => {
    const img = imageRef.current;
    if (!img) return { x: ox, y: oy };
    const drawWidth = img.width * currentZoom;
    const drawHeight = img.height * currentZoom;
    const maxX = Math.max(0, (drawWidth - cropWidth) / 2);
    const maxY = Math.max(0, (drawHeight - cropHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    };
  }, [cropWidth, cropHeight]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(clampOffset(rawX, rawY, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Zoom
  const handleZoomIn = () => {
    setZoom((z) => {
      const newZoom = Math.min(z * 1.2, 10);
      setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
      return newZoom;
    });
  };
  const handleZoomOut = () => {
    setZoom((z) => {
      const img = imageRef.current;
      if (!img) return z;
      const minZoom = Math.max(cropWidth / img.width, cropHeight / img.height);
      const newZoom = Math.max(z / 1.2, minZoom);
      setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
      return newZoom;
    });
  };

  const handleReset = () => {
    const img = imageRef.current;
    if (!img) return;
    const scaleX = cropWidth / img.width;
    const scaleY = cropHeight / img.height;
    setZoom(Math.max(scaleX, scaleY));
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  // Crop and export at ORIGINAL resolution (no downscaling)
  const handleCrop = async () => {
    const img = imageRef.current;
    if (!img) return;
    setProcessing(true);

    try {
      const drawWidth = img.width * zoom;
      const drawHeight = img.height * zoom;
      const drawX = (cropWidth - drawWidth) / 2 + offset.x;
      const drawY = (cropHeight - drawHeight) / 2 + offset.y;

      // Source rect in original image coordinates
      const srcX = Math.max(0, -drawX / zoom);
      const srcY = Math.max(0, -drawY / zoom);
      const srcRight = Math.min(img.width, (cropWidth - drawX) / zoom);
      const srcBottom = Math.min(img.height, (cropHeight - drawY) / zoom);
      const srcW = srcRight - srcX;
      const srcH = srcBottom - srcY;

      // Output canvas at original pixel dimensions
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = Math.round(srcW);
      outputCanvas.height = Math.round(srcH);

      const ctx = outputCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

      ctx.drawImage(
        img,
        srcX, srcY, srcW, srcH,
        0, 0, outputCanvas.width, outputCanvas.height
      );

      // Export as WebP
      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          },
          "image/webp",
          quality
        );
      });

      const previewUrl = URL.createObjectURL(blob);
      onCropComplete(blob, previewUrl);
    } catch (error) {
      console.error("Error cropping image:", error);
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error("Failed to create blob"));
            },
            "image/jpeg",
            quality
          );
        });
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(blob, previewUrl);
      } catch {
        console.error("Fallback crop also failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  const getRatioIcon = (icon?: string) => {
    switch (icon) {
      case "square": return <Square size={14} />;
      case "landscape": return <RectangleHorizontal size={14} />;
      case "portrait": return <RectangleVertical size={14} />;
      default: return null;
    }
  };

  const getAspectLabel = () => {
    if (aspectRatios) {
      const active = aspectRatios.find((r) => Math.abs(r.value - activeRatio) < 0.01);
      if (active) return active.label;
    }
    if (activeRatio === 1) return "1:1";
    if (Math.abs(activeRatio - 2 / 3) < 0.01) return "2:3";
    if (Math.abs(activeRatio - 3 / 2) < 0.01) return "3:2";
    if (Math.abs(activeRatio - 4 / 3) < 0.01) return "4:3";
    if (Math.abs(activeRatio - 16 / 9) < 0.01) return "16:9";
    return `${activeRatio.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Recortar imagen
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aspect ratio selector */}
        {aspectRatios && aspectRatios.length > 1 && (
          <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-1">Proporción:</span>
              {aspectRatios.map((ratio) => {
                const isActive = Math.abs(ratio.value - activeRatio) < 0.01;
                return (
                  <button
                    key={ratio.label}
                    onClick={() => handleRatioChange(ratio.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-sm"
                        : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600"
                    }`}
                  >
                    {getRatioIcon(ratio.icon)}
                    {ratio.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Crop Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-gray-950">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl border-2 border-white/20 transition-all duration-200"
            style={{
              width: cropWidth,
              height: cropHeight,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: cropWidth,
                height: cropHeight,
              }}
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-white/15"
                  />
                ))}
              </div>
            </div>

            {/* Drag hint */}
            {!isDragging && imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 transition-opacity">
                <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Move size={12} />
                  Arrastra para mover
                </div>
              </div>
            )}
          </div>

          {/* Aspect ratio indicator */}
          <p className="text-xs text-gray-400 mt-3">
            {getAspectLabel()}
          </p>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
          {/* Zoom slider */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.01}
              value={zoom}
              onChange={(e) => {
                const newZoom = parseFloat(e.target.value);
                const img = imageRef.current;
                if (img) {
                  const minZoom = Math.max(cropWidth / img.width, cropHeight / img.height);
                  const clampedZoom = Math.max(newZoom, minZoom);
                  setZoom(clampedZoom);
                  setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
                }
              }}
              className="flex-1 accent-purple-600 h-1.5"
            />
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
              title="Resetear"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrop}
              disabled={processing || !imageLoaded}
              className="px-5 py-2.5 bg-light-purple hover:bg-dark-purple text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Aplicar recorte
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
