// app/forum/new/page.tsx
"use client";

import { Navbar } from "@/components/Layout/Navbar";
import NewPost from "@/screens/Forum/NewPost";
import { COLORS } from "@/constants/colors";

export default function NewPostPage() {
    return (
        <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
            <Navbar />
            <NewPost />
        </div>
    );
}
