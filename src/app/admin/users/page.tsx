"use client";

import { API_ENDPOINTS } from "@/constants/api";
import { ManageEntityPage } from "@/screens/Admin/ManageEntityPage";

export default function AdminUsersPage() {
  return (
    <ManageEntityPage
      title="Manage User"
      baseEndpoint={API_ENDPOINTS.USERS.BASE}
      idKey="id"
      columns={[
        { key: "id", label: "User ID" },
        { key: "account_id", label: "Account ID" },
        { key: "full_name", label: "Full Name" },
        { key: "phone", label: "Phone" },
        { key: "created_at", label: "Created At", render: (v) => (v ? new Date(String(v)).toLocaleString() : "—") },
      ]}
      formFields={[
        {
          key: "account_id",
          label: "Account",
          required: true,
          optionsEndpoint: API_ENDPOINTS.ACCOUNTS.BASE,
          optionsValueKey: "id",
          optionsLabelKey: "username",
        },
        { key: "full_name", label: "Full Name", required: true },
        { key: "avatar_url", label: "Avatar URL" },
        { key: "phone", label: "Phone" },
      ]}
    />
  );
}
