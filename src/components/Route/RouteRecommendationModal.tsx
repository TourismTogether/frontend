// Route Recommendation Modal Component
// Displays recommended routes with scores and allows user to add them

import React, { useState } from "react";
import { X, MapPin, Star, Sparkles, Plus, Loader2 } from "lucide-react";
import { IRoute } from "@/lib/type/interface";
import { RecommendedRoute } from "@/services/routeRecommendationService";

interface RouteRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: RecommendedRoute[];
  onSelectRoute: (route: Omit<IRoute, "id" | "created_at" | "updated_at" | "trip_id" | "costs">) => void;
  loading?: boolean;
}

export const RouteRecommendationModal: React.FC<RouteRecommendationModalProps> = ({
  isOpen,
  onClose,
  recommendations,
  onSelectRoute,
  loading = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSelectRoute = (recommendation: RecommendedRoute) => {
    const route = recommendation.route;
    onSelectRoute({
      index: 0, // Will be set by parent
      title: route.title,
      description: route.description,
      lngStart: route.lngStart,
      latStart: route.latStart,
      lngEnd: route.lngEnd,
      latEnd: route.latEnd,
      details: route.details,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended Routes
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered suggestions based on popular trips and proximity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
              <p className="text-gray-600 font-medium">
                Analyzing routes and finding recommendations...
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No recommendations found
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                We couldn't find any routes to recommend at this time. Try
                adding routes manually or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Route Title and Score */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {recommendation.route.title}
                        </h3>
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                          <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                          <span className="text-xs font-bold text-yellow-700">
                            {recommendation.score.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {recommendation.route.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {recommendation.route.description}
                        </p>
                      )}

                      {/* Coordinates */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            Start: {recommendation.route.latStart.toFixed(4)},{" "}
                            {recommendation.route.lngStart.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            End: {recommendation.route.latEnd.toFixed(4)},{" "}
                            {recommendation.route.lngEnd.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Why this route:
                        </p>
                        <ul className="space-y-1">
                          {recommendation.reasons.map((reason, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-600 flex items-start gap-2"
                            >
                              <span className="text-indigo-500 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Details */}
                      {recommendation.route.details.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            Activities:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recommendation.route.details.map((detail, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-md"
                              >
                                {detail}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Source Trip */}
                      {recommendation.sourceTrip && (
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span className="font-semibold">From trip:</span>{" "}
                          {recommendation.sourceTrip.title}
                          {recommendation.sourceTrip.destination && (
                            <span className="text-gray-400">
                              {" "}
                              • {recommendation.sourceTrip.destination.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleSelectRoute(recommendation)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Route</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Recommendations are based on popular routes, proximity to your
            destination, and trip patterns from other users.
          </p>
        </div>
      </div>
    </div>
  );
};

