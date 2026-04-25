"use client";

import { API_ENDPOINTS } from "@/constants/api";
import { ManageEntityPage } from "@/screens/Admin/ManageEntityPage";

export default function AdminDestinationsPage() {
  return (
    <ManageEntityPage
      title="Manage Destination"
      baseEndpoint={API_ENDPOINTS.DESTINATIONS.BASE}
      idKey="id"
      columns={[
        { key: "id", label: "Destination ID" },
        { key: "region_id", label: "Region ID" },
        { key: "name", label: "Name" },
        { key: "country", label: "Country" },
        { key: "category", label: "Category" },
        { key: "rating", label: "Rating" },
      ]}
    />
  );
}
