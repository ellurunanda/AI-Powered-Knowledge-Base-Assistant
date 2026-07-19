import { useCallback, useEffect, useState } from "react";
import { useToast } from "../app/providers/use-toast";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { AdminUser } from "../types/api";

export function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await httpClient.get<{ success: boolean; data: AdminUser[] }>("/auth/users");
      setUsers(response.data.data);
    } catch (loadError) {
      setUsers([]);
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, role: "member" | "admin") => {
    setUpdatingUserId(userId);
    try {
      const response = await httpClient.patch<{ success: boolean; data: AdminUser }>(`/auth/users/${userId}/role`, {
        role,
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? { ...user, role: response.data.data.role } : user)),
      );
      showToast("User role updated", "success");
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApproveMember = async (userId: string) => {
    setUpdatingUserId(userId);
    try {
      const response = await httpClient.patch<{ success: boolean; data: AdminUser }>(
        `/auth/users/${userId}/approval`,
        {
          isApproved: true,
        },
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId ? { ...user, isApproved: response.data.data.isApproved } : user,
        ),
      );
      showToast("User approved", "success");
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <PageShell title="Admin - Users" description="Manage member/admin role assignments.">
      {isLoading ? <LoadingState label="Loading users..." /> : null}
      {!isLoading && error ? <ErrorState message={error} onRetry={() => void loadUsers()} /> : null}
      {!isLoading && !error && users.length === 0 ? <EmptyState message="No users available." /> : null}

      {!isLoading && !error && users.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Approval</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={updatingUserId === user.id}
                      onChange={(event) => void handleRoleChange(user.id, event.target.value as "member" | "admin")}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "member" ? (
                      user.isApproved ? (
                        <span className="rounded border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700">
                          Approved
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => void handleApproveMember(user.id)}
                          className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                      )
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Auto-approved</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(user.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </PageShell>
  );
}
