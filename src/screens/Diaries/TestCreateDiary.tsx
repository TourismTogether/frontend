import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Response } from "@/types/response";

const API = process.env.NEXT_PUBLIC_API_URL;

// Custom Section Type Definition
interface DiarySection {
    id: string;
    title: string;
    color: string;
    placeholder: string;
    content: string;
}

interface MetaItem {
    id: string;
    title: string;
    content: string;
}

// Default customizable sections
const DEFAULT_SECTIONS: DiarySection[] = [
    {
        id: "weather",
        title: "Weather",
        color: "blue",
        placeholder: "Describe the weather conditions...",
        content: ""
    },
    {
        id: "feeling",
        title: "Feeling",
        color: "purple",
        placeholder: "How are you feeling today?",
        content: ""
    },
    {
        id: "description",
        title: "Description",
        color: "green",
        placeholder: "Write your diary entry...",
        content: ""
    }
];

export default function TestCreateDiary() {
    const { user } = useAuth();

    const [previewImages, setPreviewImages] = useState<any[] | null>(null);

    const [mainImage, setMainImage] = useState<any | null>(null);
    const [metaItems, setMetaItems] = useState<MetaItem[]>([
        { id: "1", title: "Title", content: "Content" }
    ]);
    const [sections, setSections] = useState<DiarySection[]>(DEFAULT_SECTIONS);
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionData, setNewSectionData] = useState({
        title: "",
        color: "blue" as keyof typeof colorClasses
    });

    // Main image handlers
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
    };

    function removeImage(index: number) {
        setPreviewImages((prev) => {
            if (!prev) return null;
            URL.revokeObjectURL(prev[index].url);
            return prev?.filter((_, i) => i !== index);
        });
    };

    // Meta item handlers
    function handleAddMetaItem() {
        const newId = (metaItems.length + 1).toString();
        setMetaItems((prev) => [
            ...prev,
            { id: newId, title: "New Item", content: "Content" },
        ]);
    }

    function handleUpdateMeta(id: string, key: string, value: string) {
        setMetaItems((prev) =>
            prev.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    }

    function handleRemoveMetaItem(id: string) {
        setMetaItems((prev) => prev.filter(item => item.id !== id));
    }

    // Section handlers
    function handleUpdateSection(id: string, key: string, value: string) {
        setSections((prev) =>
            prev.map(section =>
                section.id === id ? { ...section, [key]: value } : section
            )
        );
    }

    function handleAddSection(newSection: DiarySection) {
        setSections((prev) => [...prev, newSection]);
        setShowAddSection(false);
    }

    function handleCreateNewSection() {
        if (!newSectionData.title.trim()) {
            alert("Please fill in all fields");
            return;
        }

        const newSection: DiarySection = {
            id: `section-${Date.now()}`,
            title: newSectionData.title,
            color: newSectionData.color,
            placeholder: `Write about ${newSectionData.title.toLowerCase()}...`,
            content: "",
        };

        setSections((prev) => [...prev, newSection]);
        setNewSectionData({ title: "", color: "blue" });
        setShowAddSection(false);
    }

    function handleRemoveSection(id: string) {
        setSections((prev) => prev.filter(section => section.id !== id));
    }

    const colorClasses = {
        blue: "text-blue-600 border-gray-200",
        purple: "text-purple-600 border-gray-200",
        green: "text-green-600 border-gray-200",
        red: "text-red-600 border-gray-200",
        yellow: "text-yellow-600 border-gray-200",
        pink: "text-pink-600 border-gray-200",
    };

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Link href="/diaries" className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group">
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Diaries
                </Link>

                {/* Header Section */}
                <header className="mb-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Create New Diary Entry
                        </h1>
                        <span className="px-3 py-1 text-xs font-medium rounded-full border border-blue-500 text-blue-600">
                            NEW ENTRY
                        </span>
                    </div>
                </header>

                {/* Main Image Upload Section */}
                <section className="mb-12">
                    {!mainImage && (
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

                    {mainImage && (
                        <div className="relative rounded-xl overflow-hidden border group shadow-md">
                            <img
                                src={mainImage.url}
                                alt="Main"
                                className="w-full h-[400px] object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveMainImage}
                                className="absolute top-3 right-3 bg-white text-gray-700 text-sm w-8 h-8 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </section>


                {/* Meta Items Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Info Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {metaItems.map((meta) => (
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

                                {metaItems.length > 1 && (
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
                </section>

                {/* Customizable Content Sections */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Content Sections</h2>
                        <button
                            type="button"
                            onClick={() => setShowAddSection(!showAddSection)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Section
                        </button>
                    </div>

                    {/* Add Section Form */}
                    {showAddSection && (
                        <div className="border rounded-lg p-6 mb-6 bg-blue-50 border-blue-200">
                            <h3 className="font-semibold mb-4 text-gray-900">New Section</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Section title (e.g., Activities)"
                                    value={newSectionData.title}
                                    onChange={(e) =>
                                        setNewSectionData({ ...newSectionData, title: e.target.value })
                                    }
                                    className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
                                />
                                <select
                                    value={newSectionData.color}
                                    onChange={(e) =>
                                        setNewSectionData({
                                            ...newSectionData,
                                            color: e.target.value as keyof typeof colorClasses,
                                        })
                                    }
                                    className="border rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
                                >
                                    <option value="">Select color...</option>
                                    <option value="blue">Blue</option>
                                    <option value="purple">Purple</option>
                                    <option value="green">Green</option>
                                    <option value="red">Red</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="pink">Pink</option>
                                </select>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddSection(false);
                                        setNewSectionData({ title: "", color: "blue" });
                                    }}
                                    className="flex-1 px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateNewSection}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    Create Section
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Display Sections */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                className={`border rounded-xl p-6 ${colorClasses[section.color as keyof typeof colorClasses]} group relative transition`}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="font-semibold text-lg">{section.title}</h3>
                                    {sections.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSection(section.id)}
                                            className="ml-auto opacity-0 group-hover:opacity-100 transition text-current hover:opacity-80"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    value={section.content}
                                    onChange={(e) => handleUpdateSection(section.id, "content", e.target.value)}
                                    placeholder={section.placeholder}
                                    className="w-full h-40 bg-white/50 backdrop-blur border rounded-lg p-4 outline-none focus:ring-2 focus:ring-current text-gray-700 resize-none"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Preview images */}
                    {previewImages &&
                        previewImages.map((img, index) => (
                            <div
                                key={index}
                                className="relative group border rounded-xl overflow-hidden"
                            >
                                <img
                                    src={img.url}
                                    alt={`preview-${index}`}
                                    className="h-36 w-full object-cover"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-white text-gray-700 text-xs w-7 h-7 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    {/* Upload box */}
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
                </div>
            </div>
        </>
    )
}