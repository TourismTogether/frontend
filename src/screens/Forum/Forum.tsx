"use client";

import { IPost, IPostReply } from "@/types/forum";
import Image from "next/image";
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
import { API_ENDPOINTS, getTravelImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";
import ShimmerCard from "../../components/Animations/ShimmerCard";

export interface ICategory {
  id: string;
  name: string;
  color: string;
}

interface UserInfo {
  id: string;
  full_name?: string;
  avatar_url?: string | null;
  account_id?: string;
  phone?: string;
}

interface PostApiResponse {
  id: string | number;
  uuid?: string;
  user_id?: string | number;
  id_user?: string | number;
  title: string;
  content: string;
  image?: string;
  tags?: string;
  reply_count?: number;
  total_views?: number;
  total_likes?: number;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

interface UserApiResponse {
  data?: UserInfo;
  id?: string;
  full_name?: string;
  avatar_url?: string | null;
}

const getCategoryColor = (category: string): string => {
  switch (category) {
    case "Travel Tips":
      return "#16a34a"; // green-600
    case "Destinations":
      return "#22c55e"; // green-500
    case "Gear & Equipment":
      return "#84cc16"; // lime-500
    default:
      return "#10b981"; // emerald-500
  }
};

type TabType = "public" | "my-posts";
type SortType = "recent" | "popular" | "trending";

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("public");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [postComments, setPostComments] = useState<
    Record<string, IPostReply[]>
  >({});

  useEffect(() => {
    fetchForumData();
  }, []);

  const fetchForumData = async () => {
    try {
      setLoading(true);

      const res = await fetch(API_ENDPOINTS.FORUM.POSTS.BASE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch forum data");
      }

      const rawData = await res.json();
      const rawPosts: PostApiResponse[] = Array.isArray(rawData) ? rawData : rawData.data || [];

      // Fetch user info for posts
      const postUserIds: string[] = [
        ...new Set(
          rawPosts
            .map((p) => String(p.user_id || p.id_user || ""))
            .filter(Boolean)
        ),
      ];

      const userInfoMap: Record<string, UserInfo> = {};

      // Fetch user details for each post author
      if (postUserIds.length > 0) {
        const userPromises = postUserIds.map(async (userId: string) => {
          if (!userId || userId === "NaN" || userId === "undefined") return null;
          try {
            const userRes = await fetch(API_ENDPOINTS.USERS.BY_ID(userId), {
              credentials: "include",
            });
            if (userRes.ok) {
              const userData: UserApiResponse = await userRes.json();
              const rawUserInfo = userData.data || userData;
              const userInfo: UserInfo = {
                id: (rawUserInfo as UserInfo).id || userId,
                full_name: (rawUserInfo as UserInfo).full_name,
                avatar_url: (rawUserInfo as UserInfo).avatar_url,
                account_id: (rawUserInfo as UserInfo).account_id,
                phone: (rawUserInfo as UserInfo).phone,
              };
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

      const transformedPosts: IPost[] = rawPosts.map((post) => {
        const userId = String(post.user_id || post.id_user || "");
        const userInfo = userInfoMap[userId] || {};
        const categoryName = post.tags?.split(",")[0]?.trim() || "General";
        return {
          id: String(post.id || post.uuid || ""),
          user_id: userId,
          title: post.title,
          content: post.content,
          tags: post.tags || "",
          last_activity_at: post.updated_at || post.created_at,
          reply_count: (post.reply_count || 0) as 0,
          total_views: post.total_views || 0,
          total_likes: post.total_likes || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          is_pinned: (post.is_pinned || false) as false,
          forum_categories: {
            name: categoryName,
            color: getCategoryColor(categoryName),
          },
          profiles: {
            id: userInfo.id || userId,
            full_name: userInfo.full_name || "User",
            avatar_url: userInfo.avatar_url || "",
            account_id: userInfo.account_id || "",
            phone: userInfo.phone || "",
          },
        };
      });

      setPosts(transformedPosts);

      const uniqueCategories = Array.from(
        new Set(
          transformedPosts
            .map((p) => p.forum_categories?.name)
            .filter(Boolean) as string[]
        )
      ).map((name) => ({
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
    try {
      const commentsMap: Record<string, IPostReply[]> = {};

      const commentPromises = posts.map(async (post) => {
        try {
          // Validate post ID before fetching replies
          if (!post.id || post.id === "NaN" || post.id === "undefined" || String(post.id).trim() === "") {
            console.warn("Invalid post ID, skipping replies fetch:", post.id);
            return;
          }
          const replies = await forumService.getReplies(String(post.id));
          if (replies && replies.length > 0) {
            const repliesWithUsers = await Promise.all(
              replies.slice(0, 2).map(async (reply: IPostReply) => {
                try {
                  if (!reply.user_id || reply.user_id === "NaN" || reply.user_id === "undefined") {
                    return {
                      ...reply,
                      profiles: {
                        id: reply.user_id || "",
                        full_name: "User",
                        avatar_url: "",
                        account_id: "",
                        phone: "",
                      },
                    };
                  }
                  const userRes = await fetch(
                    API_ENDPOINTS.USERS.BY_ID(String(reply.user_id)),
                    { credentials: "include" }
                  );
                  if (userRes.ok) {
                    const userData: UserApiResponse = await userRes.json();
                    const userInfo = userData.data || userData;
                    return {
                      ...reply,
                      profiles: {
                        id: (userInfo as UserInfo).id || reply.user_id,
                        full_name: (userInfo as UserInfo).full_name || "User",
                        avatar_url: (userInfo as UserInfo).avatar_url || "",
                        account_id: (userInfo as UserInfo).account_id || "",
                        phone: (userInfo as UserInfo).phone || "",
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
                    avatar_url: "",
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

  const formatTimeAgo = (dateString: string): string => {
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
    return <Loading type="forum" />;
  }

  // Filter posts based on active tab, category
  let filteredPosts = posts;

  if (activeTab === "my-posts" && user) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.user_id === String(user.id) || String(post.user_id) === String(user.id)
    );
  }

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

  const myPostsCount = user
    ? posts.filter(
        (p) => p.user_id === String(user.id) || String(p.user_id) === String(user.id)
      ).length
    : 0;
  const publicPostsCount = posts.length;

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
      {/* Hero Section */}
      <Hero
        title="Community Forum 💬"
        description="Share experiences, ask questions, and connect with travelers"
        imageKeyword="community discussion forum"
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
        {/* Header with New Post Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
              Travel Discussions
            </h2>
            <p className={`${COLORS.TEXT.MUTED} mt-1`}>
              Join the conversation and share your adventures
            </p>
          </div>
          <Link
            href="/forum/new"
            className={`flex items-center space-x-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold ${ANIMATIONS.PULSE.GLOW}`}
          >
            <Plus className={`w-5 h-5 ${ANIMATIONS.ROTATE.MEDIUM}`} />
            <span>New Post</span>
          </Link>
        </div>

        {/* Tabs Section */}
        <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-2 mb-6`}>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab("public");
                setSelectedCategory(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === "public"
                  ? `${GRADIENTS.PRIMARY} text-white shadow-lg scale-105`
                  : `${COLORS.TEXT.MUTED} hover:${COLORS.BACKGROUND.MUTED}`
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Public Posts</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "public"
                    ? "bg-white/20 text-white"
                    : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.MUTED}`
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
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === "my-posts"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                    : `${COLORS.TEXT.MUTED} hover:${COLORS.BACKGROUND.MUTED}`
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Posts</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "my-posts"
                      ? "bg-white/20 text-white"
                      : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.MUTED}`
                  }`}
                >
                  {myPostsCount}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {filteredPosts.length === 0 ? (
              <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-2 border-dashed rounded-xl shadow-lg p-16 text-center`}>
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                  <Image
                    src={getTravelImageUrl("no posts discussion", 200, 200)}
                    alt="No posts"
                    fill
                    className="object-cover opacity-50"
                    unoptimized
                  />
                </div>
                <MessageCircle className={`w-16 h-16 ${COLORS.TEXT.MUTED} mx-auto mb-4`} />
                <h3 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT} mb-2`}>
                  No posts found
                </h3>
                <p className={COLORS.TEXT.MUTED}>
                  {activeTab === "my-posts"
                    ? "You haven't created any posts yet. Start sharing your travel experiences!"
                    : selectedCategory
                    ? `No posts in "${selectedCategory}" category yet.`
                    : "No posts yet. Be the first to share!"}
                </p>
                {activeTab === "my-posts" && (
                  <Link
                    href="/forum/new"
                    className={`inline-flex items-center gap-2 mt-4 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Post</span>
                  </Link>
                )}
              </div>
            ) : (
              filteredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.id}`}
                  className={`${ANIMATIONS.FADE.IN_UP} block`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ShimmerCard
                    className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                    shimmer={false}
                  >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-14 h-14 ${GRADIENTS.PRIMARY} rounded-full flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white group-hover:ring-accent/50 transition-all ${ANIMATIONS.PULSE.GENTLE}`}>
                        {post.profiles?.avatar_url ? (
                          <Image
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || "User"}
                            width={56}
                            height={56}
                            className="rounded-full object-cover"
                            unoptimized
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
                            <span className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-2.5 py-1 rounded-full font-semibold border border-yellow-300 flex items-center gap-1">
                              <span>📌</span>
                              <span>Pinned</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT} mb-2 group-hover:${COLORS.TEXT.PRIMARY} transition-colors line-clamp-2`}>
                          {post.title}
                        </h3>

                        {/* Post Image */}
                        {post.image && (
                          <div className={`mb-3 rounded-lg overflow-hidden ${COLORS.BORDER.DEFAULT} border`}>
                            <Image
                              src={post.image}
                              alt={post.title}
                              width={600}
                              height={200}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Content Preview */}
                        <p className={`${COLORS.TEXT.MUTED} text-sm mb-4 line-clamp-2 leading-relaxed`}>
                          {post.content}
                        </p>

                        {/* Comments Preview */}
                        {postComments[post.id] &&
                          postComments[post.id].length > 0 && (
                            <div className={`mb-4 space-y-2 border-t ${COLORS.BORDER.DEFAULT} pt-3`}>
                              <div className={`text-xs font-semibold ${COLORS.TEXT.MUTED} mb-2`}>
                                Recent Comments
                              </div>
                              {postComments[post.id].map((comment) => (
                                <div
                                  key={comment.id}
                                  className={`flex gap-2 ${COLORS.BACKGROUND.MUTED} rounded-lg p-2.5 hover:${COLORS.BACKGROUND.SECONDARY} transition-colors`}
                                >
                                  <div className={`w-6 h-6 ${GRADIENTS.PRIMARY} rounded-full flex items-center justify-center shrink-0`}>
                                    {comment.profiles?.avatar_url ? (
                                      <Image
                                        src={comment.profiles.avatar_url}
                                        alt={comment.profiles.full_name || "User"}
                                        width={24}
                                        height={24}
                                        className="rounded-full object-cover"
                                        unoptimized
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
                                      <span className={`text-xs font-semibold ${COLORS.TEXT.DEFAULT}`}>
                                        {comment.profiles?.full_name || "User"}
                                      </span>
                                    </div>
                                    <p className={`text-xs ${COLORS.TEXT.MUTED} line-clamp-2`}>
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {post.reply_count &&
                                post.reply_count > postComments[post.id].length && (
                                <div className={`text-xs ${COLORS.TEXT.MUTED} text-center pt-1`}>
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
                        <div className={`flex flex-wrap items-center gap-4 text-sm ${COLORS.TEXT.MUTED}`}>
                          <span className={`flex items-center gap-1.5 ${COLORS.BACKGROUND.MUTED} px-3 py-1 rounded-lg`}>
                            <MessageCircle className={`w-4 h-4 ${COLORS.TEXT.PRIMARY}`} />
                            <span className="font-medium">
                              {post.reply_count || 0}
                            </span>
                          </span>
                          <span className={`flex items-center gap-1.5 ${COLORS.BACKGROUND.MUTED} px-3 py-1 rounded-lg`}>
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-medium">
                              {post.total_likes || 0}
                            </span>
                          </span>
                          <span className={`flex items-center gap-1.5 ${COLORS.BACKGROUND.MUTED} px-3 py-1 rounded-lg`}>
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(post.last_activity_at)}</span>
                          </span>
                          <span className={`${COLORS.TEXT.DEFAULT} font-semibold ml-auto`}>
                            {post.profiles?.full_name || "User"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </ShimmerCard>
                </Link>
              ))
            )}
          </div>

          <div className="space-y-6">
            {/* Filters */}
            <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-6`}>
              <h3 className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} mb-4 flex items-center`}>
                <Filter className={`w-5 h-5 mr-2 ${COLORS.TEXT.PRIMARY}`} />
                Sort & Filter
              </h3>

              <div className="mb-4">
                <label className={`text-xs font-semibold ${COLORS.TEXT.MUTED} uppercase tracking-wide mb-3 block`}>
                  Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: "recent" as SortType, label: "Most Recent", icon: Clock },
                    { value: "popular" as SortType, label: "Most Popular", icon: Heart },
                    { value: "trending" as SortType, label: "Trending", icon: Sparkles },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`w-full flex items-center gap-2 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          sortBy === option.value
                            ? `${COLORS.PRIMARY.LIGHT} ${COLORS.TEXT.PRIMARY} ${COLORS.BORDER.PRIMARY} border-2 shadow-sm`
                            : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.SECONDARY} border-2 border-transparent`
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
            <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-6`}>
              <h3 className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} mb-4 flex items-center`}>
                <TrendingUp className={`w-5 h-5 mr-2 ${COLORS.TEXT.PRIMARY}`} />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === null
                      ? `${GRADIENTS.PRIMARY} text-white shadow-lg`
                      : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.SECONDARY}`
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
                  const categoryCount =
                    activeTab === "my-posts" && user
                      ? posts.filter(
                          (p) =>
                            p.forum_categories?.name === category.name &&
                            (p.user_id === String(user.id) ||
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
                          : `${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} hover:${COLORS.BORDER.PRIMARY}`
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
                          isActive ? "bg-white/20" : COLORS.BACKGROUND.MUTED
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
            <div className={`${GRADIENTS.PRIMARY} rounded-xl shadow-lg p-6 text-white`}>
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
