"use client";

import { IPost } from "@/types/forum";
import {
  Clock,
  Eye,
  MessageCircle,
  Plus,
  TrendingUp,
  Filter,
  User,
  Heart,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export interface ICategory {
  id: string;
  name: string;
  color: string;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Travel Tips":
      return "#10b981";
    case "Destinations":
      return "#3b82f6";
    case "Gear & Equipment":
      return "#f59e0b";
    default:
      return "#6366f1";
  }
};

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">(
    "recent"
  );
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (API_URL) {
      fetchForumData();
    }
  }, [API_URL]);

  const fetchForumData = async () => {
    if (!API_URL) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/posts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch forum data");
      }

      const rawData = await res.json();
      const rawPosts = Array.isArray(rawData) ? rawData : rawData.data || [];

      // Fetch user info for posts
      const postUserIds: string[] = [
        ...new Set(
          rawPosts
            .map((p: any) => p.user_id || p.id_user)
            .filter(Boolean) as string[]
        ),
      ];

      const userInfoMap: Record<string, any> = {};

      // Fetch user details for each post author
      if (postUserIds.length > 0) {
        const userPromises = postUserIds.map(async (userId: string) => {
          if (!userId) return null;
          try {
            const userRes = await fetch(`${API_URL}/users/${userId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              const userInfo = userData.data || userData;
              return { userId, userData: userInfo };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching user ${userId}:`, err);
            return null;
          }
        });

        const userResults = await Promise.all(userPromises);
        userResults.forEach((result) => {
          if (result) {
            userInfoMap[result.userId] = result.userData;
          }
        });
      }

      const transformedPosts: IPost[] = rawPosts.map((post: any) => {
        const userId = post.user_id || post.id_user;
        const userInfo = userInfoMap[userId] || {};
        const categoryName = post.tags?.split(",")[0]?.trim() || "General";
        return {
          ...post,
          id: post.id || post.uuid,
          user_id: userId,
          last_activity_at: post.updated_at || post.created_at,
          reply_count: post.reply_count || 0,
          total_views: post.total_views || 0,
          total_likes: post.total_likes || 0,
          is_pinned: post.is_pinned || false,
          forum_categories: {
            name: categoryName,
            color: getCategoryColor(categoryName),
          },
          profiles: {
            id: userInfo.id || userId,
            full_name: userInfo.full_name || "User",
            avatar_url: userInfo.avatar_url || null,
            account_id: userInfo.account_id,
            phone: userInfo.phone,
          },
        };
      });

      setPosts(transformedPosts);

      const uniqueCategories = Array.from(
        new Set(
          transformedPosts
            .map((p: any) => p.forum_categories?.name)
            .filter(Boolean)
        )
      ).map((name: any) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        color: getCategoryColor(name),
      }));

      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching forum data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading forum...</p>
        </div>
      </div>
    );
  }

  // Filter posts based on category and "Your Posts" filter
  let filteredPosts = posts;

  // Apply category filter
  if (selectedCategory) {
    filteredPosts = filteredPosts.filter(
      (post) => post.forum_categories?.name === selectedCategory
    );
  }

  // Apply "Your Posts" filter
  if (showMyPosts && user) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.user_id === user.id || String(post.user_id) === String(user.id)
    );
  }

  // Sort posts
  filteredPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.total_likes || 0) - (a.total_likes || 0);
      case "trending":
        const aScore = (b.total_likes || 0) * 2 + (b.reply_count || 0);
        const bScore = (a.total_likes || 0) * 2 + (a.reply_count || 0);
        return aScore - bScore;
      case "recent":
      default:
        return (
          new Date(b.last_activity_at || b.created_at).getTime() -
          new Date(a.last_activity_at || a.created_at).getTime()
        );
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">
              Community Forum
            </h1>
            <p className="text-gray-600 text-lg">
              Share experiences and ask questions
            </p>
          </div>
          <Link
            href="/forum/new"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>New Post</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-dashed border-gray-300">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-600">
                  {showMyPosts
                    ? "You haven't created any posts yet."
                    : selectedCategory
                    ? `No posts in "${selectedCategory}" category yet.`
                    : "No posts yet. Be the first to share!"}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:-translate-y-1 block group"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || "User"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">
                            {post.profiles?.full_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Category and Pinned Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="text-xs px-3 py-1 rounded-full font-semibold border-2"
                            style={{
                              backgroundColor: `${post.forum_categories?.color}15`,
                              borderColor: post.forum_categories?.color,
                              color: post.forum_categories?.color,
                            }}
                          >
                            {post.forum_categories?.name || "General"}
                          </span>
                          {post.is_pinned && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold border border-yellow-300">
                              📌 Pinned
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 text-gray-400" />
                            <span>{post.reply_count || 0}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-gray-400" />
                            <span>{post.total_likes || 0}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{formatTimeAgo(post.last_activity_at)}</span>
                          </span>
                          <span className="text-gray-400 font-medium">
                            {post.profiles?.full_name || "User"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Filters
              </h3>

              {/* Your Posts Filter */}
              {user && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setShowMyPosts(!showMyPosts);
                      if (!showMyPosts) {
                        setSelectedCategory(null);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showMyPosts
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Your Posts</span>
                    </div>
                    {showMyPosts && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {
                          posts.filter(
                            (p) =>
                              p.user_id === user.id ||
                              String(p.user_id) === String(user.id)
                          ).length
                        }
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Sort By */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                  Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: "recent", label: "Most Recent" },
                    { value: "popular", label: "Most Popular" },
                    { value: "trending", label: "Trending" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        sortBy === option.value
                          ? "bg-blue-50 text-blue-700 border-2 border-blue-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories Sidebar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowMyPosts(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === null && !showMyPosts
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>All Topics</span>
                  {selectedCategory === null && !showMyPosts && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {posts.length}
                    </span>
                  )}
                </button>
                {categories.map((category) => {
                  const isActive = selectedCategory === category.name;
                  const categoryCount = posts.filter(
                    (p) => p.forum_categories?.name === category.name
                  ).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setShowMyPosts(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                        isActive
                          ? "shadow-lg scale-105"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      style={{
                        borderColor: isActive ? category.color : undefined,
                        backgroundColor: isActive
                          ? `${category.color}15`
                          : undefined,
                        color: isActive ? category.color : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive ? "bg-white/20" : "bg-gray-100"
                        }`}
                      >
                        {categoryCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forum Guidelines */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-4">Forum Guidelines</h3>
              <ul className="text-sm space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Be respectful and friendly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Share your experiences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Help fellow travelers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>No spam or self-promotion</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
