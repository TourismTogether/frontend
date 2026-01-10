// app/forum/[id]/page.tsx
"use client";

import { Navbar } from "@/components/Layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import PostDetail from "@/screens/Forum/PostDetail";
import { forumService } from "@/services/forumService";
import { IPost } from "@/types/forum";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { COLORS } from "@/constants/colors";

export default function PostDetailPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params?.id as string;
    const [post, setPost] = useState<IPost | null>(null);
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
            return;
        }
        const fetchPost = async () => {
            if (!postId || postId === "undefined") return;
            try {
                const postData = await forumService.getById(postId);
                setPost(postData);
            } catch (error) {
                console.error("Lỗi khi tải bài viết:", error);
                setPost(null);
            }
        };

        if (!loading && user) {
            fetchPost();
        }
    }, [user, loading, router, postId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destination"></div>
            </div>
        );
    }
    if (!user) {
        return null;
    }

    if (!post) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${COLORS.BACKGROUND.DEFAULT}`}>
                <div className="text-center">
                    <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
                        Không tìm thấy bài viết
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
            <Navbar />
            <PostDetail postData={post} />
            {/* <CommentSection /> */}
        </div>
    );
}
