"use client";

import React from "react";
import {
  BookOpen,
  MapPin,
  Wallet,
  MessageCircle,
  Globe,
  Loader2,
} from "lucide-react";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface LoadingProps {
  type?:
    | "default"
    | "diaries"
    | "trips"
    | "destinations"
    | "forum"
    | "profile"
    | "dashboard";
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  type = "default",
  message,
  fullScreen = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case "diaries":
        return BookOpen;
      case "trips":
        return Wallet;
      case "destinations":
        return MapPin;
      case "forum":
        return MessageCircle;
      case "profile":
        return Globe;
      default:
        return Loader2;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case "diaries":
        return "Loading your travel memories...";
      case "trips":
        return "Loading your trips...";
      case "destinations":
        return "Loading destinations...";
      case "forum":
        return "Loading forum posts...";
      case "profile":
        return "Loading profile...";
      case "dashboard":
        return "Loading dashboard...";
      default:
        return "Loading...";
    }
  };

  const Icon = getIcon();
  const displayMessage = message || getDefaultMessage();

  return (
    <div
      className={`flex flex-col items-center justify-center transition-colors duration-300 ${
        fullScreen ? "min-h-screen" : "py-12"
      } ${COLORS.BACKGROUND.DEFAULT}`}
    >
      <div className="text-center">
        {/* Animated Spinner with Icon */}
        <div className="relative mb-6">
          <div
            className={`w-16 h-16 border-4 ${COLORS.BORDER.DEFAULT} border-t-accent rounded-full animate-spin transition-colors duration-200`}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              className={`w-6 h-6 ${COLORS.TEXT.PRIMARY} animate-pulse transition-colors duration-200`}
            />
          </div>
        </div>

        {/* Loading Message */}
        <p
          className={`${COLORS.TEXT.MUTED} font-medium text-lg animate-pulse transition-colors duration-200`}
        >
          {displayMessage}
        </p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div
            className={`w-2 h-2 rounded-full ${COLORS.PRIMARY.DEFAULT} animate-bounce`}
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className={`w-2 h-2 rounded-full ${COLORS.PRIMARY.DEFAULT} animate-bounce`}
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className={`w-2 h-2 rounded-full ${COLORS.PRIMARY.DEFAULT} animate-bounce`}
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Card Component for grid layouts
interface SkeletonCardProps {
  showImage?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showActions = true,
}) => {
  return (
    <div
      className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg overflow-hidden animate-pulse transition-colors duration-300`}
    >
      {showImage && (
        <div
          className={`h-48 ${COLORS.BACKGROUND.MUTED} relative transition-colors duration-300`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div
              className={`h-5 ${COLORS.BACKGROUND.MUTED} rounded-lg mb-2 w-3/4 transition-colors duration-300`}
            ></div>
            <div
              className={`h-3 ${COLORS.BACKGROUND.MUTED} rounded w-1/2 transition-colors duration-300`}
            ></div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <div
                className={`w-8 h-8 ${COLORS.BACKGROUND.MUTED} rounded-md transition-colors duration-300`}
              ></div>
              <div
                className={`w-8 h-8 ${COLORS.BACKGROUND.MUTED} rounded-md transition-colors duration-300`}
              ></div>
            </div>
          )}
        </div>
        <div
          className={`h-4 ${COLORS.BACKGROUND.MUTED} rounded mt-2 w-full transition-colors duration-300`}
        ></div>
        <div
          className={`h-4 ${COLORS.BACKGROUND.MUTED} rounded mt-2 w-5/6 transition-colors duration-300`}
        ></div>
      </div>
    </div>
  );
};

// Skeleton Grid Component
interface SkeletonGridProps {
  count?: number;
  showImage?: boolean;
  showActions?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 6,
  showImage = true,
  showActions = true,
  columns = 3,
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {[...Array(count)].map((_, index) => (
        <SkeletonCard
          key={index}
          showImage={showImage}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default Loading;
