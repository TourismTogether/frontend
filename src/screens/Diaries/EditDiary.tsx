"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { uploadFile } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Response } from "@/types/response";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EditDiary({ diaryId }: { diaryId?: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const params = useParams();
    const id = diaryId || (Array.isArray(params?.diaryId) ? params?.diaryId[0] : params?.diaryId);

    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState<any | null>(null);
    const [mainImage, setMainImage] = useState<any | null>(null);
    const [existingMainImage, setExistingMainImage] = useState<string | null>(null);
    const [previewImages, setPreviewImages] = useState<any[] | null>(null);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [shortDes, setShortDes] = useState("");
    const [tripId, setTripId] = useState<any | null>(null);
    const [metaItems, setMetaItems] = useState<any | null>(null);
    const [contentSections, setContentSections] = useState<any | null>(null);
    const [is_public, setPublic] = useState(false);
    const [errors, setErrors] = useState<any | null>({});

    useEffect(() => {
        async function load() {
            try {
                getTrips();
                if (!id) return;
                const res = await fetch(`${API}/diaries/${id}`);
                const json = await res.json();

                const d = json.data;
                setTitle(d.title || "");
                setShortDes(d.description || "");
                setExistingMainImage(d.main_image_url || null);
                setExistingImages(d.image_urls || []);
                setPublic(Boolean(d.is_public));
                setTripId(d.trip_id || null);
                setMetaItems(d.metadata || null);
                setContentSections(d.content_sections || null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [diaryId]);

    async function getTrips() {
        let res = await fetch(`${API}/trips`);

        if (!res.ok) {
            throw new Error("Failed to get");
        }

        const response: Response = await res.json();

        if (response.status == 200) {
            setTrips(response.data);
        }
    }

    function handleMainImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setMainImage({
            file,
            url: URL.createObjectURL(file)
        })
    }

    function handleRemoveMainImage() {
        setMainImage(null);
    }

    function handleAddMetaItem() {
        const newId = (metaItems == null ? 1 : metaItems.length + 1).toString();
        if (metaItems == null) {
            setMetaItems([{ id: newId, title: "New Item", content: "Content" }]);
            return;
        }
        setMetaItems((prev: any) => [
            ...prev,
            { id: newId, title: "New Item", content: "Content" },
        ]);
    }

    function handleUpdateMeta(id: number, key: string, value: string) {
        setMetaItems((prev: any[]) =>
            prev.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    }

    function handleRemoveMetaItem(id: number) {
        setMetaItems((prev: any[]) => prev.filter(item => item.id !== id));
    }

    function handleAddContentSection() {
        const newId = (contentSections == null ? 1 : contentSections.length + 1).toString();
        if (contentSections == null) {
            setContentSections([{ id: newId, title: "New section", content: "Description about this section..." }]);
            return;
        }
        setContentSections((prev: any) => [
            ...prev,
            { id: newId, title: "New section", content: "Description about this section..." },
        ]);
    }

    function handleUpdateContentSection(id: number, key: string, value: string) {
        setContentSections((prev: any[]) =>
            prev.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    }

    function handleRemoveContentSection(id: number) {
        setContentSections((prev: any[]) => prev.filter(item => item.id !== id));
    }

    function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        const selectedImages: any[] = [];

        Array.from(files).forEach((file) => {
            selectedImages.push({
                file,
                url: URL.createObjectURL(file)
            });
        });

        setPreviewImages(selectedImages);
    }

    function removeImage(index: number) {
        setPreviewImages((prev) => {
            if (!prev) return null;
            URL.revokeObjectURL(prev[index].url);
            return prev?.filter((_, i) => i !== index);
        });
    }

    function removeExistingImage(idx: number) {
        setExistingImages((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleUploadDiary() {
        let imageUrls: string[] | null = null;
        if (previewImages && previewImages.length > 0) {
            imageUrls = await Promise.all(
                previewImages.map((item, index) =>
                    uploadFile(
                        item.file,
                        `diaries/images/${Date.now()}-${index}-${item.file.name}`
                    )
                )
            );
        }

        let mainImageUrl: string | null = existingMainImage;
        if (mainImage) {
            mainImageUrl = await uploadFile(mainImage.file, `diaries/images/${Date.now()}-${mainImage.file.name}`);
        }

        const newErrors: any = {};
        if (title == "") {
            newErrors.title = "Title is required";
        }

        if (shortDes == "") {
            newErrors.shortDes = "Short description is required";
        }

        if (!tripId) {
            newErrors.tripId = "Trip is required";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const diary = {
            title: title,
            description: shortDes,
            trip_id: tripId,
            metadata: metaItems,
            content_sections: contentSections,
            image_urls: [...existingImages, ...(imageUrls || [])],
            main_image_url: mainImageUrl,
            user_id: user?.id,
            is_public: is_public
        }

        let res = await fetch(`${API}/diaries/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(diary)
        })

        const result = await res.json();

        if (result.status == 200) {
            router.push(`/diaries/${id}`);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Link href="/diaries" className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group">
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Diaries
                </Link>

                <div className="mb-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <input
                            type="text"
                            placeholder="Diary title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl md:text-4xl font-bold text-gray-900 placeholder-gray-400 bg-transparent outline-none border-none focus:ring-0"
                        />
                        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                    </div>
                </div>

                <div className="mb-12">
                    {!mainImage && !existingMainImage && (
                        <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-sm text-gray-500 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition min-h-[200px] bg-gray-50 hover:bg-blue-50">
                            <span className="text-4xl mb-3">📷</span>
                            <span className="font-medium text-base">Upload Cover Photo</span>
                            <span className="text-xs mt-2">PNG, JPG up to 10MB</span>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                onChange={handleMainImageChange}
                            />
                        </label>
                    )}

                    {(mainImage || existingMainImage) && (
                        <div className="relative rounded-xl overflow-hidden border group shadow-md">
                            <img
                                src={mainImage?.url || existingMainImage}
                                alt="Main"
                                className="w-full h-[400px] object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (mainImage) handleRemoveMainImage();
                                    else setExistingMainImage(null);
                                }}
                                className="absolute top-3 right-3 bg-white text-gray-700 text-sm w-8 h-8 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Related Trip</h2>
                    <select onChange={(e) => setTripId(e.target.value)} value={tripId || ""} id="diary-trip" name="trip_id" className="w-full px-4 py-2 border rounded-lg text-gray-500">
                        <option value="">Related Trip (Optional)</option>
                        {trips && trips.map(function (trip: any) {
                            return (
                                <option key={trip.id} value={trip.id}>{trip.title}</option>
                            )
                        })}
                    </select>
                    {errors.tripId && <p className="text-red-600 text-sm mt-1">{errors.tripId}</p>}
                </div>

                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">short description</h2>
                    <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                        <input type="text" value={shortDes} onChange={(e) => setShortDes(e.target.value)} placeholder="Short description" className="w-full text-sm md:text-base font-bold text-gray-900 placeholder-gray-400 bg-transparent outline-none border-none focus:ring-0" />
                    </div>
                    {errors.shortDes && <p className="text-red-600 text-sm mt-1">{errors.shortDes}</p>}
                </div>

                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Info Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {metaItems && metaItems.map((meta: any) => (
                            <div key={meta.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition group relative">
                                <input
                                    value={meta.title}
                                    onChange={(e) =>
                                        handleUpdateMeta(meta.id, "title", e.target.value)
                                    }
                                    placeholder="Title"
                                    className="w-full text-xs text-gray-500 bg-transparent outline-none font-medium"
                                />

                                <input
                                    value={meta.content}
                                    onChange={(e) =>
                                        handleUpdateMeta(meta.id, "content", e.target.value)
                                    }
                                    placeholder="Content"
                                    className="w-full font-semibold text-gray-800 bg-transparent outline-none mt-2"
                                />

                                {metaItems && metaItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMetaItem(meta.id)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddMetaItem}
                            className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-6 text-gray-600 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition" />
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Sections</h2>

                    <div className="grid md:grid-cols-2 gap-6">

                        {contentSections && contentSections.map((section: any) => {
                            return (
                                <div key={section.id} className="border rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition group relative">
                                    <input
                                        value={section.title}
                                        onChange={(e) =>
                                            handleUpdateContentSection(section.id, "title", e.target.value)
                                        }
                                        placeholder="Section Title"
                                        className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-400"
                                    />

                                    <textarea
                                        value={section.content}
                                        onChange={(e) =>
                                            handleUpdateContentSection(section.id, "content", e.target.value)
                                        }
                                        placeholder="Section content..."
                                        className="w-full text-sm text-gray-700 bg-transparent outline-none mt-3 placeholder-gray-400 resize-none"
                                        rows={4}
                                    />

                                    {contentSections && contentSections.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveContentSection(section.id)}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )
                        })}

                        <button onClick={handleAddContentSection} className="flex items-center justify-center border border-dashed rounded-xl p-6 text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition group">
                            <Plus className="w-6 h-6 group-hover:scale-110 transition" />
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-sm text-gray-500 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition min-h-[140px]">
                            <span className="text-2xl mb-1">📷</span>
                            <span className="font-medium">Upload Photos</span>
                            <span className="text-xs mt-1">PNG, JPG up to 10MB</span>

                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                name="images"
                                className="hidden"
                                multiple
                                onChange={handlePhotosChange}
                            />
                        </label>

                        {existingImages &&
                            existingImages.map((img, index) => (
                                <div
                                    key={index}
                                    className="relative group border rounded-xl overflow-hidden"
                                >
                                    <img
                                        src={img}
                                        alt={`existing-${index}`}
                                        className="h-36 w-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute top-2 right-2 bg-white text-gray-700 text-sm w-8 h-8 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                        {previewImages &&
                            previewImages.map((img, index) => (
                                <div
                                    key={`preview-${index}`}
                                    className="relative group border rounded-xl overflow-hidden"
                                >
                                    <img
                                        src={img.url}
                                        alt={`preview-${index}`}
                                        className="h-36 w-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-white text-gray-700 text-sm w-8 h-8 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="mb-12">
                    <div className="flex justify-between items-center">
                        <span>Make this entry public</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" onChange={(e) => setPublic(e.target.checked)} checked={is_public} name="is_public" id="diary-public" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 transition-all duration-200" />
                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full shadow transform peer-checked:translate-x-5 transition-all duration-200" />
                        </label>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="">
                        <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">Save as Draft</button>
                        <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">Preview</button>
                    </div>
                    <button onClick={handleUploadDiary} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-green-700 hover:shadow-md active:scale-95 transition-all">
                        Update Entry
                    </button>
                </div>

            </div>
        </>
    )
}
