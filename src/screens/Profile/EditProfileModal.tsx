"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  User,
  Phone,
  Image as ImageIcon,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { Profile } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/lib/supabase";
import { COLORS } from "@/constants/colors";

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
  const [avatarFile, setAvatarFile] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null
  );
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
      setExistingAvatarUrl(profile.avatar_url || null);
      setAvatarFile(null);
      setError(null);
    }
  }, [isOpen, profile]);

  // Cleanup URL object when component unmounts or avatarFile changes
  useEffect(() => {
    return () => {
      if (avatarFile) {
        URL.revokeObjectURL(avatarFile.url);
      }
    };
  }, [avatarFile]);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setAvatarFile({
      file,
      url: URL.createObjectURL(file),
    });
    setError(null);
  };

  const handleRemoveAvatar = () => {
    if (avatarFile) {
      URL.revokeObjectURL(avatarFile.url);
      setAvatarFile(null);
    }
    setExistingAvatarUrl(null);
    // Mark avatar as removed
    setFormData((prev) => ({
      ...prev,
      avatar_url: "", // Empty string indicates removal
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
      // Upload avatar image if a new file is selected
      let avatarUrl: string | null = existingAvatarUrl;
      if (avatarFile) {
        try {
          avatarUrl = await uploadFile(
            avatarFile.file,
            `avatars/${user.id}/${Date.now()}-${avatarFile.file.name}`
          );
        } catch (uploadError: any) {
          setError(uploadError.message || "Failed to upload avatar image");
          setLoading(false);
          return;
        }
      }

      // Update user data (full_name, phone, avatar_url)
      const userUpdatePayload: any = {};
      if (formData.full_name) userUpdatePayload.full_name = formData.full_name;
      if (formData.phone) userUpdatePayload.phone = formData.phone;

      // Handle avatar URL: if removed (empty string), set to empty; if uploaded, use new URL; otherwise keep existing
      if (formData.avatar_url === "" && !avatarFile && !existingAvatarUrl) {
        // User explicitly removed avatar
        userUpdatePayload.avatar_url = "";
      } else if (avatarUrl !== null && avatarUrl !== undefined) {
        // Use uploaded or existing avatar URL
        userUpdatePayload.avatar_url = avatarUrl;
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-colors duration-300">
      <div className={`${COLORS.BACKGROUND.CARD} rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-300`}>
        {/* Header */}
        <div className={`sticky top-0 ${COLORS.BACKGROUND.CARD} border-b ${COLORS.BORDER.DEFAULT} px-6 py-4 flex items-center justify-between rounded-t-2xl transition-colors duration-300`}>
          <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>Edit Profile</h2>
          <button
            onClick={onClose}
            className={`p-2 hover:${COLORS.BACKGROUND.MUTED} rounded-full transition-all duration-200`}
            disabled={loading}
          >
            <X className={`w-5 h-5 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className={`bg-destructive/10 border-destructive text-destructive px-4 py-3 rounded-lg transition-colors duration-200`}>
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className={`block text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}
            >
              <User className={`w-4 h-4 inline mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
              Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
              className={`w-full p-3 ${COLORS.BORDER.DEFAULT} rounded-lg ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} transition-all duration-200`}
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className={`block text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}
            >
              <Phone className={`w-4 h-4 inline mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full p-3 ${COLORS.BORDER.DEFAULT} rounded-lg ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} transition-all duration-200`}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label
              htmlFor="avatar"
              className={`block text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}
            >
              <ImageIcon className={`w-4 h-4 inline mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
              Profile Picture
            </label>

            {/* Avatar Preview */}
            {(avatarFile || existingAvatarUrl) && (
              <div className="mb-4 relative inline-block">
                <div className={`w-32 h-32 rounded-xl overflow-hidden border-2 ${COLORS.BORDER.DEFAULT} shadow-md transition-colors duration-200`}>
                  <img
                    src={avatarFile?.url || existingAvatarUrl || ""}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove avatar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="avatar"
                className={`flex items-center gap-2 px-4 py-2 ${COLORS.PRIMARY.DEFAULT} rounded-lg ${COLORS.PRIMARY.HOVER} transition-all duration-200 cursor-pointer font-medium`}
              >
                <Upload className="w-4 h-4 transition-colors duration-200" />
                {avatarFile || existingAvatarUrl
                  ? "Change Picture"
                  : "Upload Picture"}
              </label>
              <input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {!avatarFile && !existingAvatarUrl && (
                <span className={`text-sm ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                  Select an image file (max 5MB)
                </span>
              )}
            </div>
            <p className={`mt-2 text-xs ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
              Upload a profile picture. Supported formats: JPG, PNG, GIF (max
              5MB)
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className={`block text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}
            >
              <FileText className={`w-4 h-4 inline mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className={`w-full p-3 ${COLORS.BORDER.DEFAULT} rounded-lg ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} transition-all duration-200 resize-none`}
              placeholder="Tell us about yourself..."
            />
            <p className={`mt-1 text-xs ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
              Share a brief description about yourself
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-4 py-3 ${COLORS.BORDER.DEFAULT} ${COLORS.TEXT.MUTED} rounded-lg hover:${COLORS.BACKGROUND.MUTED} transition-all duration-200 font-semibold disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 ${COLORS.PRIMARY.DEFAULT} rounded-lg ${COLORS.PRIMARY.HOVER} transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
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
