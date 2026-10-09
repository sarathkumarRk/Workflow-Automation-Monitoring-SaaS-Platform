
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  Workflow,
  Pencil,
  Trash2,
  Play,
  Pause,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";

import API from "../../api/axios";

function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/workflows/", {
        params: {
          page,
          limit: limit + 1,
          search: search.trim() || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setHasNextPage(data.length > limit);
      setWorkflows(data.slice(0, limit));
    } catch (err) {
      const message =
        err.response?.data?.detail || "Unable to load workflows.";

      setError(
        typeof message === "string" ? message : "Unable to load workflows."
      );
      toast.error("Failed to load workflows.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (value) => {
    setSortOrder(value);
    setPage(1);
  };

  const handleToggleStatus = async (workflow) => {
    setUpdatingId(workflow.id);

    try {
      await API.patch(
        `/workflows/${workflow.id}/status`,
        null,
        {
          params: {
            is_enabled: !workflow.is_enabled,
          },
        }
      );

      toast.success(
        workflow.is_enabled
          ? "Workflow disabled successfully."
          : "Workflow enabled successfully."
      );

      await fetchWorkflows();
    } catch (err) {
      const message =
        err.response?.data?.detail || "Unable to update workflow status.";

      toast.error(
        typeof message === "string"
          ? message
          : "Unable to update workflow status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await API.delete(`/workflows/${deleteId}`);

      toast.success("Workflow deleted successfully.");
      setDeleteId(null);

      if (workflows.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await fetchWorkflows();
      }
    } catch (err) {
      const message =
        err.response?.data?.detail || "Unable to delete workflow.";

      toast.error(
        typeof message === "string"
          ? message
          : "Unable to delete workflow."
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              WORKFLOW MANAGEMENT
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              My Workflows
            </h1>
            <p className="mt-2 text-slate-500">
              Create, organize, and monitor your automations.
            </p>
          </div>

          <Link
            to="/workflows/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={18} />
            Create Workflow
          </Link>
        </header>

        {/* Search and filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="workflow-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search workflows
              </label>

              <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <Search size={18} className="text-slate-400" />

                <input
                  id="workflow-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(event.target.value)
                  }
                  placeholder="Search by workflow name..."
                  className="w-full px-3 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sort-by"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort by
              </label>

              <select
                id="sort-by"
                value={sortBy}
                onChange={(event) => handleSortChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500"
              >
                <option value="created_at">Created date</option>
                <option value="name">Workflow name</option>
                <option value="id">Workflow ID</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sort-order"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort order
              </label>

              <select
                id="sort-order"
                value={sortOrder}
                onChange={(event) =>
                  handleSortOrderChange(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500"
              >
                <option value="desc">Newest first / Z–A</option>
                <option value="asc">Oldest first / A–Z</option>
              </select>
            </div>
          </div>
        </section>

        {/* Error state */}
        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchWorkflows}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center" role="status">
            <RefreshCw
              size={26}
              className="animate-spin text-indigo-600"
            />
            <span className="ml-3 text-slate-600">
              Loading workflows...
            </span>
          </div>
        ) : workflows.length === 0 ? (
          /* Empty state */
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Workflow
              size={42}
              className="mx-auto text-slate-400"
            />
            <h2 className="mt-4 text-xl font-semibold text-slate-800">
              {search ? "No matching workflows" : "No workflows yet"}
            </h2>
            <p className="mt-2 text-slate-500">
              {search
                ? "Try another workflow name."
                : "Create your first workflow to start automating tasks."}
            </p>

            {!search && (
              <Link
                to="/workflows/create"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={18} />
                Create Workflow
              </Link>
            )}
          </section>
        ) : (
          <>
            {/* Workflow cards */}
            <section
              aria-label="Workflow list"
              className="grid grid-cols-1 gap-5 lg:grid-cols-2"
            >
              {workflows.map((workflow) => (
                <article
                  key={workflow.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                        <Workflow size={22} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold text-slate-900">
                          {workflow.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Workflow ID: #{workflow.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        workflow.is_enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {workflow.is_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p className="mt-4 min-h-10 break-words text-sm leading-6 text-slate-600">
                    {workflow.description || "No description provided."}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/workflows/${workflow.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        View
                      </Link>

                      <Link
                        to={`/workflows/${workflow.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={updatingId === workflow.id}
                        onClick={() => handleToggleStatus(workflow)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {workflow.is_enabled ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                        {updatingId === workflow.id
                          ? "Updating..."
                          : workflow.is_enabled
                            ? "Disable"
                            : "Enable"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(workflow.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* Pagination */}
            <nav
              aria-label="Workflow pagination"
              className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm text-slate-500">
                Page <span className="font-semibold">{page}</span>
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </nav>
          </>
        )}

        {/* Delete confirmation dialog */}
        {deleteId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDeleteId(null);
              }
            }}
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              aria-describedby="delete-description"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 inline-flex rounded-full bg-red-100 p-3 text-red-600">
                <Trash2 size={24} />
              </div>

              <h2
                id="delete-title"
                className="text-xl font-bold text-slate-900"
              >
                Delete workflow?
              </h2>

              <p
                id="delete-description"
                className="mt-2 text-sm leading-6 text-slate-600"
              >
                This action cannot be undone. Make sure you want to delete
                this workflow before continuing.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default Workflows;
