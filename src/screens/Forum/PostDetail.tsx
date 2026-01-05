"use client";

import { useAuth } from "@/contexts/AuthContext";
import { forumService } from "@/services/forumService";
import { IPost, IPostReply } from "@/types/forum";
import { User } from "@/types/user";
import {
  ArrowLeft,
  Calendar,
  Edit3,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Trash2,
  UserRound,
  UserIcon,
  Clock,
  TrendingUp,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PostDetailProps {
  postData: IPost;
}

export default function PostDetail({ postData }: PostDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner =
    user?.id === postData.user_id ||
    String(user?.id) === String(postData.user_id);

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editTitle, setEditTitle] = useState(postData.title || "");
  const [editContent, setEditContent] = useState(postData.content || "");
  const [isSaving, setIsSaving] = useState(false);

  const [replies, setReplies] = useState<IPostReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLiked, setIsLiked] = useState(postData.is_liked || false);
  const [likesCount, setLikesCount] = useState(postData.total_likes || 0);
  const [postAuthor, setPostAuthor] = useState<{
    full_name: string;
    avatar_url?: string | null;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch post author information if not already present
  useEffect(() => {
    const fetchPostAuthor = async () => {
      if (postData.profiles?.full_name) {
        setPostAuthor({
          full_name: postData.profiles.full_name,
          avatar_url: postData.profiles.avatar_url,
        });
        return;
      }

      if (!postData.user_id) return;

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const userRes = await fetch(`${API_URL}/users/${postData.user_id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          const userInfo = userData.data || userData;
          setPostAuthor({
            full_name: userInfo.full_name || "User",
            avatar_url: userInfo.avatar_url || null,
          });
        }
      } catch (err) {
        console.error(`Error fetching post author ${postData.user_id}:`, err);
        setPostAuthor({
          full_name: "User",
          avatar_url: null,
        });
      }
    };

    fetchPostAuthor();
  }, [postData.user_id, postData.profiles]);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await forumService.getReplies(postData.id);

        const repliesWithUsers = await Promise.all(
          response.map(async (reply: IPostReply) => {
            try {
              const userRes = await fetch(`${API_URL}/users/${reply.user_id}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                const userInfo = userData.data || userData;
                return {
                  ...reply,
                  profiles: {
                    id: userInfo.id,
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

        setReplies(repliesWithUsers);
      } catch (error) {
        console.error("Lỗi tải phản hồi:", error);
      }
    };
    fetchReplies();
  }, [postData.id]);

  const handleToggleLike = async () => {
    if (!user) return alert("Vui lòng đăng nhập!");
    const originalLiked = isLiked;
    const originalCount = likesCount;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    try {
      await forumService.toggleLike(postData.id, user.id);
    } catch {
      setIsLiked(originalLiked);
      setLikesCount(originalCount);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    if (!user) return alert("Vui lòng đăng nhập để bình luận!");

    try {
      // 1. Gọi API tạo reply
      const newReply = await forumService.createReply(
        postData.id,
        replyText,
        user.id
      );

      const replyWithUser: IPostReply = {
        ...newReply,
        profiles: {
          id: user.id,
          account_id: user.account_id || "",
          full_name: user.full_name || "User",
          avatar_url: user.avatar_url || "",
          phone: user.phone || "",
        } as User,
      };

      setReplies((prev) => [replyWithUser, ...prev]);
      setReplyText("");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Không thể gửi bình luận vào lúc này.");
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      console.log(postData.id, editTitle, editContent);
      const response = await forumService.update(postData.id!, {
        title: editTitle,
        content: editContent,
      });
      console.log(postData.id, editTitle, editContent);
      if (response) {
        alert("Cập nhật thành công!");
        setIsEditingMode(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Lỗi khi cập nhật bài viết.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

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
  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;

    setIsDeleting(true);
    try {
      const response = await forumService.delete(postData.id!);

      if (response) {
        alert("Xóa bài viết thành công!");
        router.push("/forum");
        router.refresh();
      } else {
        alert("Có lỗi xảy ra khi xóa bài viết.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      alert("Không thể copy URL. Vui lòng thử lại.");
    }
  };

  const categoryName = (postData.tags || "").split(",")[0]?.trim() || "General";
  const categoryColor = getCategoryColor(categoryName);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto min-w-7xl">
        {/* Header Section */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-semibold group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Forum</span>
          </button>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setIsEditingMode(!isEditingMode)}
                className="flex items-center px-5 py-2.5 bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 text-sm font-semibold border-2 border-blue-200 hover:shadow-lg hover:scale-105"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditingMode ? "Cancel" : "Edit Post"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-5 py-2.5 bg-linear-to-r from-red-50 to-pink-50 text-red-700 rounded-xl hover:from-red-100 hover:to-pink-100 transition-all duration-200 text-sm font-semibold border-2 border-red-200 hover:shadow-lg hover:scale-105 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          )}
        </div>

        {/* Main Post Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
          {/* Post Image Header */}
          {postData.image && (
            <div className="w-full h-64 sm:h-80 overflow-hidden bg-linear-to-br from-blue-100 to-indigo-100">
              <img
                src={postData.image}
                alt={postData.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Title Section */}
            <div className="mb-6">
              {isEditingMode ? (
                <input
                  id="edit-title"
                  aria-label="Post title"
                  placeholder="Enter post title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-3xl sm:text-4xl font-bold w-full p-4 border-2 border-gray-300 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              ) : (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4 leading-tight">
                  {postData.title}
                </h1>
              )}

              {/* Category Badge */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                  className="text-xs px-4 py-2 rounded-full font-bold border-2"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    borderColor: categoryColor,
                    color: categoryColor,
                  }}
                >
                  {categoryName}
                </span>
                {postData.is_pinned && (
                  <span className="text-xs bg-linear-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-2 rounded-full font-semibold border border-yellow-300 flex items-center gap-1">
                    <span>📌</span>
                    <span>Pinned</span>
                  </span>
                )}
              </div>
            </div>

            {/* Post Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-md">
                  {postAuthor?.avatar_url || postData.profiles?.avatar_url ? (
                    <img
                      src={
                        postAuthor?.avatar_url || postData.profiles?.avatar_url
                      }
                      alt={
                        postAuthor?.full_name ||
                        postData.profiles?.full_name ||
                        "User"
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {postAuthor?.full_name ||
                      postData.profiles?.full_name ||
                      "User"}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(postData.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {formatDate(postData.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {postData.total_views || 0} views
                </span>
              </div>
            </div>

            {/* Post Content */}
            <div className="prose max-w-none text-gray-700 mb-8">
              {isEditingMode ? (
                <textarea
                  id="edit-content"
                  aria-label="Post content"
                  placeholder="Enter post content..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl min-h-[300px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50"
                />
              ) : (
                <div className="text-base sm:text-lg leading-relaxed text-gray-800">
                  {(postData.content || "")
                    .split("\n\n")
                    .map((paragraph, index) => (
                      <p key={index} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                </div>
              )}
            </div>

            {/* Tags */}
            {(postData.tags || "").split(",").filter((t) => t.trim()).length >
              1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {(postData.tags || "")
                  .split(",")
                  .slice(1)
                  .map(
                    (tag, idx) =>
                      tag.trim() && (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-linear-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full text-xs font-semibold border border-gray-200 hover:from-gray-200 hover:to-gray-100 transition-all"
                        >
                          #{tag.trim()}
                        </span>
                      )
                  )}
              </div>
            )}

            {isEditingMode && (
              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl hover:shadow-xl disabled:opacity-50 transition-all duration-200 font-semibold transform hover:scale-105"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditingMode(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-4 py-6 border-t border-b border-gray-200 mb-8 bg-linear-to-r from-gray-50 to-blue-50/30 rounded-xl px-6">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold transform hover:scale-105 ${
                  isLiked
                    ? "text-red-600 bg-red-50 hover:bg-red-100 shadow-md"
                    : "text-gray-600 hover:bg-white shadow-sm"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-bold text-lg">{likesCount || 0}</span>
                <span className="text-sm">Likes</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl bg-white shadow-sm">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-lg">
                  {replies.length || postData.reply_count || 0}
                </span>
                <span className="text-sm">
                  {replies.length === 1 ? "Comment" : "Comments"}
                </span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl bg-white shadow-sm hover:bg-gray-50 transition-all duration-200 cursor-pointer transform hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {isCopied ? "Copied!" : "Share"}
                </span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="border border-gray-200 rounded-2xl p-6 sm:p-8 bg-linear-to-br from-white to-gray-50/50 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-3 text-blue-600" />
                  Comments
                  <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {replies.length || postData.reply_count || 0}
                  </span>
                </h3>
              </div>

              {/* Comment Input Box */}
              <div className="mb-8">
                <div className="border-2 border-gray-200 rounded-2xl bg-white p-5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
                  <div className="flex gap-3 mb-3">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "You"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-gray-200">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        {user?.full_name || "Guest"}
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      user
                        ? "Share your thoughts..."
                        : "Please login to comment"
                    }
                    className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[120px] text-gray-900 placeholder:text-gray-400 text-base"
                    maxLength={2000}
                    disabled={!user}
                  />
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {replyText.length}/2000 characters
                    </span>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || !user}
                      className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {replies.length === 0 ? (
                <div className="bg-linear-to-br from-gray-50 to-blue-50/30 rounded-2xl p-16 text-center border-2 border-dashed border-gray-300">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    No comments yet
                  </h4>
                  <p className="text-gray-600 font-medium">
                    Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(replies) &&
                    replies.map((reply) => (
                      <div key={reply.id} className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg border-2 border-white ring-2 ring-gray-100">
                          {reply.profiles?.avatar_url ? (
                            <img
                              alt={reply.profiles.full_name || "User"}
                              src={reply.profiles.avatar_url}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl rounded-tl-none p-5 border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="font-bold text-gray-900 text-base">
                                  {reply.profiles?.full_name || "User"}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(reply.created_at)}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    •
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(reply.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-base">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
