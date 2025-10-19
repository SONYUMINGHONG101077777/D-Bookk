import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReaderStore } from "../store/readerStore";

export const FontSizeController = () => {
  const MIN_SIZE = 12;
  const MAX_SIZE = 32;

  const fontSize = useReaderStore((s) => s.fontSize);
  const setFontSize = useReaderStore((s) => s.setFontSize);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const pct = useMemo(() => {
    const span = MAX_SIZE - MIN_SIZE;
    return span === 0 ? 0 : (fontSize - MIN_SIZE) / span;
  }, [fontSize]);

  const clampSize = (v: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, v));

  const clientXToSize = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return fontSize;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = x / rect.width;
    const next = MIN_SIZE + ratio * (MAX_SIZE - MIN_SIZE);
    return Math.round(clampSize(next));
  }, [fontSize]);

  // Start drag from thumb or track
  const onTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFontSize(clientXToSize(e.clientX));
    setDragging(true);
  };
  const onTrackTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    setFontSize(clientXToSize(t.clientX));
    setDragging(true);
  };

  // Drag handlers (global)
  useEffect(() => {
    if (!dragging) return;

    const move = (e: MouseEvent) => setFontSize(clientXToSize(e.clientX));
    const up = () => setDragging(false);

    const moveTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      setFontSize(clientXToSize(t.clientX));
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", moveTouch, { passive: true });
    window.addEventListener("touchend", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", moveTouch);
      window.removeEventListener("touchend", up);
    };
  }, [dragging, clientXToSize, setFontSize]);

  const onThumbKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft") setFontSize(clampSize(fontSize - 1));
    else if (e.key === "ArrowRight") setFontSize(clampSize(fontSize + 1));
    else if (e.key === "Home") setFontSize(MIN_SIZE);
    else if (e.key === "End") setFontSize(MAX_SIZE);
  };


  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-gradient-to-br">
      <div className="w-full max-w-md select-none">
        <div
          ref={trackRef}
          className={`relative  `}
          onMouseDown={onTrackMouseDown}
          onTouchStart={onTrackTouchStart}
          role="presentation"
        >
          <div className="relative w-full h-1 rounded-full bg-slate-200">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gray-500 card"
              style={{ width: `${pct * 100}%` }}
            />
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full  bg-white border border-slate-300 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ left: `${pct * 100}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setDragging(true);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setDragging(true);
              }}
              onKeyDown={onThumbKeyDown}
              role="slider"
              aria-valuemin={MIN_SIZE}
              aria-valuemax={MAX_SIZE}
              aria-valuenow={fontSize}
              aria-label="Font size"
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3">
              <div className="text-xs font-semibold text-slate-500">ទំហំអក្សរ</div>
              <div className="text-xs font-bold text">{fontSize}px</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FontSizeController;
