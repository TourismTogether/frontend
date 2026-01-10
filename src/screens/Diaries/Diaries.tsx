"use client";

import { useAuth } from "@/contexts/AuthContext";
import { forumService } from "@/services/forumService";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Share2,
  Eye,
  EyeOff,
} from "lucide-react";
import { API_ENDPOINTS, getTravelImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading, { SkeletonGrid } from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";

interface IDiary {
  id: string | number;
  user_id: string | number;
  title: string;
  description: string;
  main_image_url?: string | null;
  images?: Array<{ url: string; caption?: string }> | null;
  is_public: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  trip_id?: string | number;
}

interface DiaryApiResponse {
  data?: IDiary[];
  status?: number;
  message?: string;
}

type FilterType = "explore" | "my-entries" | "drafts";

export default function Diaries() {
  const [diaries, setDiaries] = useState<IDiary[]>([]);
  const [allDiaries, setAllDiaries] = useState<IDiary[]>([]);
  const [filter, setFilter] = useState<FilterType>("explore");
  const [searchTitle, setSearchTitle] = useState<string>("");
  const { user } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDiary, setShareDiary] = useState<IDiary | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getDiaries();
  }, []);

  useEffect(() => {
    if (!allDiaries) return;
    let filterList: IDiary[] = allDiaries;

    if (filter === "my-entries") {
      filterList = allDiaries.filter((diary) => {
        return String(diary.user_id) === String(user?.id);
      });
    } else if (filter === "drafts") {
      filterList = allDiaries.filter((diary) => {
        return (
          diary.is_draft === true && String(diary.user_id) === String(user?.id)
        );
      });
    } else if (filter === "explore") {
      filterList = allDiaries.filter((diary) => {
        return (
          String(diary.user_id) !== String(user?.id) && diary.is_public === true
        );
      });
    }

    if (searchTitle.trim() !== "") {
      filterList = filterList.filter((diary) => {
        return diary.title.toLowerCase().includes(searchTitle.toLowerCase());
      });
    }

    setDiaries(filterList);
  }, [filter, allDiaries, user, searchTitle]);

  async function getDiaries() {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.DIARIES.BASE, {
        credentials: "include",
      });
      const result: DiaryApiResponse = await res.json();
      const diariesData = result.data || [];
      setAllDiaries(diariesData);
      setDiaries(diariesData);
    } catch (error) {
      console.error("Error fetching diaries:", error);
      setAllDiaries([]);
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string | number) {
    const ok = window.confirm("Are you sure you want to delete this diary?");
    if (!ok) return;

    try {
      const res = await fetch(API_ENDPOINTS.DIARIES.DELETE(Number(id)), {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setAllDiaries((prev) => prev.filter((d) => String(d.id) !== String(id)));
      setDiaries((prev) => prev.filter((d) => String(d.id) !== String(id)));
    } catch (error) {
      console.error("Delete diary error", error);
      alert("Failed to delete diary");
    }
  }

  function openShareModal(diary: IDiary) {
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
    if (!shareDiary) return;

    const post = {
      user_id: String(shareDiary.user_id),
      title: shareDiary.title,
      content: shareDiary.description,
      image:
        shareDiary.main_image_url || shareDiary.images?.[0]?.url || undefined,
      tags: "Diary",
      total_likes: 0,
      total_views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const result = await forumService.create(post);
      if (result) {
        alert("Đăng bài thành công!");
        router.push("/forum");
      }
    } catch (error) {
      console.error("Error sharing diary:", error);
      alert("Failed to share diary");
    }
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} transition-colors duration-300`}
      >
        {/* Hero Section Skeleton */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <div
            className={`absolute inset-0 ${COLORS.BACKGROUND.MUTED} animate-pulse`}
          >
            <div
              className={`absolute inset-0 ${GRADIENTS.PRIMARY_DARK} opacity-80`}
            ></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
            <div
              className={`h-12 ${COLORS.BACKGROUND.CARD}/30 rounded-lg w-64 mb-4 animate-pulse`}
            ></div>
            <div
              className={`h-6 ${COLORS.BACKGROUND.CARD}/30 rounded-lg w-96 animate-pulse`}
            ></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 -mt-8 relative z-20">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div
                className={`h-8 ${COLORS.BACKGROUND.MUTED} rounded-lg w-64 mb-2 animate-pulse`}
              ></div>
              <div
                className={`h-4 ${COLORS.BACKGROUND.MUTED} rounded w-96 animate-pulse`}
              ></div>
            </div>
            <div
              className={`h-12 ${COLORS.BACKGROUND.MUTED} rounded-xl w-32 animate-pulse`}
            ></div>
          </div>

          {/* Filter Skeleton */}
          <div
            className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-6 mb-8 animate-pulse`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2">
                <div
                  className={`h-10 ${COLORS.BACKGROUND.MUTED} rounded-lg w-24`}
                ></div>
                <div
                  className={`h-10 ${COLORS.BACKGROUND.MUTED} rounded-lg w-28`}
                ></div>
                <div
                  className={`h-10 ${COLORS.BACKGROUND.MUTED} rounded-lg w-20`}
                ></div>
              </div>
              <div
                className={`h-10 ${COLORS.BACKGROUND.MUTED} rounded-lg w-64`}
              ></div>
            </div>
          </div>

          {/* Diaries Grid Skeleton */}
          <SkeletonGrid count={6} columns={3} />

          {/* Loading indicator */}
          <div className="flex flex-col items-center justify-center py-12 mt-8">
            <Loading type="diaries" fullScreen={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
        {/* Hero Section */}
        <Hero
          title="Travel Diary 📔"
          description="Capture and share your adventure memories"
          imageKeyword="travel diary journal"
        />

        <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
                Your Travel Stories
              </h2>
              <p className={`${COLORS.TEXT.MUTED} mt-1`}>
                Document your journeys and share with the community
              </p>
            </div>
            <Link
              href="/diaries/create"
              className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <Plus className="w-5 h-5" />
              <span>New Entry</span>
            </Link>
          </div>

          {/* Filter */}
          <div
            className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-6 mb-8`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === "explore"
                      ? `${GRADIENTS.PRIMARY} text-white shadow-md`
                      : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} ${COLORS.BORDER.DEFAULT} border hover:${COLORS.BORDER.PRIMARY}`
                  }`}
                  onClick={() => setFilter("explore")}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Explore
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === "my-entries"
                      ? `${GRADIENTS.PRIMARY} text-white shadow-md`
                      : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} ${COLORS.BORDER.DEFAULT} border hover:${COLORS.BORDER.PRIMARY}`
                  }`}
                  onClick={() => setFilter("my-entries")}
                >
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  My entries
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === "drafts"
                      ? `${GRADIENTS.PRIMARY} text-white shadow-md`
                      : `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} ${COLORS.BORDER.DEFAULT} border hover:${COLORS.BORDER.PRIMARY}`
                  }`}
                  onClick={() => setFilter("drafts")}
                >
                  <EyeOff className="w-4 h-4 inline mr-1" />
                  Drafts
                </button>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${COLORS.TEXT.MUTED} w-4 h-4`}
                  />
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {diaries.length > 0 ? (
              diaries.map((diary) => {
                const imageUrl =
                  diary.main_image_url ||
                  (diary.images &&
                  Array.isArray(diary.images) &&
                  diary.images.length > 0
                    ? typeof diary.images[0] === "string"
                      ? diary.images[0]
                      : diary.images[0].url
                    : null) ||
                  getTravelImageUrl(diary.title, 400, 300);

                return (
                  <div
                    key={diary.id}
                    className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer group`}
                  >
                    <Link href={`/diaries/${diary.id}`} className="block">
                      <div className="h-48 relative overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={diary.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        {diary.is_public && (
                          <span
                            className={`absolute top-3 right-3 ${COLORS.PRIMARY.DEFAULT} px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm`}
                          >
                            Public
                          </span>
                        )}
                        {diary.is_draft && (
                          <span className="absolute top-3 right-3 bg-gray-600 px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                            Draft
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3
                            className={`font-bold text-lg ${COLORS.TEXT.DEFAULT} mb-1 line-clamp-1`}
                          >
                            {diary.title}
                          </h3>
                          <p className={`text-xs ${COLORS.TEXT.MUTED} mt-1`}>
                            {new Date(diary.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openShareModal(diary);
                            }}
                            className={`text-sm px-3 py-1 ${COLORS.BORDER.DEFAULT} border rounded-md ${COLORS.TEXT.PRIMARY} hover:${COLORS.BACKGROUND.MUTED} transition-colors`}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {String(diary.user_id) === String(user?.id) && (
                            <>
                              <Link
                                href={`/diaries/${diary.id}/edit`}
                                className={`text-sm px-3 py-1 ${COLORS.BORDER.DEFAULT} border rounded-md ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} transition-colors`}
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(diary.id);
                                }}
                                className={`text-sm px-3 py-1 ${COLORS.BORDER.DEFAULT} border rounded-md text-red-600 hover:bg-red-50 transition-colors`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <p
                        className={`text-sm ${COLORS.TEXT.MUTED} mt-2 line-clamp-2`}
                      >
                        {diary.description}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div
                  className={`text-center py-16 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-2 border-dashed rounded-xl shadow-lg`}
                >
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                    <Image
                      src={getTravelImageUrl("no diary entries", 200, 200)}
                      alt="No diaries"
                      fill
                      className="object-cover opacity-50"
                      unoptimized
                    />
                  </div>
                  <BookOpen
                    className={`w-20 h-20 ${COLORS.TEXT.MUTED} mx-auto mb-4`}
                  />
                  <h3
                    className={`text-xl font-medium ${COLORS.TEXT.DEFAULT} mb-2`}
                  >
                    No diaries found
                  </h3>
                  <p className={COLORS.TEXT.MUTED}>
                    {filter === "my-entries"
                      ? "You haven't created any diary entries yet."
                      : filter === "drafts"
                      ? "You don't have any drafts."
                      : "No public diaries available."}
                  </p>
                  {filter === "my-entries" && (
                    <Link
                      href="/diaries/create"
                      className={`inline-flex items-center gap-2 mt-4 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold`}
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Your First Diary</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {shareModalOpen && shareDiary && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={closeShareModal}
                ></div>
                <div
                  className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl p-6 z-10 max-w-sm w-full shadow-2xl`}
                >
                  <h2
                    className={`text-lg font-semibold mb-2 ${COLORS.TEXT.DEFAULT}`}
                  >
                    Share "{shareDiary.title}"
                  </h2>
                  <p className={`text-sm ${COLORS.TEXT.MUTED} mb-4`}>
                    Share this diary entry to post on the forum.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShareDiary}
                      className={`flex-1 px-4 py-2 ${GRADIENTS.PRIMARY} text-white rounded-lg text-sm font-medium transition-all hover:opacity-90`}
                    >
                      Yes, Share
                    </button>
                    <button
                      onClick={closeShareModal}
                      className={`px-4 py-2 ${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} ${COLORS.BORDER.DEFAULT} border rounded-lg text-sm font-medium transition-all hover:${COLORS.BACKGROUND.SECONDARY}`}
                    >
                      Cancel
                    </button>
                  </div>
                  {copied && (
                    <p className={`text-sm ${COLORS.TEXT.PRIMARY} mt-3`}>
                      Link copied to clipboard.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
