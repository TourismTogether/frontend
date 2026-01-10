"use client";

import { useAuth } from "@/contexts/AuthContext";
import { forumService } from "@/services/forumService";
import { IPost, IPostReply } from "@/types/forum";
import { User } from "@/types/user";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Edit3,
    Eye,
    Heart,
    MessageCircle,
    Send,
    Share2,
    Trash2,
    UserIcon,
    UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { COLORS, GRADIENTS } from "@/constants/colors";

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
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editReplyText, setEditReplyText] = useState("");
    const [isUpdatingReply, setIsUpdatingReply] = useState(false);
    const [isLiked, setIsLiked] = useState(postData.is_liked || false);
    const [likesCount, setLikesCount] = useState(postData.total_likes || 0);
    const [postAuthor, setPostAuthor] = useState<{
        full_name: string;
        avatar_url?: string | null;
    } | null>(null);
    const [isCopied, setIsCopied] = useState(false);

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
                const userRes = await fetch(
                    `${API_URL}/users/${postData.user_id}`
                );
                if (userRes.ok) {
                    const userData = await userRes.json();
                    const userInfo = userData.data || userData;
                    setPostAuthor({
                        full_name: userInfo.full_name || "User",
                        avatar_url: userInfo.avatar_url || null,
                    });
                }
            } catch (err) {
                console.error(
                    `Error fetching post author ${postData.user_id}:`,
                    err
                );
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
                            const userRes = await fetch(
                                `${API_URL}/users/${reply.user_id}`
                            );
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
                            console.error(
                                `Error fetching user ${reply.user_id}:`,
                                err
                            );
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

    const handleDeleteReply = async (replyId: string) => {
        if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
        try {
            const result = await forumService.deleteReply(replyId);
            if (result.status === 200 || result.status === "OK") {
                setReplies((prev) => prev.filter((r) => r.id !== replyId));
            } else {
                
                alert("Lỗi từ server: " + result.message);
            }
        } catch (error) {
            alert("Lỗi khi xóa bình luận");
        }
    };

    const handleUpdateReply = async (replyId: string) => {
        if (!editReplyText.trim()) return;
        setIsUpdatingReply(true);
        try {
            await forumService.updateReply(replyId, editReplyText);
            setReplies((prev) =>
                prev.map((r) =>
                    r.id === replyId ? { ...r, content: editReplyText } : r
                )
            );
            setEditingReplyId(null);
        } catch (error) {
            alert("Lỗi khi cập nhật bình luận.");
        } finally {
            setIsUpdatingReply(false);
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
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000
        );

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
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

    const categoryName =
        (postData.tags || "").split(",")[0]?.trim() || "General";
    const categoryColor = getCategoryColor(categoryName);

    return (
        <div className={`min-h-screen bg-background pt-8 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
            <div className="max-w-5xl mx-auto min-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className={`flex items-center ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} mb-6 transition-all duration-200 font-semibold group`}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
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
                <div className={`${COLORS.BACKGROUND.CARD} rounded-2xl shadow-xl ${COLORS.BORDER.DEFAULT} overflow-hidden mb-6 transition-all duration-300`}>
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
                                    onChange={(e) =>
                                        setEditTitle(e.target.value)
                                    }
                                    className={`text-3xl sm:text-4xl font-bold w-full p-4 border-2 ${COLORS.BORDER.DEFAULT} rounded-xl mb-4 outline-none focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.MUTED}`}
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
                        <div className={`flex flex-wrap items-center gap-4 text-sm mb-6 pb-6 border-b ${COLORS.BORDER.LIGHT} transition-colors duration-200`}>
                            <div className={`flex items-center gap-2 ${COLORS.BACKGROUND.MUTED} px-4 py-2 rounded-lg transition-colors duration-200`}>
                                <div className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 ${COLORS.BACKGROUND.CARD} shadow-md transition-colors duration-200`}>
                                    {postAuthor?.avatar_url ||
                                    postData.profiles?.avatar_url ? (
                                        <img
                                            src={
                                                postAuthor?.avatar_url ||
                                                postData.profiles?.avatar_url
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
                                    <div className={`font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                                        {postAuthor?.full_name ||
                                            postData.profiles?.full_name ||
                                            "User"}
                                    </div>
                                    <div className={`text-xs ${COLORS.TEXT.MUTED} flex items-center gap-1 transition-colors duration-200`}>
                                        <Clock className="w-3 h-3 transition-colors duration-200" />
                                        {formatTimeAgo(postData.created_at)}
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 ${COLORS.BACKGROUND.MUTED} px-4 py-2 rounded-lg transition-colors duration-200`}>
                                <Calendar className={`w-4 h-4 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
                                <span className={`${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                                    {formatDate(postData.created_at)}
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 ${COLORS.BACKGROUND.MUTED} px-4 py-2 rounded-lg transition-colors duration-200`}>
                                <Eye className={`w-4 h-4 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
                                <span className={`${COLORS.TEXT.MUTED} font-medium transition-colors duration-200`}>
                                    {postData.total_views || 0} views
                                </span>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className={`prose max-w-none ${COLORS.TEXT.MUTED} mb-8 transition-colors duration-200`}>
                            {isEditingMode ? (
                                <textarea
                                    id="edit-content"
                                    aria-label="Post content"
                                    placeholder="Enter post content..."
                                    value={editContent}
                                    onChange={(e) =>
                                        setEditContent(e.target.value)
                                    }
                                    className={`w-full p-4 border-2 ${COLORS.BORDER.DEFAULT} rounded-xl min-h-[300px] outline-none focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} resize-none ${COLORS.BACKGROUND.MUTED} transition-all duration-200`}
                                />
                            ) : (
                                <div className={`text-base sm:text-lg leading-relaxed ${COLORS.TEXT.DEFAULT}`}>
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
                        {(postData.tags || "")
                            .split(",")
                            .filter((t) => t.trim()).length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {(postData.tags || "")
                                    .split(",")
                                    .slice(1)
                                    .map(
                                        (tag, idx) =>
                                            tag.trim() && (
                                                <span
                                                    key={idx}
                                                    className={`px-3 py-1.5 ${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} rounded-full text-xs font-semibold ${COLORS.BORDER.DEFAULT} hover:${COLORS.BACKGROUND.MUTED_HOVER} transition-all`}
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
                                    className={`${COLORS.BACKGROUND.MUTED} ${COLORS.BACKGROUND.MUTED_HOVER} ${COLORS.TEXT.DEFAULT} px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold`}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Actions Bar */}
                        <div className={`flex items-center gap-4 py-6 border-t border-b ${COLORS.BORDER.DEFAULT} mb-8 ${COLORS.BACKGROUND.MUTED} rounded-xl px-6`}>
                            <button
                                onClick={handleToggleLike}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold transform hover:scale-105 ${
                                    isLiked
                                        ? "text-red-600 bg-red-50 hover:bg-red-100 shadow-md"
                                        : `${COLORS.TEXT.MUTED} ${COLORS.BACKGROUND.CARD} shadow-sm`
                                }`}
                            >
                                <Heart
                                    className={`w-5 h-5 ${
                                        isLiked ? "fill-current" : ""
                                    }`}
                                />
                                <span className="font-bold text-lg">
                                    {likesCount || 0}
                                </span>
                                <span className="text-sm">Likes</span>
                            </button>
                            <div className={`flex items-center gap-2 ${COLORS.TEXT.MUTED} px-6 py-3 rounded-xl ${COLORS.BACKGROUND.CARD} shadow-sm`}>
                                <MessageCircle className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-lg">
                                    {replies.length ||
                                        postData.reply_count ||
                                        0}
                                </span>
                                <span className="text-sm">
                                    {replies.length === 1
                                        ? "Comment"
                                        : "Comments"}
                                </span>
                            </div>
                            <button
                                onClick={handleShare}
                                className={`flex items-center gap-2 ${COLORS.TEXT.MUTED} px-6 py-3 rounded-xl ${COLORS.BACKGROUND.CARD} shadow-sm hover:${COLORS.BACKGROUND.MUTED_HOVER} transition-all duration-200 cursor-pointer transform hover:scale-105`}
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm font-semibold">
                                    {isCopied ? "Copied!" : "Share"}
                                </span>
                            </button>
                        </div>

                        {/* Comments Section */}
                        <div className={`border ${COLORS.BORDER.DEFAULT} rounded-2xl p-6 sm:p-8 ${COLORS.BACKGROUND.CARD} shadow-lg`}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} flex items-center`}>
                                    <MessageCircle className="w-6 h-6 mr-3 text-blue-600" />
                                    Comments
                                    <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                        {replies.length ||
                                            postData.reply_count ||
                                            0}
                                    </span>
                                </h3>
                            </div>

                            {/* Comment Input Box */}
                            <div className="mb-8">
                                <div className={`border-2 ${COLORS.BORDER.DEFAULT} rounded-2xl ${COLORS.BACKGROUND.CARD} p-5 focus-within:ring-2 focus-within:ring-accent focus-within:${COLORS.BORDER.PRIMARY} transition-all shadow-sm`}>
                                    <div className="flex gap-3 mb-3">
                                        {user?.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.full_name || "You"}
                                                className={`w-10 h-10 rounded-full object-cover border-2 ${COLORS.BORDER.DEFAULT}`}
                                            />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full ${GRADIENTS.PRIMARY} flex items-center justify-center border-2 ${COLORS.BORDER.DEFAULT}`}>
                                                <UserIcon className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className={`text-sm font-semibold ${COLORS.TEXT.DEFAULT} mb-1`}>
                                                {user?.full_name || "Guest"}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) =>
                                            setReplyText(e.target.value)
                                        }
                                        placeholder={
                                            user
                                                ? "Share your thoughts..."
                                                : "Please login to comment"
                                        }
                                        className={`w-full bg-transparent border-none focus:outline-none resize-none min-h-[120px] ${COLORS.TEXT.DEFAULT} ${COLORS.TEXT.MUTED} placeholder:${COLORS.TEXT.MUTED} text-base`}
                                        maxLength={2000}
                                        disabled={!user}
                                    />
                                    <div className={`flex justify-between items-center mt-4 pt-4 border-t ${COLORS.BORDER.DEFAULT}`}>
                                        <span className={`text-xs ${COLORS.TEXT.MUTED}`}>
                                            {replyText.length}/2000 characters
                                        </span>
                                        <button
                                            onClick={handleSendReply}
                                            disabled={
                                                !replyText.trim() || !user
                                            }
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
                                <div className={`${COLORS.BACKGROUND.MUTED} rounded-2xl p-16 text-center border-2 border-dashed ${COLORS.BORDER.DEFAULT}`}>
                                    <MessageCircle className={`w-16 h-16 ${COLORS.TEXT.MUTED} mx-auto mb-4`} />
                                    <h4 className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} mb-2`}>
                                        No comments yet
                                    </h4>
                                    <p className={`${COLORS.TEXT.MUTED} font-medium`}>
                                        Be the first to share your thoughts!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {replies.map((reply) => {
                                        const isMyReply =
                                            user?.id === reply.user_id ||
                                            String(user?.id) ===
                                                String(reply.user_id);
                                        const isEditingThis =
                                            editingReplyId === reply.id;

                                        return (
                                            <div
                                                key={reply.id}
                                                className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300"
                                            >
                                                {/* Avatar */}
                                                <div className="shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md">
                                                        {reply.profiles
                                                            ?.avatar_url ? (
                                                            <img
                                                                src={
                                                                    reply
                                                                        .profiles
                                                                        .avatar_url
                                                                }
                                                                alt={
                                                                    reply
                                                                        .profiles
                                                                        .full_name
                                                                }
                                                                className="w-full h-full rounded-full object-cover border-2 border-white"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full flex items-center justify-center bg-indigo-500 text-white border-2 border-white">
                                                                <UserIcon className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Comment Content */}
                                                <div className="flex-1 space-y-2">
                                                    <div
                                                        className={`relative p-4 rounded-2xl shadow-sm border transition-all duration-200 ${
                                                            isMyReply
                                                                ? `${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.PRIMARY} hover:${COLORS.BORDER.PRIMARY}`
                                                                : `${COLORS.BACKGROUND.MUTED} ${COLORS.BORDER.DEFAULT}`
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold ${COLORS.TEXT.DEFAULT} text-sm`}>
                                                                    {reply
                                                                        .profiles
                                                                        ?.full_name ||
                                                                        "User"}
                                                                </span>
                                                                {isMyReply && (
                                                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                        You
                                                                    </span>
                                                                )}
                                                                <span className={`text-xs ${COLORS.TEXT.MUTED} font-medium flex items-center gap-1`}>
                                                                    <span className="text-[8px]">
                                                                        ●
                                                                    </span>
                                                                    {formatTimeAgo(
                                                                        reply.created_at
                                                                    )}
                                                                </span>
                                                            </div>

                                                            {isMyReply &&
                                                                !isEditingThis && (
                                                                    <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingReplyId(
                                                                                    reply.id
                                                                                );
                                                                                setEditReplyText(
                                                                                    reply.content
                                                                                );
                                                                            }}
                                                                            className={`p-1.5 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.PRIMARY} hover:${COLORS.PRIMARY.LIGHT} rounded-lg transition-all`}
                                                                            title="Edit comment"
                                                                        >
                                                                            <Edit3 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteReply(
                                                                                    reply.id
                                                                                )
                                                                            }
                                                                            className={`p-1.5 ${COLORS.TEXT.MUTED} hover:${COLORS.DESTRUCTIVE.TEXT} hover:${COLORS.DESTRUCTIVE.BACKGROUND_HOVER} rounded-lg transition-all`}
                                                                            title="Delete comment"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                        </div>

                                                        {isEditingThis ? (
                                                            <div className="mt-2 space-y-3">
                                                                <textarea
                                                                    autoFocus
                                                                    value={
                                                                        editReplyText
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditReplyText(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className={`w-full p-3 border-2 ${COLORS.BORDER.PRIMARY} rounded-xl focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} outline-none ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} text-sm min-h-[100px] resize-none`}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            setEditingReplyId(
                                                                                null
                                                                            )
                                                                        }
                                                                        className={`px-4 py-1.5 text-xs font-bold ${COLORS.TEXT.MUTED} hover:${COLORS.BACKGROUND.MUTED_HOVER} rounded-lg transition-colors`}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleUpdateReply(
                                                                                reply.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isUpdatingReply ||
                                                                            !editReplyText.trim()
                                                                        }
                                                                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
                                                                    >
                                                                        {isUpdatingReply
                                                                            ? "Saving..."
                                                                            : "Save Changes"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className={`${COLORS.TEXT.DEFAULT} leading-relaxed text-sm whitespace-pre-wrap`}>
                                                                {reply.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
