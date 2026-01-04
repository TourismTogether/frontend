// src/components/EditTripModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { ITrip } from "./Trips";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: ITrip;
  onTripUpdated: () => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  onTripUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<ITrip>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && trip) {
      // Đảm bảo các trường Date là string 'YYYY-MM-DD' cho input type="date"
      setFormData({
        id: trip.id,
        title: trip.title || "",
        destination_id: trip.destination_id || "",
        description: trip.description || "",
        departure: trip.departure || "",
        distance: trip.distance || 0,
        start_date: trip.start_date
          ? new Date(trip.start_date).toISOString().substring(0, 10)
          : "",
        end_date: trip.end_date
          ? new Date(trip.end_date).toISOString().substring(0, 10)
          : "",
        difficult: trip.difficult || 1,
        total_budget: trip.total_budget || 0,
        spent_amount: trip.spent_amount || 0,
        status: trip.status || "planning",
      });
      setError(null);
    }
  }, [isOpen, trip]);

  if (!isOpen) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!API_URL || !formData.id) {
      setError("API URL or Trip ID is missing.");
      setLoading(false);
      return;
    }

    try {
      // Payload với tất cả các trường cần thiết
      const updatePayload = {
        title: formData.title,
        destination_id: formData.destination_id,
        description: formData.description,
        departure: formData.departure,
        distance: formData.distance,
        start_date: formData.start_date,
        end_date: formData.end_date,
        difficult: formData.difficult,
        total_budget: formData.total_budget,
        spent_amount: formData.spent_amount,
        status: formData.status,
      };

      console.log("Sending update payload:", updatePayload); // Debug log

      const response = await fetch(`${API_URL}/trips/${formData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP Error ${response.status}`,
        }));
        throw new Error(errorData.message || "Failed to update trip.");
      }

      const result = await response.json();
      console.log("Update successful:", result); // Debug log

      onTripUpdated();
      onClose();
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
          <h2 className="text-2xl font-bold text-foreground">
            Edit Trip: {trip.title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/50">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="edit_title"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Trip Title *
            </label>
            <input
              id="edit_title"
              name="title"
              type="text"
              value={formData.title || ""}
              onChange={handleChange}
              required
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit_description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Description
            </label>
            <textarea
              id="edit_description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors resize-none"
              placeholder="Describe your trip..."
            />
          </div>

          {/* Departure & Distance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit_departure"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Departure Location *
              </label>
              <input
                id="edit_departure"
                name="departure"
                type="text"
                value={formData.departure || ""}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
                placeholder="e.g., Ho Chi Minh City"
              />
            </div>

            <div>
              <label
                htmlFor="edit_distance"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Distance (km) *
              </label>
              <input
                id="edit_distance"
                name="distance"
                type="number"
                value={formData.distance || 0}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit_start_date"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Start Date *
              </label>
              <input
                id="edit_start_date"
                name="start_date"
                type="date"
                value={formData.start_date || ""}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="edit_end_date"
                className="block text-sm font-medium text-foreground mb-2"
              >
                End Date *
              </label>
              <input
                id="edit_end_date"
                name="end_date"
                type="date"
                value={formData.end_date || ""}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              />
            </div>
          </div>

          {/* Difficulty & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit_difficult"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Difficulty Level (1-5) *
              </label>
              <input
                id="edit_difficult"
                name="difficult"
                type="number"
                value={formData.difficult || 1}
                onChange={handleChange}
                required
                min="1"
                max="5"
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="edit_status"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Status *
              </label>
              <select
                id="edit_status"
                name="status"
                value={formData.status || "planning"}
                onChange={handleChange}
                required
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              >
                <option value="planning">Planning</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit_total_budget"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Total Budget (VND) *
              </label>
              <input
                id="edit_total_budget"
                name="total_budget"
                type="number"
                value={formData.total_budget || 0}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="edit_spent_amount"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Spent Amount (VND) *
              </label>
              <input
                id="edit_spent_amount"
                name="spent_amount"
                type="number"
                value={formData.spent_amount || 0}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                max={formData.total_budget || undefined}
                className="w-full p-3 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-trip focus:border-trip transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-semibold transition-colors ${
                loading
                  ? "bg-trip/60 cursor-not-allowed"
                  : "bg-trip hover:bg-trip/90 shadow-lg shadow-trip/30"
              }`}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{loading ? "Updating..." : "Update Trip"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
