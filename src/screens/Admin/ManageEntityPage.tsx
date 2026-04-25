"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_DS } from "./adminDesignSystem";

type ManageEntityPageProps = {
  title: string;
  baseEndpoint: string;
  columns: Array<{ key: string; label: string; render?: (value: unknown, row: Record<string, unknown>) => string }>;
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
        const nextItems = Array.isArray(payload?.items) ? payload.items : [];
        const pagination = payload?.pagination;
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
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search in records..."
          className={`mb-4 ${ADMIN_DS.input}`}
        />

        {error && <p className={`${ADMIN_DS.error} mb-3`}>{error}</p>}

        {loading ? (
          <p className={ADMIN_DS.info}>Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className={ADMIN_DS.empty}>No data.</p>
        ) : (
          <div className="overflow-x-auto">
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
                        {idValue !== undefined && (
                          <Button
                            className={ADMIN_DS.dangerButton}
                            size="sm"
                            disabled={deletingId === idValue}
                            onClick={() => deleteItem(idValue)}
                          >
                            {deletingId === idValue ? "Deleting..." : "Delete"}
                          </Button>
                        )}
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
    </div>
  );
}
