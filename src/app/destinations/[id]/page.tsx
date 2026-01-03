"use client";

import { DestinationDetail } from "@/screens/Destinations/DestinationDetail";
import { Navbar } from "@/components/Layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function DestinationDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const destinationId = params?.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destination"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!destinationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Invalid destination ID
          </h2>
          <button
            onClick={() => router.push("/destinations")}
            className="text-destination hover:text-destination/80"
          >
            Go back to destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DestinationDetail destinationId={destinationId} />
    </div>
  );
}
