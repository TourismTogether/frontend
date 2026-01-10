import { IPost, IPostReply } from "@/types/forum";
import { API_ENDPOINTS } from "@/constants/api";

export const forumService = {
    getAll: () => fetch(API_ENDPOINTS.FORUM.POSTS.BASE, { credentials: "include" }).then((res) => res.json()),

    getById: async (id: string): Promise<IPost> => {
        const res = await fetch(API_ENDPOINTS.FORUM.POSTS.BY_ID(id), { credentials: "include" });
        if (!res.ok) {
            throw new Error(`Failed to fetch post: ${res.status}`);
        }
        const data = await res.json();
        return data.data || data;
    },

    create: (post: Partial<IPost>) =>
        fetch(API_ENDPOINTS.FORUM.POSTS.CREATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(post),
        }).then((res) => res.json()),

    update: (id: string, post: Partial<IPost>) =>
        fetch(API_ENDPOINTS.FORUM.POSTS.UPDATE(id), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(post),
        }).then((res) => res.json()),

    delete: (id: string) =>
        fetch(API_ENDPOINTS.FORUM.POSTS.DELETE(id), {
            method: "DELETE",
            credentials: "include",
        }).then((res) => res.ok),

    getReplies: async (postId: string): Promise<IPostReply[]> => {
        try {
            if (!postId || postId === "NaN" || postId === "undefined") {
                console.error("Invalid postId:", postId);
                return [];
            }
            const res = await fetch(`${API_ENDPOINTS.FORUM.POSTS.BY_ID(postId)}/post-replies`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                return Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data)
                    ? data
                    : [];
            }
            return [];
        } catch (error) {
            console.error("Error fetching replies:", error);
            return [];
        }
    },

    createReply: async (
        postId: string,
        content: string,
        userId: string
    ): Promise<IPostReply> => {
        const res = await fetch(API_ENDPOINTS.FORUM.REPLIES.CREATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                post_id: postId,
                user_id: userId,
                content,
            }),
        });
        if (!res.ok) {
            throw new Error("Failed to create reply");
        }
        const data = await res.json();
        return data.data || data;
    },

    updateReply: async (replyId: string, content: string) => {
        const response = await fetch(API_ENDPOINTS.FORUM.REPLIES.UPDATE(replyId), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content }),
        });
        return response.json();
    },

    deleteReply: async (replyId: string) => {
        const response = await fetch(API_ENDPOINTS.FORUM.REPLIES.DELETE(replyId), {
            method: "DELETE",
            credentials: "include",
        });
        return response.json();
    },

    toggleLike: async (id: string, userId: string) => {
        const res = await fetch(`${API_ENDPOINTS.FORUM.POSTS.BY_ID(id)}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error("Không thể like");
        return res.json();
    },
};
