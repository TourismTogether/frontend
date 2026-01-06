import { IPost, IPostReply } from "@/types/forum";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const forumService = {
    getAll: () => fetch(`${API_URL}/posts`).then((res) => res.json()),

    getById: async (id: string): Promise<IPost> => {
        const res = await fetch(`${API_URL}/posts/${id}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch post: ${res.status}`);
        }
        const data = await res.json();
        return data.data || data;
    },

    create: (post: Partial<IPost>) =>
        fetch(`${API_URL}/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(post),
        }).then((res) => res.json()),

    update: (id: string, post: Partial<IPost>) =>
        fetch(`${API_URL}/posts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(post),
        }).then((res) => res.json()),

    delete: (id: string) =>
        fetch(`${API_URL}/posts/${id}`, {
            method: "DELETE",
        }).then((res) => res.ok),

    getReplies: async (postId: string): Promise<IPostReply[]> => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/post-replies`);
            if (res.ok) {
                const data = await res.json();
                return Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data)
                    ? data
                    : [];
            }
            // console.error("Failed to fetch replies:");
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
        const res = await fetch(`${API_URL}/post-replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
        const response = await fetch(`${API_URL}/post-replies/${replyId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        return response.json();
    },

    deleteReply: async (replyId: string) => {
        const response = await fetch(`${API_URL}/post-replies/${replyId}`, {
            method: "DELETE",
        });
        return response.json();
    },

    toggleLike: async (id: string, userId: string) => {
        const res = await fetch(`${API_URL}/posts/${id}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error("Không thể like");
        return res.json();
    },
};
