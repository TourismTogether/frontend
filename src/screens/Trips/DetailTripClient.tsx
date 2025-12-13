"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DetailTrip } from "@/screens/Trips/DetailTrip";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DetailTripsClient({ tripId }: { tripId: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return <DetailTrip params={{ id: tripId }} />;
}
