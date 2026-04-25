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
      formFields={[
        {
          key: "region_id",
          label: "Region",
          required: true,
          optionsEndpoint: API_ENDPOINTS.REGIONS.BASE,
          optionsValueKey: "id",
          optionsLabelKey: "address",
        },
        { key: "name", label: "Name", required: true },
        { key: "country", label: "Country", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "latitude", label: "Latitude", type: "number" },
        { key: "longitude", label: "Longitude", type: "number" },
        { key: "category", label: "Category" },
        { key: "best_season", label: "Best Season" },
        { key: "rating", label: "Rating", type: "number" },
        { key: "images", label: "Images (JSON string)" },
      ]}
    />
  );
}
