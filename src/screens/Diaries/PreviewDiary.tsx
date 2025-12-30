"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;


export default function PreviewDiary({ diary }: { diary: any }) {
    if (!diary) return null;
    const [trip, setTrip] = useState<any | null>(null);

    useEffect(() => {
        if (!diary?.trip_id) return;

        getTrip(diary.trip_id);
    }, [diary?.trip_id]);

    async function getTrip(id: string) {
        try {
            const response = await fetch(`${API}/trips/${id}`);
            const data = await response.json();

            if (response.ok && data.status === 200) {
                setTrip(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch trip:", error);
        }
    }

    return (
        <>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {diary.title}
            </h1>

            <div className="mb-12">
                <div className="rounded-xl overflow-hidden border shadow-md">
                    <img
                        src={diary.main_image_url}
                        alt="cover"
                        className="w-full h-[400px] object-cover"
                    />
                </div>
            </div>

            {trip && (
                <div className="mb-10">
                    <h2 className="text-xl font-semibold mb-2">Related Trip</h2>
                    {trip && (
                        <Link
                            href={`/trips/${diary.trip_id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-blue-50 text-blue-700 text-sm font-medium
                            hover:bg-blue-100 transition"
                        >
                            <MapPin className="w-4 h-4" />
                            <span>{trip.title}</span>
                        </Link>
                    )}
                </div>
            )}

            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-2">Short Description</h2>
                <p className="text-gray-700 leading-relaxed">
                    {diary.description}
                </p>
            </div>

            {diary.metadata && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4">Info Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {diary.metadata.map((item: any) => (
                            <div
                                key={item.id}
                                className="border rounded-lg p-4 bg-gray-50"
                            >
                                <p className="text-xs text-gray-500 font-medium">{item.title}</p>
                                <p className="mt-2 font-semibold text-gray-800">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {diary.content_sections && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4">Content</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {diary.content_sections.map((section: any) => (
                            <div
                                key={section.id}
                                className="border rounded-xl p-6 bg-white"
                            >
                                <h3 className="font-semibold text-lg mb-3">
                                    {section.title}
                                </h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {diary.image_urls && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4">Images</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {diary.image_urls.map((img: any, idx: number) => (
                            <div
                                key={idx}
                                className="border rounded-xl overflow-hidden"
                            >
                                <img
                                    src={img}
                                    alt={`gallery-${idx}`}
                                    className="h-36 w-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>

    )
}