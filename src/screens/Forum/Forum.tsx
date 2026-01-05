"use client";

import { IPost, IPostReply } from "@/types/forum";
import {
  Clock,
  MessageCircle,
  Plus,
  TrendingUp,
  Filter,
  User,
  Heart,
  Globe,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { forumService } from "../../services/forumService";

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

type TabType = "public" | "my-posts";

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("public");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">(
    "recent"
  );
  const [postComments, setPostComments] = useState<
    Record<string, IPostReply[]>
  >({});
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

      // Fetch comments for posts that have replies
      const postsWithReplies = transformedPosts.filter(
        (p) => (p.reply_count || 0) > 0
      );
      if (postsWithReplies.length > 0) {
        fetchCommentsForPosts(postsWithReplies);
      }
    } catch (error) {
      console.error("Error fetching forum data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForPosts = async (posts: IPost[]) => {
    if (!API_URL) return;

    try {
      const commentsMap: Record<string, IPostReply[]> = {};

      // Fetch comments for each post (limit to first 2 most recent)
      const commentPromises = posts.map(async (post) => {
        try {
          const replies = await forumService.getReplies(post.id);
          if (replies && replies.length > 0) {
            // Fetch user info for comment authors
            const repliesWithUsers = await Promise.all(
              replies.slice(0, 2).map(async (reply: IPostReply) => {
                try {
                  const userRes = await fetch(
                    `${API_URL}/users/${reply.user_id}`
                  );
                  if (userRes.ok) {
                    const userData = await userRes.json();
                    const userInfo = userData.data || userData;
                    return {
                      ...reply,
                      profiles: {
                        id: userInfo.id || reply.user_id,
                        full_name: userInfo.full_name || "User",
                        avatar_url: userInfo.avatar_url || null,
                        account_id: userInfo.account_id,
                        phone: userInfo.phone,
                      },
                    };
                  }
                } catch (err) {
                  console.error(`Error fetching user ${reply.user_id}:`, err);
                }
                return {
                  ...reply,
                  profiles: {
                    id: reply.user_id,
                    full_name: "User",
                    avatar_url: null,
                    account_id: "",
                    phone: "",
                  },
                };
              })
            );
            commentsMap[post.id] = repliesWithUsers;
          }
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
        }
      });

      await Promise.all(commentPromises);
      setPostComments(commentsMap);
    } catch (error) {
      console.error("Error fetching comments:", error);
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
      <div className="flex justify-center items-center h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading forum...</p>
        </div>
      </div>
    );
  }

  // Filter posts based on active tab, category
  let filteredPosts = posts;

  // Apply tab filter (My Posts vs Public Posts)
  if (activeTab === "my-posts" && user) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.user_id === user.id || String(post.user_id) === String(user.id)
    );
  }

  // Apply category filter
  if (selectedCategory) {
    filteredPosts = filteredPosts.filter(
      (post) => post.forum_categories?.name === selectedCategory
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

  // Calculate post counts for tabs
  const myPostsCount = user
    ? posts.filter(
        (p) => p.user_id === user.id || String(p.user_id) === String(user.id)
      ).length
    : 0;
  const publicPostsCount = posts.length;

  return (
    <div className="min-h-screen bg-linear-to-brrom-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Community Forum
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Share experiences, ask questions, and connect with travelers
              </p>
            </div>
            <Link
              href="/forum/new"
              className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>New Post</span>
            </Link>
          </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab("public");
                  setSelectedCategory(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === "public"
                    ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Public Posts</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "public"
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {publicPostsCount}
                </span>
              </button>
              {user && (
                <button
                  onClick={() => {
                    setActiveTab("my-posts");
                    setSelectedCategory(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    activeTab === "my-posts"
                      ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>My Posts</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === "my-posts"
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {myPostsCount}
                  </span>
                </button>
              )}
            </div>
          </div>
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
                  {activeTab === "my-posts"
                    ? "You haven't created any posts yet. Start sharing your travel experiences!"
                    : selectedCategory
                    ? `No posts in "${selectedCategory}" category yet.`
                    : "No posts yet. Be the first to share!"}
                </p>
                {activeTab === "my-posts" && (
                  <Link
                    href="/forum/new"
                    className="inline-flex items-center gap-2 mt-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Post</span>
                  </Link>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-blue-400 hover:-translate-y-1 block group overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white group-hover:ring-blue-200 transition-all">
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || "User"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {post.profiles?.full_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Category and Pinned Badge */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-all group-hover:scale-105"
                            style={{
                              backgroundColor: `${post.forum_categories?.color}15`,
                              borderColor: post.forum_categories?.color,
                              color: post.forum_categories?.color,
                            }}
                          >
                            {post.forum_categories?.name || "General"}
                          </span>
                          {post.is_pinned && (
                            <span className="text-xs bg-linear-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2.5 py-1 rounded-full font-semibold border border-yellow-300 flex items-center gap-1">
                              <span>📌</span>
                              <span>Pinned</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Post Image */}
                        {post.image && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        {/* Content Preview */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>

                        {/* Comments Preview */}
                        {postComments[post.id] &&
                          postComments[post.id].length > 0 && (
                            <div className="mb-4 space-y-2 border-t border-gray-100 pt-3">
                              <div className="text-xs font-semibold text-gray-500 mb-2">
                                Recent Comments
                              </div>
                              {postComments[post.id].map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex gap-2 bg-gray-50 rounded-lg p-2.5 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="w-6 h-6 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
                                    {comment.profiles?.avatar_url ? (
                                      <img
                                        src={comment.profiles.avatar_url}
                                        alt={
                                          comment.profiles.full_name || "User"
                                        }
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold text-white">
                                        {comment.profiles?.full_name
                                          ?.charAt(0)
                                          .toUpperCase() || "U"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-gray-700">
                                        {comment.profiles?.full_name || "User"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {post.reply_count >
                                postComments[post.id].length && (
                                <div className="text-xs text-gray-500 text-center pt-1">
                                  +
                                  {post.reply_count -
                                    postComments[post.id].length}{" "}
                                  more comment
                                  {post.reply_count -
                                    postComments[post.id].length !==
                                  1
                                    ? "s"
                                    : ""}
                                </div>
                              )}
                            </div>
                          )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                              {post.reply_count || 0}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-medium">
                              {post.total_likes || 0}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{formatTimeAgo(post.last_activity_at)}</span>
                          </span>
                          <span className="text-gray-600 font-semibold ml-auto">
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
                Sort & Filter
              </h3>

              {/* Sort By */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">
                  Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: "recent", label: "Most Recent", icon: Clock },
                    { value: "popular", label: "Most Popular", icon: Heart },
                    { value: "trending", label: "Trending", icon: Sparkles },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as any)}
                        className={`w-full flex items-center gap-2 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          sortBy === option.value
                            ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border-2 border-blue-200 shadow-sm"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
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
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === null
                      ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>All Topics</span>
                  {selectedCategory === null && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {activeTab === "my-posts"
                        ? myPostsCount
                        : publicPostsCount}
                    </span>
                  )}
                </button>
                {categories.map((category) => {
                  const isActive = selectedCategory === category.name;
                  // Filter category count based on active tab
                  const categoryCount =
                    activeTab === "my-posts" && user
                      ? posts.filter(
                          (p) =>
                            p.forum_categories?.name === category.name &&
                            (p.user_id === user.id ||
                              String(p.user_id) === String(user.id))
                        ).length
                      : posts.filter(
                          (p) => p.forum_categories?.name === category.name
                        ).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.name);
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
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
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
            <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
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
