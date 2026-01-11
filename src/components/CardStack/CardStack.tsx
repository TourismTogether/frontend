"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { useTheme } from "next-themes";

interface CardStackProps<T> {
  items: T[];
  renderCard: (item: T, index: number, isActive: boolean) => React.ReactNode;
  onCardSwipe?: (item: T, direction: "left" | "right") => void;
  maxCards?: number;
  className?: string;
}

export function CardStack<T>({
  items,
  renderCard,
  onCardSwipe,
  maxCards = 5,
  className = "",
}: CardStackProps<T>) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update card positions
  useEffect(() => {
    if (!mounted || !containerRef.current || items.length === 0) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    cards.forEach((card, index) => {
      if (!card) return;

      const offset = index - currentIndex;
      const scale = 1 - offset * 0.05;
      const y = offset * 20;
      const zIndex = items.length - Math.abs(offset);
      const opacity = offset > maxCards - 1 ? 0 : 1 - Math.abs(offset) * 0.2;

      gsap.to(card, {
        x: 0,
        y: y,
        scale: scale,
        rotation: offset * 2,
        zIndex: zIndex,
        opacity: opacity,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  }, [mounted, items, currentIndex, maxCards]);

  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (currentIndex >= items.length) return;

    const currentCard = cardsRef.current[currentIndex];
    if (!currentCard) return;

    const cardWidth = containerRef.current?.offsetWidth || 300;
    const exitX = direction === "right" ? cardWidth * 1.5 : -cardWidth * 1.5;

    // Animate current card out
    gsap.to(currentCard, {
      x: exitX,
      rotation: direction === "right" ? 30 : -30,
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        if (onCardSwipe && items[currentIndex]) {
          onCardSwipe(items[currentIndex], direction);
        }
        setCurrentIndex((prev) => Math.min(prev + 1, items.length));
      },
    });

    // Animate next cards up
    for (let i = currentIndex + 1; i < Math.min(currentIndex + maxCards, items.length); i++) {
      const card = cardsRef.current[i];
      if (!card) continue;

      const newOffset = i - (currentIndex + 1);
      const newY = newOffset * 20;
      const newScale = 1 - newOffset * 0.05;
      const newZIndex = items.length - Math.abs(newOffset);
      const newOpacity = newOffset > maxCards - 1 ? 0 : 1 - Math.abs(newOffset) * 0.2;

      gsap.to(card, {
        y: newY,
        scale: newScale,
        zIndex: newZIndex,
        opacity: newOpacity,
        rotation: newOffset * 2,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [currentIndex, items, maxCards, onCardSwipe]);

  // Setup drag handlers
  useEffect(() => {
    if (!mounted || currentIndex >= items.length) return;

    const currentCard = cardsRef.current[currentIndex];
    if (!currentCard) return;

    let dragging = false;

    const handleStart = (clientX: number, clientY: number) => {
      dragging = true;
      setIsDragging(true);
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        time: Date.now(),
      };
      dragCurrentRef.current = { x: clientX, y: clientY };
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!dragging) return;

      dragCurrentRef.current = { x: clientX, y: clientY };
      const deltaX = clientX - dragStartRef.current.x;
      const progress = deltaX / (containerRef.current?.offsetWidth || 300);
      const rotation = progress * 15;
      const scale = 1 - Math.abs(progress) * 0.1;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      animationRef.current = gsap.to(currentCard, {
        x: deltaX,
        rotation: rotation,
        scale: scale,
        duration: 0.1,
        ease: "none",
      });
    };

    const handleEnd = () => {
      if (!dragging) return;
      dragging = false;
      setIsDragging(false);

      const deltaX = dragCurrentRef.current.x - dragStartRef.current.x;
      const deltaTime = Date.now() - dragStartRef.current.time;
      const velocity = deltaTime > 0 ? Math.abs(deltaX) / deltaTime : 0;
      const cardWidth = containerRef.current?.offsetWidth || 300;
      const threshold = 0.5; // pixels per millisecond

      if (
        velocity > threshold ||
        Math.abs(deltaX) > cardWidth * 0.3
      ) {
        const direction = deltaX > 0 ? "right" : "left";
        handleSwipe(direction);
      } else {
        // Snap back
        const offset = 0;
        const y = offset * 20;
        gsap.to(currentCard, {
          x: 0,
          y: y,
          rotation: 0,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)",
        });
      }
    };

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    currentCard.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    currentCard.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      currentCard.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      currentCard.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [mounted, currentIndex, items.length, handleSwipe]);

  const visibleItems = items.slice(0, Math.min(currentIndex + maxCards, items.length));

  if (!mounted || items.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <p className="text-muted-foreground">No items to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[500px] flex items-center justify-center ${className}`}
    >
      {visibleItems.map((item, index) => {
        const isActive = index === currentIndex;
        const offset = index - currentIndex;

        return (
          <div
            key={index}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className={`absolute w-full max-w-md ${
              isActive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
            }`}
            style={{
              willChange: "transform",
            }}
          >
            {renderCard(item, index, isActive)}
          </div>
        );
      })}

      {/* Pagination Controls - Left & Right Buttons */}
      {items.length > 1 && (
        <>
          {/* Previous Button - Left - Sát card */}
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
              }
            }}
            disabled={currentIndex === 0}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full -ml-2 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              currentIndex === 0
                ? "bg-gray-400/30 text-gray-500 cursor-not-allowed opacity-40"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-110 active:scale-95 shadow-blue-500/50"
            }`}
            aria-label="Previous card"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button - Right - Sát card */}
          <button
            onClick={() => {
              if (currentIndex < items.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              }
            }}
            disabled={currentIndex >= items.length - 1}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full mr-2 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              currentIndex >= items.length - 1
                ? "bg-gray-400/30 text-gray-500 cursor-not-allowed opacity-40"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-110 active:scale-95 shadow-blue-500/50"
            }`}
            aria-label="Next card"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Page Indicator - Bottom Center */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700 rounded-lg shadow-lg">
            <span className="text-sm font-medium text-foreground">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {items.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex gap-1">
            {items.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : index < currentIndex
                    ? "w-2 bg-muted"
                    : "w-2 bg-muted/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
