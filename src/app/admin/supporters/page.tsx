"use client";

import { API_ENDPOINTS } from "@/constants/api";
import { ManageEntityPage } from "@/screens/Admin/ManageEntityPage";

export default function AdminSupportersPage() {
  return (
    <ManageEntityPage
      title="Manage Supporter"
      baseEndpoint={API_ENDPOINTS.SUPPORTERS.BASE}
      idKey="user_id"
      columns={[
        { key: "user_id", label: "User ID" },
        {
          key: "is_available",
          label: "Available",
          render: (v) => (v ? "Yes" : "No"),
        },
      ]}
      formFields={[
        {
          key: "user_id",
          label: "User",
          required: true,
          optionsEndpoint: API_ENDPOINTS.USERS.BASE,
          optionsValueKey: "id",
          optionsLabelKey: "full_name",
        },
        { key: "is_available", label: "Available", type: "boolean" },
      ]}
    />
  );
}
