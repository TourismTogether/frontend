// src/components/FormNewTrip.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, MapPin, DollarSign } from "lucide-react";
import { ITrip } from "./Trips";
import { useAuth } from "../../contexts/AuthContext";
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to avoid SSR issues
const LocationPicker = dynamic(
  () =>
    import("@/components/Map/LocationPicker").then((mod) => ({
      default: mod.LocationPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center"
        style={{ height: "250px" }}
      >
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    ),
  }
);

// --- INTERFACE IDestination ---
export interface IDestination {
  id?: string;
  region_id: string;
  name: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  rating: number;
  images: Array<string> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface FormNewTripProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: () => void;
}

// Định nghĩa các lựa chọn status hợp lệ
const TRIP_STATUS_OPTIONS: ITrip["status"][] = [
  "planning",
  "ongoing",
  "completed",
  "cancelled",
];

// Định nghĩa các mức Budget gợi ý (Đơn vị: VND)
const BUDGET_SUGGESTIONS = [
  { value: 1000000, label: "1M VND" },
  { value: 2000000, label: "2M VND" },
  { value: 3000000, label: "3M VND" },
  { value: 5000000, label: "5M VND" },
];

// Hàm format tiền tệ (cho nhãn nút gợi ý)
const formatVNDLabel = (amount: number): string => {
  if (amount >= 1000000) {
    return `${amount / 1000000}M VND`;
  }
  return `${amount.toLocaleString("vi-VN")} VND`;
};

export const FormNewTrip: React.FC<FormNewTripProps> = ({
  isOpen,
  onClose,
  onTripCreated,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<ITrip>>({
    title: "",
    destination_id: "",
    description: "",
    start_date: "",
    end_date: "",
    total_budget: 0,
    distance: 0,
    departure: "",
    difficult: 1,
    spent_amount: 0,
    status: "planning",
  });

  const [destinations, setDestinations] = useState<IDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDestinations, setFetchingDestinations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departureLocation, setDepartureLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (isOpen) {
      // Đặt lại form khi mở modal
      setFormData({
        title: "",
        destination_id: "",
        description: "",
        start_date: "",
        end_date: "",
        total_budget: 0,
        distance: 0,
        departure: "",
        difficult: 1,
        spent_amount: 0,
        status: "planning",
      });
      setError(null);
      fetchDestinations();
    } else {
      setDestinations([]);
    }
  }, [isOpen]);

  const fetchDestinations = async () => {
    if (!API_URL) return;
    setFetchingDestinations(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/destinations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch destinations (Status: ${response.status})`
        );
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setDestinations(result.data);
      } else {
        // Xử lý trường hợp API trả về dữ liệu không hợp lệ
        setDestinations(Array.isArray(result) ? result : []);
      }
    } catch (err: any) {
      console.error("Error fetching destinations:", err);
      setError(`Failed to load destinations: ${err.message}.`);
    } finally {
      setFetchingDestinations(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        // Xử lý chuyển đổi sang số cho các trường số (bao gồm total_budget)
        [name]:
          name === "total_budget" || name === "distance" || name === "difficult"
            ? parseFloat(value) || 0 // Đảm bảo giá trị là số
            : value,
      };

      // Đảm bảo end_date >= start_date (cho phép cùng ngày)
      if (name === "start_date" && value && updatedData.end_date) {
        const startDate = new Date(value);
        const endDate = new Date(updatedData.end_date);
        if (endDate < startDate) {
          // Nếu end_date < start_date, set end_date = start_date (cho phép cùng ngày)
          updatedData.end_date = value;
        }
      } else if (name === "end_date" && value && updatedData.start_date) {
        const startDate = new Date(updatedData.start_date);
        const endDate = new Date(value);
        if (endDate < startDate) {
          // Nếu end_date < start_date, set end_date = start_date (cho phép cùng ngày)
          updatedData.end_date = updatedData.start_date;
        }
      }

      return updatedData;
    });
  };

  // HÀM MỚI: Xử lý khi click vào các nút gợi ý Budget
  const handleSuggestBudget = (amount: number) => {
    setFormData((prev) => ({
      ...prev,
      total_budget: amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!API_URL) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    if (!formData.destination_id) {
      setError("Please select a destination to create a trip.");
      setLoading(false);
      return;
    }

    // Kiểm tra ngày: end_date phải >= start_date (cho phép cùng ngày)
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        setError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
        setLoading(false);
        return;
      }
    }

    // Kiểm tra budget tối thiểu (tùy chọn, thêm để tránh 0)
    if ((formData.total_budget || 0) <= 0) {
      setError("Total Budget must be greater than 0.");
      setLoading(false);
      return;
    }

    try {
      // Chuẩn bị payload cho Trip
      const tripPayload: Omit<
        ITrip,
        | "id"
        | "created_at"
        | "updated_at"
        | "spent_amount"
        | "currency"
        | "destination"
      > = {
        title: formData.title || "", // Đảm bảo có giá trị mặc định nếu cần
        destination_id: formData.destination_id || "",
        description: formData.description || "",
        departure: formData.departure || "",
        distance: formData.distance || 0,
        start_date: formData.start_date || "",
        end_date: formData.end_date || "",
        difficult: formData.difficult || 1,
        total_budget: formData.total_budget || 0,
        status: formData.status || "planning",
      };

      // Bước 1: Tạo Trip
      const tripResponse = await fetch(`${API_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripPayload),
      });

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json();
        throw new Error(
          errorData.message ||
            `Failed to create trip. Status: ${tripResponse.status}`
        );
      }

      const tripResult = await tripResponse.json();
      const createdTrip: ITrip = tripResult.data || tripResult;

      if (!createdTrip.id) {
        throw new Error("Trip created but ID is missing.");
      }

      // Bước 2: Thêm user vào trip (tạo join_trip)
      const joinTripResponse = await fetch(
        `${API_URL}/trips/${createdTrip.id}/users/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!joinTripResponse.ok) {
        // Rollback nếu thêm user thất bại
        await fetch(`${API_URL}/trips/${createdTrip.id}`, {
          method: "DELETE",
        });
        const errorData = await joinTripResponse.json();
        throw new Error(
          errorData.message ||
            `Failed to add user to trip. Status: ${joinTripResponse.status}`
        );
      }

      // Thành công
      onTripCreated();
      onClose();
    } catch (err: any) {
      setError(
        err.message || "An unknown error occurred during trip creation."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDisabled = loading || fetchingDestinations;
  const isFormDisabled = isDisabled || destinations.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Plan New Trip</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <p className="text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/50">
              {error}
            </p>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Trip Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isFormDisabled}
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Destination Select */}
          <div>
            <label
              htmlFor="destination_id"
              className="block text-sm font-medium text-foreground mb-1"
            >
              <MapPin className="w-4 h-4 mr-2 inline-block text-trip" />
              Select Destination
            </label>
            {fetchingDestinations ? (
              <div className="flex items-center justify-center p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading destinations...
              </div>
            ) : destinations.length > 0 ? (
              <select
                id="destination_id"
                name="destination_id"
                value={formData.destination_id}
                onChange={handleChange}
                required
                disabled={isDisabled}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  -- Choose a Destination --
                </option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name} ({dest.country})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-red-100/20 rounded-lg text-sm text-destructive border border-destructive/50">
                No destinations available. Check the API or server logs.
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              disabled={isFormDisabled}
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dates, Budget, Difficulty, and Status Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Start Date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
                disabled={isFormDisabled}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-foreground mb-1"
              >
                End Date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date || undefined}
                required
                disabled={isFormDisabled}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Total Budget (CÓ THAY ĐỔI) */}
            <div className="col-span-2">
              <label
                htmlFor="total_budget"
                className="block text-sm font-medium text-foreground mb-1"
              >
                <DollarSign className="w-4 h-4 mr-2 inline-block text-green-500" />
                Total Budget (VND)
              </label>
              <input
                id="total_budget"
                name="total_budget"
                type="number"
                value={formData.total_budget || ""} // Hiển thị 0 là chuỗi rỗng để tránh "0"
                onChange={handleChange}
                required
                min="0"
                disabled={isFormDisabled}
                placeholder="e.g., 5000000"
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Nút gợi ý Budget (MỚI) */}
              <div className="mt-2 flex flex-wrap gap-2">
                {BUDGET_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.value}
                    type="button"
                    onClick={() => handleSuggestBudget(suggestion.value)}
                    disabled={isFormDisabled}
                    className="text-xs px-3 py-1.5 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {formatVNDLabel(suggestion.value)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Select */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={isFormDisabled}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {TRIP_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label
                htmlFor="difficult"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Difficulty (1-5)
              </label>
              <input
                id="difficult"
                name="difficult"
                type="number"
                value={formData.difficult}
                onChange={handleChange}
                required
                min="1"
                max="5"
                disabled={isFormDisabled}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Departure */}
          <div>
            <label
              htmlFor="departure"
              className="block text-sm font-medium text-foreground mb-1"
            >
              <MapPin className="w-4 h-4 mr-2 inline-block text-trip" />
              Departure Location
            </label>
            <input
              id="departure"
              name="departure"
              type="text"
              value={formData.departure}
              onChange={handleChange}
              disabled={isFormDisabled}
              placeholder="e.g., Ho Chi Minh City"
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            />
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">
                Or pick a location on the map:
              </p>
              <LocationPicker
                onLocationSelect={(lat, lng) => {
                  setDepartureLocation({ lat, lng });
                  // Optionally reverse geocode to get location name
                  fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
                  )
                    .then((res) => res.json())
                    .then((data) => {
                      const locationName =
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        data.address?.county ||
                        data.display_name ||
                        "";
                      if (locationName) {
                        setFormData((prev) => ({
                          ...prev,
                          departure: locationName,
                        }));
                      }
                    })
                    .catch((err) => console.error("Geocoding error:", err));
                }}
                initialLat={departureLocation?.lat}
                initialLng={departureLocation?.lng}
                height="250px"
              />
              {departureLocation && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {departureLocation.lat.toFixed(4)},{" "}
                  {departureLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Distance */}
          <div>
            <label
              htmlFor="distance"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Distance (km)
            </label>
            <input
              id="distance"
              name="distance"
              type="number"
              value={formData.distance}
              onChange={handleChange}
              min="0"
              disabled={isFormDisabled}
              placeholder="e.g., 1500"
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-trip focus:border-trip transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submission */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-semibold transition-colors ${
              isFormDisabled
                ? "bg-trip/60 cursor-not-allowed"
                : "bg-trip hover:bg-trip/90 shadow-lg shadow-trip/40"
            }`}
          >
            {isDisabled && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>
              {fetchingDestinations
                ? "Loading destinations..."
                : loading
                ? "Creating trip..."
                : "Create Trip"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
