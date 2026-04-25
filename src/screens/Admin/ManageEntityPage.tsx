"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_DS } from "./adminDesignSystem";

type FieldType = "text" | "number" | "textarea" | "boolean";
type SelectOption = { value: string; label: string };

type FormField = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  optionsEndpoint?: string;
  optionsValueKey?: string;
  optionsLabelKey?: string;
};

type ManageEntityPageProps = {
  title: string;
  baseEndpoint: string;
  columns: Array<{ key: string; label: string; render?: (value: unknown, row: Record<string, unknown>) => string }>;
  formFields: FormField[];
  idKey: string;
  pageSize?: number;
};

type PaginatedPayload = {
  items: Record<string, unknown>[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function ManageEntityPage({
  title,
  baseEndpoint,
  columns,
  formFields,
  idKey,
  pageSize = 10,
}: ManageEntityPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modalMode, setModalMode] = useState<"view" | "create" | "edit" | null>(null);
  const [modalRow, setModalRow] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectOptions, setSelectOptions] = useState<Record<string, SelectOption[]>>({});
  const [selectSearch, setSelectSearch] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteRow, setConfirmDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const fetchItems = useCallback(async (nextPage?: number) => {
    const targetPage = nextPage ?? page;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });
      const res = await fetch(`${baseEndpoint}?${query.toString()}`, {
        credentials: "include",
      });
      const result = await res.json();
      const payload = result?.data as PaginatedPayload | Record<string, unknown>[] | undefined;
      if (Array.isArray(payload)) {
        setItems(payload);
        setTotalItems(payload.length);
        setTotalPages(1);
        setPage(1);
      } else {
        const payloadObj: PaginatedPayload = payload ?? { items: [], pagination: undefined };
        const nextItems = Array.isArray(payloadObj.items) ? payloadObj.items : [];
        const pagination = payloadObj?.pagination;
        setItems(nextItems);
        setTotalItems(Number(pagination?.total ?? 0));
        setTotalPages(Number(pagination?.totalPages ?? 1));
        setPage(Number(pagination?.page ?? targetPage));
      }
    } catch {
      setError("Cannot load data.");
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, page, pageSize]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const openCreate = () => {
    const initialData: Record<string, string> = {};
    for (const field of formFields) {
      initialData[field.key] = field.type === "boolean" ? "false" : "";
    }
    setFormData(initialData);
    setSelectSearch({});
    setModalRow(null);
    setModalMode("create");
    setError("");
    preloadSelectOptions();
  };

  const openView = (row: Record<string, unknown>) => {
    setModalRow(row);
    setModalMode("view");
    setError("");
  };

  const openEdit = (row: Record<string, unknown>) => {
    const nextData: Record<string, string> = {};
    for (const field of formFields) {
      const value = row[field.key];
      if (field.type === "boolean") {
        nextData[field.key] = value ? "true" : "false";
      } else if (value === null || value === undefined) {
        nextData[field.key] = "";
      } else {
        nextData[field.key] = String(value);
      }
    }
    setFormData(nextData);
    setSelectSearch(nextData);
    setModalRow(row);
    setModalMode("edit");
    setError("");
    preloadSelectOptions();
  };

  const closeModal = () => {
    setModalMode(null);
    setModalRow(null);
    setFormData({});
    setSelectOptions({});
    setSelectSearch({});
  };

  const preloadSelectOptions = async () => {
    const selectFields = formFields.filter((f) => f.optionsEndpoint);
    if (selectFields.length === 0) return;

    const nextOptions: Record<string, SelectOption[]> = {};
    await Promise.all(
      selectFields.map(async (field) => {
        try {
          const res = await fetch(field.optionsEndpoint!, { credentials: "include" });
          const result = await res.json();
          const rows = Array.isArray(result?.data?.items)
            ? result.data.items
            : Array.isArray(result?.data)
            ? result.data
            : [];
          const valueKey = field.optionsValueKey || "id";
          const labelKey = field.optionsLabelKey || "id";
          nextOptions[field.key] = rows
            .map((row: Record<string, unknown>) => ({
              value: String(row[valueKey] ?? ""),
              label: String(row[labelKey] ?? row[valueKey] ?? ""),
            }))
            .filter((opt: SelectOption) => Boolean(opt.value));
        } catch {
          nextOptions[field.key] = [];
        }
      })
    );
    setSelectOptions(nextOptions);
  };

  const parseFieldValue = (field: FormField, rawValue: string): unknown => {
    if (field.key === "images") {
      const trimmed = rawValue.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    if (field.type === "number") {
      if (rawValue.trim() === "") return null;
      return Number(rawValue);
    }
    if (field.type === "boolean") {
      return rawValue === "true";
    }
    return rawValue;
  };

  const submitModal = async () => {
    if (modalMode !== "create" && modalMode !== "edit") return;
    setSubmitting(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {};
      for (const field of formFields) {
        const raw = formData[field.key] ?? "";
        if (field.required && raw.trim() === "") {
          throw new Error(`${field.label} is required`);
        }
        payload[field.key] = parseFieldValue(field, raw);
      }

      const isEdit = modalMode === "edit";
      const editId = modalRow?.[idKey];
      const url = isEdit ? `${baseEndpoint}/${String(editId ?? "")}` : baseEndpoint;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || `${isEdit ? "Update" : "Create"} failed`);
      }

      closeModal();
      await fetchItems(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (id: string | number) => {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`${baseEndpoint}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || "Delete failed");
      }
      await fetchItems(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={ADMIN_DS.page}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className={ADMIN_DS.title}>{title}</h1>
          <p className={`${ADMIN_DS.subtitle} mt-2`}>
            Manage records in table format with pagination.
          </p>
        </div>
        <Button onClick={() => fetchItems(page)} variant="outline" className={ADMIN_DS.ghostButton}>
          Refresh
        </Button>
      </div>

      <div className={ADMIN_DS.section}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in records..."
            className={`md:max-w-xs ${ADMIN_DS.input}`}
          />
          <Button className={ADMIN_DS.primaryButton} onClick={openCreate}>
            Create
          </Button>
        </div>

        {error && <p className={`${ADMIN_DS.error} mb-3`}>{error}</p>}

        {loading ? (
          <p className={ADMIN_DS.info}>Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className={ADMIN_DS.empty}>No data.</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border border-[#f3f4f6]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="py-3 px-3 text-[12px] font-semibold uppercase tracking-wide text-[#4b5563]"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-[12px] font-semibold uppercase tracking-wide text-[#4b5563]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const idValue = item[idKey] as string | number | undefined;
                  return (
                    <tr
                      key={`${String(idValue ?? "row")}-${index}`}
                      className="border-b border-[#f3f4f6] align-top"
                    >
                      {columns.map((column) => {
                        const rawValue = item[column.key];
                        const display = column.render
                          ? column.render(rawValue, item)
                          : String(rawValue ?? "—");
                        return (
                          <td key={column.key} className="py-3 px-3 text-[14px] text-[#111827]">
                            {display}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className={ADMIN_DS.ghostButton}
                            size="sm"
                            onClick={() => openView(item)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            className={ADMIN_DS.ghostButton}
                            size="sm"
                            onClick={() => openEdit(item)}
                            disabled={idValue === undefined}
                          >
                            Edit
                          </Button>
                          {idValue !== undefined && (
                            <Button
                              className={ADMIN_DS.dangerButton}
                              size="sm"
                              disabled={deletingId === idValue}
                              onClick={() => setConfirmDeleteRow(item)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className={ADMIN_DS.info}>
            Total: {totalItems} | Page {page}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className={ADMIN_DS.ghostButton}
              disabled={page <= 1 || loading}
              onClick={() => fetchItems(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className={ADMIN_DS.ghostButton}
              disabled={page >= totalPages || loading}
              onClick={() => fetchItems(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {modalMode && (
        <div
          className="fixed inset-0 z-[9999] bg-black/35 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] bg-white border border-[#e5e7eb] rounded-lg p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[20px] font-semibold text-[#111827] mb-4">
              {modalMode === "create" && `Create ${title}`}
              {modalMode === "edit" && `Edit ${title}`}
              {modalMode === "view" && `View ${title}`}
            </h2>

            {modalMode === "view" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {columns.map((column) => {
                  const rawValue = modalRow?.[column.key];
                  const display = column.render
                    ? column.render(rawValue, modalRow ?? {})
                    : String(rawValue ?? "—");
                  return (
                    <div key={column.key} className="border border-[#e5e7eb] rounded-md p-3">
                      <p className="text-[12px] uppercase tracking-wide text-[#4b5563] mb-1">
                        {column.label}
                      </p>
                      <p className="text-[14px] text-[#111827] break-words">{display}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {formFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-[14px] font-medium text-[#111827] mb-1">
                      {field.label}
                    </label>
                    {field.optionsEndpoint ? (
                      <div className="space-y-2">
                        <Input
                          className={ADMIN_DS.input}
                          placeholder={`Search ${field.label.toLowerCase()}...`}
                          value={selectSearch[field.key] ?? ""}
                          onChange={(e) =>
                            setSelectSearch((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                        <div className="max-h-40 overflow-y-auto rounded-md border border-[#e5e7eb] bg-white">
                          {(selectOptions[field.key] || [])
                            .filter((opt: SelectOption) => {
                              const q = (selectSearch[field.key] ?? "").trim().toLowerCase();
                              if (!q) return true;
                              return (
                                opt.label.toLowerCase().includes(q) ||
                                opt.value.toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 50)
                            .map((opt: SelectOption) => {
                              const selected = (formData[field.key] ?? "") === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`w-full text-left px-3 py-2 text-[14px] border-b last:border-b-0 border-[#f3f4f6] ${
                                    selected
                                      ? "bg-[#FFF1EB] text-[#111827] font-medium"
                                      : "hover:bg-[#f9fafb] text-[#111827]"
                                  }`}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, [field.key]: opt.value }));
                                    setSelectSearch((prev) => ({
                                      ...prev,
                                      [field.key]: opt.label,
                                    }));
                                  }}
                                >
                                  <span>{opt.label}</span>
                                  <span className="ml-2 text-[#6b7280] text-[12px]">
                                    ({opt.value})
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                        <p className="text-[12px] text-[#6b7280]">
                          Selected ID: {formData[field.key] || "none"}
                        </p>
                      </div>
                    ) : field.type === "textarea" ? (
                      <textarea
                        className={ADMIN_DS.textArea}
                        value={formData[field.key] ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    ) : field.type === "boolean" ? (
                      <select
                        className={`h-11 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-[14px] text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2673C]`}
                        value={formData[field.key] ?? "false"}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <Input
                        type={field.type === "number" ? "number" : "text"}
                        className={ADMIN_DS.input}
                        value={formData[field.key] ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" className={ADMIN_DS.ghostButton} onClick={closeModal}>
                {modalMode === "view" ? "Close" : "Cancel"}
              </Button>
              {(modalMode === "create" || modalMode === "edit") && (
                <Button
                  className={ADMIN_DS.primaryButton}
                  onClick={submitModal}
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create"
                    : "Update"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteRow && (
        <div
          className="fixed inset-0 z-[9999] bg-black/35 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteRow(null)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] bg-white border border-[#e5e7eb] rounded-lg p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold text-[#111827] mb-2">Confirm Delete</h3>
            <p className="text-[14px] text-[#4b5563] mb-5">
              Are you sure you want to delete this record?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className={ADMIN_DS.ghostButton}
                onClick={() => setConfirmDeleteRow(null)}
              >
                Cancel
              </Button>
              <Button
                className={ADMIN_DS.dangerButton}
                onClick={async () => {
                  const deleteId = confirmDeleteRow[idKey] as string | number | undefined;
                  if (deleteId !== undefined) {
                    await deleteItem(deleteId);
                  }
                  setConfirmDeleteRow(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
