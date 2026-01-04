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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Forum
        </button>

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setIsEditingMode(!isEditingMode)}
              className="flex items-center px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-200 text-sm font-semibold border border-blue-200 hover:shadow-md"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditingMode ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 text-sm font-semibold border border-red-200 hover:shadow-md disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}

        {/* Main Post Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            {isEditingMode ? (
              <input
                id="edit-title"
                aria-label="Post title"
                placeholder="Enter post title..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl font-bold w-full p-3 border-2 border-gray-300 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                {postData.title}
              </h1>
            )}

            {/* Post Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">
                  {(postData.tags || "").split(",")[0]?.trim() || "General"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(postData.created_at)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span>{postData.total_views || 0} views</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-md">
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
                    <UserRound className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-semibold text-gray-900">
                  {postAuthor?.full_name ||
                    postData.profiles?.full_name ||
                    "User"}
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
                  className="w-full p-4 border-2 border-gray-300 rounded-xl min-h-[300px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              ) : (
                <div className="text-base sm:text-lg leading-relaxed">
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

            {isEditingMode && (
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-200 font-semibold mb-8"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
            {postData.image && (
              <div className="mb-8 w-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <img
                  src={postData.image}
                  alt={postData.title}
                  className="w-full h-auto object-cover max-h-[500px]"
                />
              </div>
            )}
            {/* Tags */}
            {(postData.tags || "").split(",").filter((t) => t.trim()).length >
              0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {(postData.tags || "").split(",").map(
                  (tag, idx) =>
                    tag.trim() && (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200 hover:bg-gray-200 transition-colors"
                      >
                        #{tag.trim()}
                      </span>
                    )
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-200 mb-8">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isLiked
                    ? "text-red-600 bg-red-50 hover:bg-red-100"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-bold">{likesCount || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="font-bold">
                  {replies.length}{" "}
                  {replies.length === 1 ? "Comment" : "Comments"}
                </span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border border-gray-200 rounded-xl p-6 sm:p-8 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                Comments ({replies.length || postData.reply_count || 0})
              </h3>

              {/* Comment Input Box */}
              <div className="mb-8">
                <div className="border-2 border-gray-200 rounded-xl bg-gray-50 p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[120px] text-gray-900 placeholder:text-gray-400 text-sm"
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {replyText.length}/2000 characters
                    </span>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {replies.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.isArray(replies) &&
                    replies.map((reply) => (
                      <div key={reply.id} className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md border-2 border-white">
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
                          <div className="bg-gray-50 rounded-2xl rounded-tl-none p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-900">
                                {reply.profiles?.full_name || "User"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
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
