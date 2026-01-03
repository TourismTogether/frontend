import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/lib/supabase";
import { Response } from "@/types/response";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Key, useEffect, useState } from "react";
import PreviewDiary from "./PreviewDiary";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CreateDiary() {
  const { user } = useAuth();

  const [trips, setTrips] = useState<any | null>(null);
  const [mainImage, setMainImage] = useState<any | null>(null);
  const [metaItems, setMetaItems] = useState<any | null>(null);
  const [contentSections, setContentSections] = useState<any | null>(null);
  const [previewImages, setPreviewImages] = useState<any[] | null>(null);
  const [title, setTitle] = useState<any | null>("");
  const [shortDes, setShortDes] = useState<any | null>("");
  const [tripId, setTripId] = useState<any | null>(null);
  const [errors, setErrors] = useState<any | null>({});
  const [is_public, setPublic] = useState<any | null>(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const router = useRouter();

  useEffect(function () {
    getTrips();
  }, [])

  async function getTrips() {
    let res = await fetch(`${API}/trips`);

    if (!res.ok) {
      throw new Error("Falid to get");
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
  };

  function removeImage(index: number) {
    setPreviewImages((prev) => {
      if (!prev) return null;
      URL.revokeObjectURL(prev[index].url);
      return prev?.filter((_, i) => i !== index);
    });
  };

  async function getDataDiary() {
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

    let mainImageUrl: string | null = null;
    if (mainImage) {
      mainImageUrl = await uploadFile(mainImage.file, `diaries/images/${Date.now()}-${mainImage.file.name}`);
    }

    const newErrors: any = {};
    if (title == "") {
      newErrors.title = "Title is required";
    }

    if (shortDes == "") {
      newErrors.shortDes = "Short desctiption is required";
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
      image_urls: imageUrls,
      main_image_url: mainImageUrl,
      user_id: user?.id,
      is_public: is_public
    }

    return diary;
  }

  async function handleUploadDiariy() {
    const diary = await getDataDiary();

    let res = await fetch(`${API}/diaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(diary)
    })

    res = await res.json();

    if (res.status == 200) {
      router.push("/diaries");
    }
  }

  async function handleSaveDraftDiary() {
    const diary: any = await getDataDiary();
    diary.is_draft = true;
    diary.is_public = false;

    let res = await fetch(`${API}/diaries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(diary)
    })

    res = await res.json();

    if (res.status == 200) {
      router.push("/diaries");
    }
  }

  async function handlePreviewDiary() {
    const diary = await getDataDiary();
    if (!diary) return;

    setPreviewData(diary);
    setShowPreviewModal(true);
  }

  function closePreviewModal() {
    setShowPreviewModal(false);
    setPreviewData(null);
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
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Related Trip</h2>
          <select onChange={(e) => setTripId(e.target.value)} id="diary-trip" name="trip_id" className="w-full px-4 py-2 border rounded-lg text-gray-500">
            <option>Related Trip (Optional)</option>
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
                <div
                  key={section.id}
                  className={`border rounded-xl p-6 group relative transition`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleUpdateContentSection(section.id, "title", e.target.value)}
                      placeholder="Section title"
                      className="font-semibold text-lg text-gray-900 bg-transparent outline-none border-none focus:ring-0 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveContentSection(section.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition text-current hover:opacity-80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    value={section.content}
                    onChange={(e) => handleUpdateContentSection(section.id, "content", e.target.value)}
                    className="w-full h-40 bg-white/50 backdrop-blur border rounded-lg p-4 outline-none focus:ring-2 focus:ring-current text-gray-700 resize-none"
                  />
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

                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-white text-gray-700 text-xs w-7 h-7 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
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
              <input type="checkbox" onChange={(e) => setPublic(e.target.checked)} name="is_public" id="diary-public" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 transition-all duration-200" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full shadow transform peer-checked:translate-x-5 transition-all duration-200" />
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={handleSaveDraftDiary} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">Save as Draft</button>
            <button onClick={handlePreviewDiary} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">Preview</button>
          </div>
          <button onClick={handleUploadDiariy} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-green-700 hover:shadow-md active:scale-95 transition-all">
            Publish Entry
          </button>
        </div>

        {showPreviewModal && previewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={closePreviewModal}
                className="sticky top-0 right-0 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition absolute top-4 right-4 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-8">
                <PreviewDiary diary={previewData} />
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}









// import Link from "next/link";
// import { useEffect, useState } from "react";

// import { Response } from "@/types/response";

// import { uploadFile } from "@/lib/supabase";
// import { useAuth } from "@/contexts/AuthContext";

// const API = process.env.NEXT_PUBLIC_API_URL;


// export default function CreateDiary() {
//   const { user } = useAuth();
//   const [previewImages, setPreviewImages] = useState<any[] | null>(null);
//   const [previewVideo, setPreviewVideo] = useState<any | null>(null);

//   const [trips, setTrips] = useState<any | null>(null);
//   const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

//   useEffect(function () {
//     getTrips();
//   }, [])

//   async function getTrips() {
//     let res = await fetch(`${API}/trips`);

//     if (!res.ok) {
//       throw new Error("Falid to get");
//     }

//     const response: Response = await res.json();

//     if (response.status == 200) {
//       setTrips(response.data);
//     }
//   }

//   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     // Basic client-side validation (inline)
//     const form = event.currentTarget;
//     const formData = new FormData(form);
//     const data = Object.fromEntries(formData.entries());
//     const newErrors: { title?: string; description?: string } = {};
//     if (!data.title || (data.title as string).trim().length === 0) {
//       newErrors.title = 'Title is required';
//     }
//     if (!data.description || (data.description as string).trim().length < 10) {
//       newErrors.description = 'Description must be at least 10 characters';
//     }
//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }
//     setErrors({});

//     try {
//       // const form and data already created above

//       let imageUrls: string[] | null = null;

//       if (previewImages && previewImages.length > 0) {
//         imageUrls = await Promise.all(
//           previewImages.map((item, index) =>
//             uploadFile(
//               item.file,
//               `diaries/images/${Date.now()}-${index}-${item.file.name}`
//             )
//           )
//         );
//       }

//       let videoUrl: string | null = null;

//       if (previewVideo) {
//         videoUrl = await uploadFile(
//           previewVideo.file,
//           `diaries/videos/${Date.now()}-${previewVideo.file.name}`
//         );
//       }

//       const diaryPayload = {
//         user_id: user?.id,
//         trip_id: data.trip_id || null,
//         title: data.title as string,
//         description: data.description as string,
//         is_public: data.is_public === "on",
//         img_url: imageUrls,
//         video_url: videoUrl,
//         allow_comment: data.is_public === "on",
//         tags: data.tags as string,
//         template: data.template as string,
//         feeling_des: data.feeling_des as string,
//         weather_des: data.weather_des as string,
//       };

//       const res = await fetch(`${API}/diaries`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         credentials: "include",
//         body: JSON.stringify(diaryPayload)
//       })

//       const result = await res.json();

//       form.reset();
//     } catch (error) {
//       console.error("Create diary failed:", error);
//     }
//   }

//   function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files) return;

//     const selectedImages: any[] = [];

//     Array.from(files).forEach((file) => {
//       selectedImages.push({
//         file,
//         url: URL.createObjectURL(file)
//       });
//     });

//     setPreviewImages(selectedImages);
//   };

//   function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setPreviewVideo({
//       file,
//       url: URL.createObjectURL(file)
//     })
//   }

//   function removeImage(index: number) {
//     setPreviewImages((prev) => {
//       if (!prev) return null;
//       URL.revokeObjectURL(prev[index].url);
//       return prev?.filter((_, i) => i !== index);
//     });
//   };

//   function removeVideo() {
//     setPreviewVideo(null);
//   }

//   return (
//     <>
//       <div className="max-w-4xl mx-auto px-6 py-8">

//         <div className="flex items-start justify-between mb-8">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Create Journal Entry
//             </h1>
//             <p className="text-sm text-gray-500 mt-1">
//               Capture your travel memories and experiences
//             </p>
//           </div>

//           <Link
//             href="/diaries"
//             className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
//           >
//             ← Back
//           </Link>
//         </div>

//         <form onSubmit={handleSubmit} encType="multipart/form-data">

//           {/* Select template */}
//           <div className="bg-white border rounded-xl p-6 mb-6">
//             <h2 className="font-semibold mb-1">Choose a Journal Template</h2>
//             <p className="text-sm text-gray-500 mb-4">
//               Start with a template to help you write faster
//             </p>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//               <label className="text-left border rounded-xl p-4 hover:border-green-500 hover:bg-green-50 transition">
//                 <input
//                   defaultChecked
//                   type="radio"
//                   value="classic"
//                   name="template"
//                   className="mt-1 accent-green-600"
//                 />

//                 <h3 className="mt-2 font-semibold text-gray-900 flex items-center gap-2">
//                   ✈️ Classic Diary
//                 </h3>

//                 <p className="text-sm text-gray-600 mt-1">
//                   Nhật ký truyền thống theo dòng thời gian
//                 </p>

//                 <div className="mt-4 text-xs text-gray-500 space-y-1">
//                   <p>📍 Địa điểm & mốc thời gian</p>
//                   <p>📖 Câu chuyện & trải nghiệm</p>
//                   <p>❤️ Cảm xúc tổng kết</p>
//                 </div>
//               </label>

//               {/* Daily Reflection */}
//               <label className="text-left border rounded-xl p-4 hover:border-green-500 hover:bg-green-50 transition">
//                 <input type="radio" value="modern" name="template" className="mt-1 accent-green-600" />
//                 <h3 className="mt-2 font-semibold text-gray-900 flex items-center gap-2">
//                   🌤 Modern Reflection
//                 </h3>

//                 <p className="text-sm text-gray-600 mt-1">
//                   Nhật ký cảm xúc & suy nghĩ mỗi ngày
//                 </p>

//                 <div className="mt-4 text-xs text-gray-500 space-y-1">
//                   <p>😊 Cảm xúc hôm nay</p>
//                   <p>🙏 Điều biết ơn</p>
//                   <p>🎯 Mục tiêu tiếp theo</p>
//                 </div>
//               </label>

//               {/* Photo Story */}
//               <label className="text-left border rounded-xl p-4 hover:border-green-500 hover:bg-green-50 transition">
//                 <input type="radio" value="tech" name="template" className="mt-1 accent-green-600" />
//                 <h3 className="mt-2 font-semibold text-gray-900 flex items-center gap-2">
//                   ⚡ Tech Log
//                 </h3>

//                 <p className="text-sm text-gray-600 mt-1">
//                   Ghi chép theo dạng module & dữ liệu
//                 </p>

//                 <div className="mt-4 text-xs text-gray-500 space-y-1">
//                   <p>🧩 Section & block nội dung</p>
//                   <p>🖼 Media / snapshot</p>
//                   <p>⚙️ Tag · mood · metadata</p>
//                 </div>
//               </label>

//             </div>

//           </div>

//           <div className="bg-white border rounded-xl p-6 mb-6">
//             <h2 className="font-semibold mb-4">Entry Title</h2>

//             <div className="">
//               <label htmlFor="diary-title">Title</label>
//               <input type="text" name="title" id="diary-title" placeholder="e.g. Vibe 1 cái gì đó cho ngầu" className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${errors.title ? 'border-red-500' : ''}`} />
//               {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
//             </div>

//             <div className="mt-4">
//               <label htmlFor="diary-trip">Related Trip</label>
//               <select id="diary-trip" name="trip_id" className="w-full px-4 py-2 border rounded-lg text-gray-500">
//                 <option>Related Trip (Optional)</option>
//                 {trips && trips.map(function (trip: any) {
//                   return (
//                     <option key={trip.id} value={trip.id}>{trip.title}</option>
//                   )
//                 })}
//               </select>
//             </div>
//           </div>



//           <div className="bg-white border rounded-xl p-6 mb-6">
//             <h2 className="font-semibold mb-2">Write your experience</h2>
//             <p className="text-sm text-gray-500 mb-3">
//               Share your thoughts, feelings, and experiences from this journey.
//             </p>
//             <div className="">
//               <label htmlFor="diary-description">Description</label>
//               <textarea id="diary-description" name="description" rows={6} placeholder="What made it special? What did you learn?" className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${errors.description ? 'border-red-500' : ''}`} defaultValue={""} />
//               {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
//             </div>

//             <div className="mt-4">
//               <label htmlFor="diary-tag">Tags</label>
//               <input type="text" id="diary-tag" name="tags" placeholder="Tags (comma separated: hiking, mountain, adventure)" className="w-full px-4 py-2 border rounded-lg" />
//             </div>
//           </div>


//           <div className="bg-white border rounded-xl p-6 mb-6">
//             <h2 className="font-semibold mb-4">Media</h2>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {/* Upload box */}
//               <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-sm text-gray-500 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition min-h-[140px]">
//                 <span className="text-2xl mb-1">📷</span>
//                 <span className="font-medium">Upload Photos</span>
//                 <span className="text-xs mt-1">PNG, JPG up to 10MB</span>

//                 <input
//                   type="file"
//                   accept="image/png, image/jpeg"
//                   name="images"
//                   className="hidden"
//                   multiple
//                   onChange={handlePhotosChange}
//                 />
//               </label>

//               {/* Preview images */}
//               {previewImages &&
//                 previewImages.map((img, index) => (
//                   <div
//                     key={index}
//                     className="relative group border rounded-xl overflow-hidden"
//                   >
//                     <img
//                       src={img.url}
//                       alt={`preview-${index}`}
//                       className="h-36 w-full object-cover"
//                     />

//                     {/* Overlay */}
//                     <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

//                     {/* Remove button */}
//                     <button
//                       type="button"
//                       onClick={() => removeImage(index)}
//                       className="absolute top-2 right-2 bg-white text-gray-700 text-xs w-7 h-7 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ))}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//               {/* Upload box */}
//               <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-sm text-gray-500 cursor-pointer hover:border-blue-500 hover:text-blue-600 transition min-h-[140px]">
//                 🎥 Upload Videos
//                 <p className="text-xs mt-1">MP4, MOV up to 50MB</p>

//                 <input
//                   type="file"
//                   accept="video/mp4, video/quicktime"
//                   name="video"
//                   className="hidden"
//                   onChange={handleVideoChange}
//                 />
//               </label>

//               {/* Preview videl */}
//               {previewVideo && (
//                 <div
//                   className="relative group border rounded-xl overflow-hidden"
//                 >
//                   <video
//                     src={previewVideo.url}
//                     className="h-36 w-full object-cover"
//                   />

//                   {/* Overlay */}
//                   <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />

//                   {/* Remove button */}
//                   <button
//                     type="button"
//                     className="absolute top-2 right-2 bg-white text-gray-700 text-xs w-7 h-7 flex items-center justify-center rounded-full shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
//                     onClick={removeVideo}
//                   >
//                     ✕
//                   </button>
//                 </div>
//               )}
//             </div>

//             <input
//               type="text"
//               placeholder="Photo caption (optional)"
//               className="mt-4 w-full px-4 py-2 border rounded-lg"
//             />
//           </div>


//           <div className="bg-white border rounded-xl p-6 mb-6">
//             <h2 className="font-semibold mb-4">Additional Details</h2>
//             <div className="space-y-3">
//               <input type="text" name="weather_des" placeholder="Weather" className="w-full px-4 py-2 border rounded-lg" />
//               <input type="text" name="feeling_des" placeholder="Feeling" className="w-full px-4 py-2 border rounded-lg" />
//               {/* <input type="text" name="companions" placeholder="Travel Companions" className="w-full px-4 py-2 border rounded-lg" /> */}
//             </div>
//           </div>

//           <div className="bg-white border rounded-xl p-6 mb-6">
//             <h2 className="font-semibold mb-4">Privacy &amp; Sharing</h2>
//             <div className="space-y-4 text-sm">

//               <div className="flex justify-between items-center">
//                 <span>Make this entry public</span>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input type="checkbox" name="is_public" id="diary-public" className="sr-only peer" />
//                   <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 transition-all duration-200" />
//                   <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full shadow transform peer-checked:translate-x-5 transition-all duration-200" />
//                 </label>
//               </div>


//               <div className="flex justify-between items-center">
//                 <span>Allow comments</span>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input type="checkbox" name="allow_comment" id="diary-allow-comment" className="sr-only peer" />
//                   <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 transition-all duration-200" />
//                   <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full shadow transform peer-checked:translate-x-5 transition-all duration-200" />
//                 </label>
//               </div>
//             </div>
//           </div>


//           <div className="flex justify-between items-center">
//             <div className="flex gap-2">
//               <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">Save as Draft</button>
//               <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer">Preview</button>
//               <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-green-700 hover:shadow-md active:scale-95 transition-all">
//                 Publish Entry
//               </button>
//             </div>
//           </div>


//         </form>
//       </div >

//     </>
//   )
// }