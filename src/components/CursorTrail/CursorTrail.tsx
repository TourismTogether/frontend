"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useTheme } from "next-themes";

interface CursorTrailProps {
  enabled?: boolean;
  trailLength?: number;
  size?: number;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({
  enabled = true,
  trailLength = 15,
  size = 10,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === "dark";
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled || !mounted || typeof window === "undefined") return;

    const container = containerRef.current;
    if (!container) return;

    // Create trail elements
    trailRefs.current = [];
    for (let i = 0; i < trailLength; i++) {
      const dot = document.createElement("div");
      const dotSize = size - i * 0.4;
      const opacity = 1 - i / trailLength;
      
      dot.className = `fixed pointer-events-none rounded-full z-[9999] ${
        isDark
          ? "bg-gradient-to-r from-purple-400/60 via-pink-400/60 to-blue-400/60"
          : "bg-gradient-to-r from-amber-400/50 via-orange-400/50 to-yellow-400/50"
      }`;
      dot.style.width = `${dotSize}px`;
      dot.style.height = `${dotSize}px`;
      dot.style.opacity = `${opacity}`;
      dot.style.transform = "translate(-50%, -50%)";
      dot.style.left = "0px";
      dot.style.top = "0px";
      dot.style.boxShadow = isDark
        ? "0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(236, 72, 153, 0.3)"
        : "0 0 10px rgba(251, 191, 36, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)";
      
      container.appendChild(dot);
      trailRefs.current.push(dot);
    }

    // Mouse move handler with throttling
    let lastTime = 0;
    const throttleDelay = 16; // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < throttleDelay) return;
      lastTime = now;

      mousePosition.current = { x: e.clientX, y: e.clientY };

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Animate trail with GSAP
      animationFrameRef.current = requestAnimationFrame(() => {
        trailRefs.current.forEach((dot, index) => {
          const delay = index * 0.03;
          const ease = index === 0 ? "power1.out" : "power2.out";
          
          gsap.to(dot, {
            x: mousePosition.current.x,
            y: mousePosition.current.y,
            duration: 0.4 + delay * 0.5,
            ease: ease,
            overwrite: true,
          });
        });
      });
    };

    // Mouse leave handler - fade out trail
    const handleMouseLeave = () => {
      trailRefs.current.forEach((dot, index) => {
        gsap.to(dot, {
          opacity: 0,
          scale: 0.5,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.02,
        });
      });
    };

    // Mouse enter handler - fade in trail
    const handleMouseEnter = () => {
      trailRefs.current.forEach((dot, index) => {
        const opacity = 1 - index / trailLength;
        gsap.to(dot, {
          opacity: opacity,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
          delay: index * 0.01,
        });
      });
    };

    // Initial position
    const handleInitialMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      trailRefs.current.forEach((dot) => {
        gsap.set(dot, {
          x: e.clientX,
          y: e.clientY,
        });
      });
      window.removeEventListener("mousemove", handleInitialMove);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousemove", handleInitialMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleInitialMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      trailRefs.current.forEach((dot) => {
        gsap.killTweensOf(dot);
        dot.remove();
      });
      trailRefs.current = [];
    };
  }, [enabled, mounted, isDark, trailLength, size]);

  // Update colors when theme changes
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    trailRefs.current.forEach((dot) => {
      dot.className = `fixed pointer-events-none rounded-full z-[9999] ${
        isDark
          ? "bg-gradient-to-r from-purple-400/60 via-pink-400/60 to-blue-400/60"
          : "bg-gradient-to-r from-amber-400/50 via-orange-400/50 to-yellow-400/50"
      }`;
      dot.style.boxShadow = isDark
        ? "0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(236, 72, 153, 0.3)"
        : "0 0 10px rgba(251, 191, 36, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)";
    });
  }, [isDark, mounted]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="cursor-trail-container"
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}
    />
  );
};

export default CursorTrail;
