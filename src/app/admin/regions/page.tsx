"use client";

import { API_ENDPOINTS } from "@/constants/api";
import { ManageEntityPage } from "@/screens/Admin/ManageEntityPage";

export default function AdminRegionsPage() {
  return (
    <ManageEntityPage
      title="Manage Region"
      baseEndpoint={API_ENDPOINTS.REGIONS.BASE}
      idKey="id"
      columns={[
        { key: "id", label: "Region ID" },
        { key: "address", label: "Address" },
        { key: "created_at", label: "Created At", render: (v) => (v ? new Date(String(v)).toLocaleString() : "—") },
        { key: "updated_at", label: "Updated At", render: (v) => (v ? new Date(String(v)).toLocaleString() : "—") },
      ]}
    />
  );
}
