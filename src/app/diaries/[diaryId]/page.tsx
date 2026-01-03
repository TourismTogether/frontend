'use client';

import { Navbar } from "@/components/Layout/Navbar";
import PreviewDiary from "@/screens/Diaries/PreviewDiary";
import TestTemplate from "@/screens/Diaries/TestTemplate";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;


export default function Diary() {
  const { diaryId } = useParams<{ diaryId: string }>();
  const [diary, setDiary] = useState<any | null>(null);


  useEffect(function () {
    getDiary(diaryId);
  }, [])

  async function getDiary(diaryId: string) {
    const res = await fetch(`${API}/diaries/${diaryId}`)

    const result = await res.json();

    setDiary(result.data);
  }

  if (!diaryId) return null;


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/diaries" className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Forum</Link>

        <PreviewDiary diary={diary} />
      </div>
    </div>
  )
}