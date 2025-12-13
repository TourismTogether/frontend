import { Navbar } from "@/components/Layout/Navbar";
import DetailTripsClient from "@/screens/Trips/DetailTripClient";

interface DetailTripsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DetailTripsPage({
  params,
}: DetailTripsPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <DetailTripsClient tripId={id} />
    </div>
  );
}
