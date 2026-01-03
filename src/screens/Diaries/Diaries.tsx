import { useAuth } from "@/contexts/AuthContext";
import { forumService } from "@/services/forumService";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { title } from "process";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;


export default function Diaries() {
  const [diaries, setDiaries] = useState<any[] | null>(null);
  const [allDiaries, setAllDiaries] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<string>("my-entries");
  const [searchTitle, setSearchTitle] = useState<string>("");
  const { user } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDiary, setShareDiary] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(function () {
    getDiaries();
  }, []);

  useEffect(function () {
    if (!allDiaries) return;
    let filterList: any[] = allDiaries;

    if (filter === "my-entries") {
      filterList = allDiaries.filter(function (diary: any) {
        return diary.user_id === user?.id;
      });
    } else if (filter === "drafts") {
      filterList = allDiaries.filter(function (diary: any) {
        return diary.is_draft === true && diary.user_id === user?.id;
      });
    } else if (filter === "explore") {
      filterList = allDiaries.filter(function (diary: any) {
        return diary.user_id !== user?.id && diary.is_public === true;
      });
    }

    // Apply title search filter
    if (searchTitle.trim() !== "") {
      filterList = filterList.filter(function (diary: any) {
        return diary.title.toLowerCase().includes(searchTitle.toLowerCase());
      });
    }

    setDiaries(filterList);
  }, [filter, allDiaries, user, searchTitle]);

  async function getDiaries() {
    const res = await fetch(`${API}/diaries`);
    const result = await res.json();
    setAllDiaries(result.data || []);
    setDiaries(result.data || []);
  }

  async function handleDelete(id: any) {
    const ok = window.confirm('Are you sure you want to delete this diary?');
    if (!ok) return;

    try {
      const res = await fetch(`${API}/diaries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Delete failed');
      }

      // remove from local state
      setAllDiaries((prev) => prev ? prev.filter((d: any) => d.id !== id) : prev);
      setDiaries((prev) => prev ? prev.filter((d: any) => d.id !== id) : prev);
    } catch (error) {
      console.error('Delete diary error', error);
      alert('Failed to delete diary');
    }
  }

  function openShareModal(diary: any) {
    setShareDiary(diary);
    setCopied(false);
    setShareModalOpen(true);
  }

  function closeShareModal() {
    setShareModalOpen(false);
    setShareDiary(null);
    setCopied(false);
  }

  async function handleShareDiary() {

    const post = {
      user_id: shareDiary.user_id,
      title: shareDiary.title,
      content: shareDiary.description,
      tags: "Diary",
      total_likes: 0,
      total_views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const result = await forumService.create(post);
    if (result) {
      alert("Đăng bài thành công!");
      router.push("/forum");
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Travel Diary</h1>
              <p className="text-sm text-gray-500 mt-1">
                Capture and share your adventure memories
              </p>
            </div>
            <Link href="/diaries/create" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
              + New Entry
            </Link>
          </div>

          {/* Filter */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex gap-2">
              <button className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition ${filter === "my-entries"
                ? "bg-green-600 text-white border border-green-600"
                : "border text-gray-700 hover:border-green-600"
                }`} onClick={() => setFilter("my-entries")}>My entries</button>
              <button className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition ${filter === "drafts"
                ? "bg-green-600 text-white border border-green-600"
                : "border text-gray-700 hover:border-green-600"
                }`} onClick={() => setFilter("drafts")}>Drafts</button>
              <button className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition ${filter === "explore"
                ? "bg-green-600 text-white border border-green-600"
                : "border text-gray-700 hover:border-green-600"
                }`} onClick={() => setFilter("explore")}>Explore</button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CARD */}
            {diaries && diaries.map(function (diary: any) {
              return (
                <div key={diary.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
                  <Link href={`/diaries/${diary.id}`} className="block">
                    {diary.main_image_url ? (
                      <img src={diary.main_image_url} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200" />
                    )}
                  </Link>

                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        {diary.is_public && (
                          <span className="inline-block text-xs font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full mb-2">
                            Public
                          </span>
                        )}
                        <h3 className="font-bold text-lg">{diary.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Dec 15, 2025 - Dec 22, 2025
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openShareModal(diary)} className="text-sm px-3 py-1 border rounded-md text-blue-600 hover:bg-blue-50">
                          Share
                        </button>
                        {diary.user_id === user?.id && (
                          <>
                            <Link href={`/diaries/${diary.id}/edit`} className="text-sm px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-100">
                              Edit
                            </Link>
                            <button onClick={() => handleDelete(diary.id)} className="text-sm px-3 py-1 border rounded-md text-red-600 hover:bg-red-50">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {diary.description}
                    </p>
                  </div>
                </div>
              )
            })}

            {shareModalOpen && shareDiary && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black opacity-50" onClick={closeShareModal}></div>
                <div className="bg-white rounded-lg p-6 z-10 max-w-sm w-full shadow-lg">
                  <h2 className="text-lg font-semibold mb-2">Share "{shareDiary.title}"</h2>
                  <p className="text-sm text-gray-600 mb-4">Share this diary entry to post on the forum.</p>
                  <div className="flex gap-2">
                    <button onClick={handleShareDiary} className="px-4 py-2 border bg-green-600 text-white rounded text-sm cursor-pointer">Yes</button>
                    <button onClick={closeShareModal} className="px-4 py-2 border rounded text-sm cursor-pointer">Close</button>
                  </div>
                  {copied && <p className="text-sm text-green-600 mt-3">Link copied to clipboard.</p>}
                </div>
              </div>
            )}

          </div>



        </div>
      </div>
    </>
  )
}