export interface User {
    id: string;
    account_id: string;
    full_name: string;
    avatar_url: string;
    phone: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Account {
    id?: string;
    username: string;
    password?: string;
    email: string;
}
export interface IPost {
    id: string;
    user_id: string;
    title: string;
    content: string;
    tags: string;
    total_views: number;
    total_likes: number;
    reply_count: number;
    created_at: string;
    updated_at: string;
    last_activity_at: string;
    is_pinned: boolean;
    is_liked?: boolean;
    forum_categories: {
        name: string;
        color: string;
    };
    profiles?: User;
    image?: string | null;
}

export interface IPostReply {
    id: string;
    user_id: string;
    post_id: string;
    content: string;
    created_at: Date;
    updated_at: Date;
    profiles?: User;
}
