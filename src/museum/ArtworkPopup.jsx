import { useEffect, useRef, useState, useCallback } from "react";

/**
 * ArtworkPopup — Popup chuyên nghiệp hiển thị tranh phóng to.
 * Hỗ trợ zoom phóng to/thu nhỏ bằng scroll wheel + pinch, kéo di chuyển khi đã zoom.
 * Đóng bằng click vùng tối hoặc Escape.
 */
export function ArtworkPopup({ panel, onClose }) {
  const backdropRef = useRef(null);
  const contentRef = useRef(null);
  const imgContainerRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [visiblePanel, setVisiblePanel] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;

  // Track which panel to show
  useEffect(() => {
    if (panel) {
      setVisiblePanel(panel);
      setIsClosing(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [panel]);

  // Close on Escape, reset zoom on "0"
  useEffect(() => {
    if (!visiblePanel) return;
    const handleKey = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visiblePanel]);

  // Entrance animation
  useEffect(() => {
    if (!panel || isClosing) return;
    const bd = backdropRef.current;
    const ct = contentRef.current;
    if (bd) {
      bd.style.opacity = "0";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { bd.style.opacity = "1"; });
      });
    }
    if (ct) {
      ct.style.opacity = "0";
      ct.style.transform = "scale(0.92)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ct.style.opacity = "1";
          ct.style.transform = "scale(1)";
        });
      });
    }
  }, [panel, isClosing]);

  // Smooth close
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    const bd = backdropRef.current;
    const ct = contentRef.current;
    if (bd) bd.style.opacity = "0";
    if (ct) {
      ct.style.opacity = "0";
      ct.style.transform = "scale(0.95)";
    }
    setTimeout(() => {
      setVisiblePanel(null);
      setIsClosing(false);
      onClose();
    }, 280);
  }, [isClosing, onClose]);

  // Scroll to zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(prev => {
      const next = prev - e.deltaY * 0.002;
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      if (clamped <= 1) setPan({ x: 0, y: 0 });
      return clamped;
    });
  }, []);

  // Drag to pan when zoomed
  const handlePointerDown = useCallback((e) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    e.currentTarget.style.cursor = "grabbing";
  }, [zoom, pan]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }, []);

  const handlePointerUp = useCallback((e) => {
    isDragging.current = false;
    if (e.currentTarget) e.currentTarget.style.cursor = zoom > 1 ? "grab" : "default";
  }, [zoom]);

  if (!visiblePanel) return null;

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) handleClose();
  };

  const isZoomed = zoom > 1.05;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6, 4, 2, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "opacity 0.3s ease",
        cursor: "pointer",
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "clamp(16px, 3vh, 32px)",
          right: "clamp(16px, 3vw, 40px)",
          zIndex: 1010,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid rgba(229,213,181,0.15)",
          background: "rgba(0,0,0,0.4)",
          color: "#e5d5b5",
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          backdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(197,160,40,0.3)";
          e.currentTarget.style.borderColor = "rgba(197,160,40,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.4)";
          e.currentTarget.style.borderColor = "rgba(229,213,181,0.15)";
        }}
      >
        ✕
      </button>

      {/* Content container */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "92vw",
          maxHeight: "92vh",
          cursor: "default",
          transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Baroque-style frame wrapper */}
        <div
          style={{
            position: "relative",
            padding: "10px",
            background: "linear-gradient(145deg, #3a2b1a 0%, #24170e 40%, #1a1008 100%)",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: `
              0 0 0 1px rgba(185, 144, 67, 0.3),
              0 0 0 3px rgba(36, 23, 14, 0.8),
              0 0 0 4px rgba(185, 144, 67, 0.2),
              0 4px 32px rgba(0, 0, 0, 0.6),
              0 8px 64px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(210, 173, 97, 0.15)
            `,
          }}
        >
          {/* Inner gold border */}
          <div
            style={{
              padding: "3px",
              background: "linear-gradient(145deg, rgba(185,144,67,0.35) 0%, rgba(210,173,97,0.2) 50%, rgba(185,144,67,0.3) 100%)",
              borderRadius: 4,
            }}
          >
            {/* Velvet mat + zoomable image */}
            <div
              ref={imgContainerRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{
                padding: "6px",
                background: "#0e0a07",
                borderRadius: 3,
                overflow: "hidden",
                cursor: isZoomed ? "grab" : "default",
              }}
            >
              <img
                src={visiblePanel.imageSrc}
                alt={visiblePanel.title || "Tác phẩm"}
                style={{
                  display: "block",
                  maxWidth: "85vw",
                  maxHeight: "82vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: 2,
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: "center center",
                  transition: isDragging.current ? "none" : "transform 0.15s ease-out",
                  userSelect: "none",
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
