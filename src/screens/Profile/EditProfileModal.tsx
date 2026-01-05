"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  User,
  Phone,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Profile } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onProfileUpdated: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
      });
      setError(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!API_URL || !user?.id) {
      setError("API URL or User ID is missing.");
      setLoading(false);
      return;
    }

    try {
      // Update user data (full_name, phone, avatar_url)
      const userUpdatePayload: any = {};
      if (formData.full_name) userUpdatePayload.full_name = formData.full_name;
      if (formData.phone) userUpdatePayload.phone = formData.phone;
      if (formData.avatar_url !== undefined)
        userUpdatePayload.avatar_url = formData.avatar_url;

      // Update traveller data (bio)
      const travellerUpdatePayload: any = {};
      if (formData.bio !== undefined) travellerUpdatePayload.bio = formData.bio;

      // Update user if there are fields to update
      if (Object.keys(userUpdatePayload).length > 0) {
        const userResponse = await fetch(`${API_URL}/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(userUpdatePayload),
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || "Failed to update user");
        }
      }

      // Update traveller if there are fields to update
      if (Object.keys(travellerUpdatePayload).length > 0 && user.id) {
        const travellerResponse = await fetch(
          `${API_URL}/travellers/${user.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(travellerUpdatePayload),
          }
        );

        if (!travellerResponse.ok) {
          const errorData = await travellerResponse.json();
          throw new Error(
            errorData.message || "Failed to update traveller profile"
          );
        }
      }

      onProfileUpdated();
      onClose();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              <User className="w-4 h-4 inline mr-2" />
              Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label
              htmlFor="avatar_url"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              <ImageIcon className="w-4 h-4 inline mr-2" />
              Avatar URL
            </label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL to your profile picture
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Share a brief description about yourself
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
