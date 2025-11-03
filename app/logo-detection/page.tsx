'use client';

import { useState, useRef, useEffect } from 'react';
import { detectLogos, Detection } from '@/lib/onnx-detector';

export default function LogoDetection() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setImageUrl(inputUrl.trim());
      setDetections([]);
      setError('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setInputUrl('');
      setDetections([]);
      setError('');
    }
  };

  const runDetection = async () => {
    if (!imageRef.current) return;

    setLoading(true);
    setModelLoading(true);
    setError('');
    setDetections([]);

    try {
      const results = await detectLogos(imageRef.current, confidenceThreshold);
      setDetections(results);
      drawDetections(results);
      setModelLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
      setModelLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const drawDetections = (dets: Detection[]) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

    dets.forEach((det, idx) => {
      const color = colors[idx % colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(det.box.x, det.box.y, det.box.width, det.box.height);

      ctx.fillStyle = color;
      ctx.font = 'bold 16px Arial';
      const text = `${det.label} ${(det.confidence * 100).toFixed(1)}%`;
      const textMetrics = ctx.measureText(text);
      const textHeight = 20;

      ctx.fillRect(
        det.box.x,
        det.box.y - textHeight - 4,
        textMetrics.width + 8,
        textHeight + 4
      );

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, det.box.x + 4, det.box.y - 6);
    });
  };

  useEffect(() => {
    if (imageRef.current && detections.length > 0) {
      drawDetections(detections);
    }
  }, [detections]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">
          Logo Detection
        </h1>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-zinc-900 dark:text-zinc-100 
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-zinc-100 file:text-zinc-700
                         hover:file:bg-zinc-200
                         dark:file:bg-zinc-700 dark:file:text-zinc-300
                         dark:hover:file:bg-zinc-600"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-600" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">or</span>
              <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-600" />
            </div>

            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter Instagram post image URL"
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 
                         rounded-lg bg-white dark:bg-zinc-700 
                         text-zinc-900 dark:text-zinc-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 transition-colors font-medium"
              >
                Load
              </button>
            </form>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Confidence Threshold: {confidenceThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {imageUrl && (
              <button
                onClick={runDetection}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700 transition-colors font-medium
                         disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                {modelLoading ? 'Loading model...' : loading ? 'Detecting...' : 'Detect Logos'}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                  Image
                </h2>
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Input"
                    className="hidden"
                    crossOrigin="anonymous"
                    onError={() => setError('Failed to load image. Please check the URL or try another image.')}
                  />
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto border border-zinc-300 dark:border-zinc-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                  Detections ({detections.length})
                </h2>
                <div className="space-y-3">
                  {detections.length === 0 && !loading && (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                      No detections yet. Click &quot;Detect Logos&quot; to start.
                    </p>
                  )}
                  {detections.map((det, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                          {det.label}
                        </span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {(det.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                        <div>X: {Math.round(det.box.x)}px</div>
                        <div>Y: {Math.round(det.box.y)}px</div>
                        <div>W: {Math.round(det.box.width)}px</div>
                        <div>H: {Math.round(det.box.height)}px</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
