'use client';

import { Navbar } from "@/components/Layout/Navbar";
import EditDiary from "@/screens/Diaries/EditDiary";
import { useParams } from "next/navigation";
import { COLORS } from "@/constants/colors";


export default function Page({ params }: { params: { diaryId: string | string[] } }) {
    // const diaryId = Array.isArray(params.diaryId) ? params.diaryId[0] : params.diaryId;
    const { diaryId } = useParams<{ diaryId: string }>();

    if (!diaryId) {
        return (
            <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
                <Navbar />
                <div className="max-w-4xl mx-auto px-6 py-8">Missing diary id</div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
            <Navbar />
            <EditDiary diaryId={diaryId} />
        </div>
    );
}
