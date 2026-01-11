// src/components/TripCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Gauge,
  Plane,
} from "lucide-react";
import { ITrip } from "./Trips";
import { COLORS, GRADIENTS } from "../../constants/colors";
import { ANIMATIONS } from "../../constants/animations";
import ShimmerCard from "../../components/Animations/ShimmerCard";
import { getTravelImageUrl, getDestinationImageUrl } from "../../constants/api";

interface TripCardProps {
  trip: ITrip;
  onEdit: () => void;
  onDelete: () => void;
}

// Cải thiện màu sắc Status với backdrop blur
const getStatusColor = (status: ITrip["status"]) => {
  switch (status) {
    case "planning":
      return "bg-blue-500/80 text-white border-blue-400/50 dark:bg-blue-600/80 dark:text-white dark:border-blue-400/50";
    case "ongoing":
      return "bg-yellow-500/80 text-white border-yellow-400/50 dark:bg-yellow-600/80 dark:text-white dark:border-yellow-400/50";
    case "completed":
      return "bg-green-500/80 text-white border-green-400/50 dark:bg-green-600/80 dark:text-white dark:border-green-400/50";
    case "cancelled":
      return "bg-red-500/80 text-white border-red-400/50 dark:bg-red-600/80 dark:text-white dark:border-red-400/50";
    default:
      return "bg-gray-500/80 text-white border-gray-400/50 dark:bg-gray-600/80 dark:text-white dark:border-gray-400/50";
  }
};

const formatCurrency = (amount: number, currency: string = "VND") => {
  const safeAmount = amount || 0;
  // For VND, format without currency symbol prefix to avoid confusion
  if (currency === "VND" || currency === "vnd") {
    return new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount) + " ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(safeAmount);
};

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onEdit,
  onDelete,
}) => {
  const percentageUsed = Math.min(
    trip.total_budget > 0 ? (trip.spent_amount / trip.total_budget) * 100 : 0,
    100
  );

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  // Tính số ngày bao gồm ngày bắt đầu và ngày kết thúc
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // SỬA LỖI: Kiểm tra an toàn cho trip.destination
  const destinationName = trip.destination?.name || "Unknown Destination";

  const difficultLevel = trip.difficult || 0;
  const isDifficult = difficultLevel >= 3;

  // Get image URL
  const imageUrl = trip.destination?.images && Array.isArray(trip.destination.images) && trip.destination.images.length > 0
    ? (typeof trip.destination.images[0] === "string" 
        ? trip.destination.images[0] 
        : (trip.destination.images[0] as { url: string })?.url)
    : getDestinationImageUrl(destinationName, 600, 400);

  return (
    <ShimmerCard
      className="hover:shadow-2xl transition-all duration-300 block relative group overflow-hidden"
      shimmer={false}
    >
      {/* Image Header with Gradient Overlay */}
      <Link href={`/trips/${trip.id}`} className="block relative h-48 overflow-hidden">
        <Image
          src={imageUrl}
          alt={trip.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className={`absolute inset-0 ${GRADIENTS.PRIMARY_DARK} opacity-60 transition-opacity duration-300 group-hover:opacity-70`}></div>
        
        {/* Action Buttons - Overlay on image */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg transition-all duration-200 shadow-lg hover:scale-110"
            title="Edit Trip"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white rounded-lg transition-all duration-200 shadow-lg hover:scale-110"
            title="Delete Trip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-md ${getStatusColor(
              trip.status
            )} ${ANIMATIONS.PULSE.SOFT} border`}
          >
            {(trip.status || "UNKNOWN").toUpperCase()}
          </span>
        </div>

        {/* Title and Destination Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
            {trip.title}
          </h3>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/90 shrink-0" />
            <span className="text-sm font-medium text-white/90 truncate drop-shadow-md">
              {destinationName}
            </span>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="p-5 space-y-4">
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className={`p-3 rounded-lg ${COLORS.BACKGROUND.MUTED} transition-colors duration-200`}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={`w-4 h-4 ${COLORS.TEXT.PRIMARY} shrink-0`} />
                <span className={`text-xs font-medium ${COLORS.TEXT.MUTED}`}>Date</span>
              </div>
              <span className={`text-sm font-semibold ${COLORS.TEXT.DEFAULT}`}>
                {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>

            {/* Duration */}
            <div className={`p-3 rounded-lg ${COLORS.BACKGROUND.MUTED} transition-colors duration-200`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${COLORS.TEXT.PRIMARY} shrink-0`} />
                <span className={`text-xs font-medium ${COLORS.TEXT.MUTED}`}>Duration</span>
              </div>
              <span className={`text-sm font-semibold ${COLORS.TEXT.DEFAULT}`}>{diffDays} {diffDays === 1 ? 'day' : 'days'}</span>
            </div>
          </div>

          {/* Budget Section */}
          <div className={`p-4 rounded-lg ${COLORS.BACKGROUND.MUTED} transition-colors duration-200`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${COLORS.TEXT.MUTED} flex items-center gap-2 text-sm font-medium`}>
                <DollarSign className={`w-4 h-4 ${COLORS.TEXT.PRIMARY}`} />
                Budget Progress
              </span>
              <span className={`${COLORS.TEXT.DEFAULT} font-bold text-sm`}>
                {percentageUsed.toFixed(0)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className={`w-full ${COLORS.BACKGROUND.DEFAULT} rounded-full h-3 overflow-hidden mb-2 transition-colors duration-200`}>
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  percentageUsed > 100 
                    ? "bg-destructive" 
                    : percentageUsed > 80 
                    ? "bg-yellow-500" 
                    : COLORS.PRIMARY.DEFAULT
                }`}
                style={{
                  width: `${Math.min(percentageUsed, 100)}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={`${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                {formatCurrency(trip.spent_amount, trip.currency)}
              </span>
              <span className={`${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                {formatCurrency(trip.total_budget, trip.currency)}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          {(trip.departure || difficultLevel > 0) && (
            <div className={`flex items-center gap-4 pt-3 border-t ${COLORS.BORDER.LIGHT} transition-colors duration-200`}>
              {trip.departure && (
                <div className={`flex items-center gap-2 text-sm ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                  <Plane className={`w-4 h-4 ${COLORS.TEXT.PRIMARY}`} />
                  <span className="truncate">{trip.departure}</span>
                </div>
              )}
              {difficultLevel > 0 && (
                <div className={`flex items-center gap-2 text-sm ml-auto ${isDifficult ? "text-destructive" : COLORS.TEXT.PRIMARY}`}>
                  <Gauge className="w-4 h-4" />
                  <span className="font-semibold">Difficulty: {difficultLevel}/5</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </ShimmerCard>
  );
};
