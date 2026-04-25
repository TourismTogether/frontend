"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { ADMIN_DS } from "@/screens/Admin/adminDesignSystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountRow = {
  id?: string;
  username?: string;
  email?: string;
};

type UserRow = {
  id?: string;
  account_id?: string;
  full_name?: string;
  phone?: string;
};

type SupporterRow = {
  user_id?: string;
};

type AdminRow = {
  user_id?: string;
};

type Actor = "admin" | "supporter" | "user";

type AccountActorRow = {
  accountId: string;
  username: string;
  email: string;
  userId: string | null;
  fullName: string;
  phone: string;
  actor: Actor;
};

export default function AdminAccountsPage() {
  const [rows, setRows] = useState<AccountActorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [changing, setChanging] = useState<string | null>(null);

  const fetchData = useCallback(async (nextPage?: number) => {
    const targetPage = nextPage ?? page;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });
      const [accountsRes, usersRes, supportersRes, adminsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.ACCOUNTS.BASE}?${query.toString()}`, { credentials: "include" }),
        fetch(API_ENDPOINTS.USERS.BASE, { credentials: "include" }),
        fetch(API_ENDPOINTS.SUPPORTERS.BASE, { credentials: "include" }),
        fetch(API_ENDPOINTS.ADMINS.BASE, { credentials: "include" }),
      ]);

      const [accountsJson, usersJson, supportersJson, adminsJson] = await Promise.all([
        accountsRes.json(),
        usersRes.json(),
        supportersRes.json(),
        adminsRes.json(),
      ]);

      const accountData = accountsJson?.data;
      const accounts: AccountRow[] = Array.isArray(accountData?.items)
        ? accountData.items
        : Array.isArray(accountData)
        ? accountData
        : [];
      const users: UserRow[] = Array.isArray(usersJson?.data) ? usersJson.data : [];
      const supporters: SupporterRow[] = Array.isArray(supportersJson?.data)
        ? supportersJson.data
        : [];
      const admins: AdminRow[] = Array.isArray(adminsJson?.data) ? adminsJson.data : [];

      const userByAccountId = new Map<string, UserRow>();
      users.forEach((u) => {
        if (u.account_id) userByAccountId.set(String(u.account_id), u);
      });

      const supporterSet = new Set(
        supporters.map((s) => String(s.user_id || "")).filter(Boolean)
      );
      const adminSet = new Set(admins.map((a) => String(a.user_id || "")).filter(Boolean));

      const mapped = accounts.map((a) => {
        const accountId = String(a.id || "");
        const user = userByAccountId.get(accountId);
        const userId = user?.id ? String(user.id) : null;
        let actor: Actor = "user";
        if (userId && adminSet.has(userId)) actor = "admin";
        else if (userId && supporterSet.has(userId)) actor = "supporter";

        return {
          accountId,
          username: a.username || "—",
          email: a.email || "—",
          userId,
          fullName: user?.full_name || "—",
          phone: user?.phone || "—",
          actor,
        };
      });

      setRows(mapped);
      const pagination = accountData?.pagination;
      setTotalItems(Number(pagination?.total ?? accounts.length));
      setTotalPages(Number(pagination?.totalPages ?? 1));
      setPage(Number(pagination?.page ?? targetPage));
    } catch {
      setError("Failed to load account actor data.");
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.username, r.email, r.fullName, r.phone, r.accountId, r.userId || "", r.actor]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const switchActor = async (row: AccountActorRow, target: Actor) => {
    if (!row.userId) {
      setError("This account has no user profile. Cannot switch actor.");
      return;
    }
    if (row.actor === target) return;

    setChanging(row.accountId);
    setError("");
    try {
      if (target === "admin") {
        if (row.actor === "supporter") {
          await fetch(API_ENDPOINTS.SUPPORTERS.DELETE(row.userId), {
            method: "DELETE",
            credentials: "include",
          });
        }
        await fetch(API_ENDPOINTS.ADMINS.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: row.userId, key: row.userId }),
        });
      } else if (target === "supporter") {
        if (row.actor === "admin") {
          await fetch(API_ENDPOINTS.ADMINS.DELETE(row.userId), {
            method: "DELETE",
            credentials: "include",
          });
        }
        await fetch(API_ENDPOINTS.SUPPORTERS.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: row.userId, is_available: true }),
        });
      } else {
        if (row.actor === "admin") {
          await fetch(API_ENDPOINTS.ADMINS.DELETE(row.userId), {
            method: "DELETE",
            credentials: "include",
          });
        }
        if (row.actor === "supporter") {
          await fetch(API_ENDPOINTS.SUPPORTERS.DELETE(row.userId), {
            method: "DELETE",
            credentials: "include",
          });
        }
      }

      await fetchData(page);
    } catch {
      setError("Switch actor failed. Please try again.");
    } finally {
      setChanging(null);
    }
  };

  return (
    <div className={ADMIN_DS.page}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className={ADMIN_DS.title}>Manage Account</h1>
          <p className={`${ADMIN_DS.subtitle} mt-2`}>
            Switch actor between admin, supporter, and user.
          </p>
        </div>
        <Button onClick={() => fetchData(page)} variant="outline" className={ADMIN_DS.ghostButton}>
          Refresh
        </Button>
      </div>

      <div className={ADMIN_DS.section}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search account, user, actor..."
          className={`mb-4 md:max-w-xs ${ADMIN_DS.input}`}
        />

        {error && <p className={`${ADMIN_DS.error} mb-3`}>{error}</p>}

        {loading ? (
          <p className={ADMIN_DS.info}>Loading...</p>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-auto rounded-md border border-[#f3f4f6]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    {["Username", "Email", "User", "Phone", "Actor", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-3 text-[12px] font-semibold uppercase tracking-wide text-[#4b5563]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.accountId} className="border-b border-[#f3f4f6] align-top">
                      <td className="py-3 px-3 text-[14px] text-[#111827]">{row.username}</td>
                      <td className="py-3 px-3 text-[14px] text-[#111827]">{row.email}</td>
                      <td className="py-3 px-3 text-[14px] text-[#111827]">{row.fullName}</td>
                      <td className="py-3 px-3 text-[14px] text-[#111827]">{row.phone}</td>
                      <td className="py-3 px-3 text-[14px] text-[#111827] capitalize">
                        {row.actor}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={ADMIN_DS.ghostButton}
                            disabled={changing === row.accountId || row.actor === "user"}
                            onClick={() => switchActor(row, "user")}
                          >
                            User
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={ADMIN_DS.ghostButton}
                            disabled={changing === row.accountId || row.actor === "supporter"}
                            onClick={() => switchActor(row, "supporter")}
                          >
                            Supporter
                          </Button>
                          <Button
                            size="sm"
                            className={ADMIN_DS.primaryButton}
                            disabled={changing === row.accountId || row.actor === "admin"}
                            onClick={() => switchActor(row, "admin")}
                          >
                            Admin
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 px-3 text-center text-[14px] text-[#6b7280]">
                        No account data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className={ADMIN_DS.info}>
                Total: {totalItems} | Page {page}/{totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className={ADMIN_DS.ghostButton}
                  disabled={page <= 1 || loading}
                  onClick={() => fetchData(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className={ADMIN_DS.ghostButton}
                  disabled={page >= totalPages || loading}
                  onClick={() => fetchData(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
