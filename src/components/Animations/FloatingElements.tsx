"use client";

import React from "react";
import { Cloud, Plane, MapPin, Compass, Sun, Moon } from "lucide-react";
import { ANIMATIONS } from "../../constants/animations";
import { COLORS } from "../../constants/colors";

interface FloatingElementProps {
  icon: React.ReactNode;
  className?: string;
  delay?: number;
  size?: "small" | "medium" | "large";
  color?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  icon,
  className = "",
  delay = 0,
  size = "medium",
  color,
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  const floatAnimations = [
    ANIMATIONS.FLOAT.SLOW,
    ANIMATIONS.FLOAT.MEDIUM,
    ANIMATIONS.FLOAT.FAST,
    ANIMATIONS.FLOAT.REVERSE,
  ];

  const randomAnimation =
    floatAnimations[Math.floor(Math.random() * floatAnimations.length)];

  return (
    <div
      className={`${sizeClasses[size]} ${randomAnimation} ${className} opacity-60 dark:opacity-40 transition-opacity duration-300`}
      style={{
        animationDelay: `${delay}s`,
        color: color || "currentColor",
      }}
    >
      {icon}
    </div>
  );
};

interface FloatingElementsProps {
  count?: number;
  icons?: React.ReactNode[];
  className?: string;
}

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  count = 5,
  icons,
  className = "",
}) => {
  const defaultIcons = [
    <Cloud key="cloud" className="w-full h-full" />,
    <Plane key="plane" className="w-full h-full" />,
    <MapPin key="mappin" className="w-full h-full" />,
    <Compass key="compass" className="w-full h-full" />,
    <Sun key="sun" className="w-full h-full" />,
    <Moon key="moon" className="w-full h-full" />,
  ];

  const iconList = icons || defaultIcons;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => {
        const randomIcon =
          iconList[Math.floor(Math.random() * iconList.length)];
        const randomTop = Math.random() * 100;
        const randomLeft = Math.random() * 100;
        const randomDelay = Math.random() * 2;
        const randomSize = ["small", "medium", "large"][
          Math.floor(Math.random() * 3)
        ] as "small" | "medium" | "large";

        return (
          <div
            key={index}
            className="absolute"
            style={{
              top: `${randomTop}%`,
              left: `${randomLeft}%`,
            }}
          >
            <FloatingElement
              icon={randomIcon}
              delay={randomDelay}
              size={randomSize}
              className={`${COLORS.TEXT.PRIMARY} transition-colors duration-300`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default FloatingElements;
