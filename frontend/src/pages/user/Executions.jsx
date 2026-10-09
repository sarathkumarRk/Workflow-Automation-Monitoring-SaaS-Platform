
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  Workflow,
  XCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../../api/axios";

const PAGE_SIZE = 10;

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700",
  RUNNING: "bg-blue-50 text-blue-700",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
};

function Executions() {
  const [executions, setExecutions] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [error, setError] = useState("");

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await API.get("/workflows/", {
        params: { page: 1, limit: 100 },
      });

      setWorkflows(
        Array.isArray(response.data)
          ? response.data
          : response.data.items || []
      );
    } catch {
      // Execution history remains usable if workflow names cannot load.
      setWorkflows([]);
    }
  }, []);

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit: PAGE_SIZE };

      if (status) params.status = status;
      if (workflowId) params.workflow_id = Number(workflowId);

      const response = await API.get("/executions/", { params });

      setExecutions(
        Array.isArray(response.data)
          ? response.data
          : response.data.items || []
      );
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Unable to load execution history.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, status, workflowId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const handleStatusFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleWorkflowFilter = (value) => {
    setWorkflowId(value);
    setPage(1);
  };

  const handleRetry = async (execution) => {
    if (execution.status !== "FAILED") {
      toast.info("Only failed executions can be retried.");
      return;
    }

    try {
      setRetryingId(execution.id);

      await API.post(`/executions/${execution.id}/retry`);

      toast.success("Execution retry started successfully.");
      await fetchExecutions();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Unable to retry this execution."
      );
    } finally {
      setRetryingId(null);
    }
  };

  const getWorkflowName = (execution) => {
    if (execution.workflow?.name) {
      return execution.workflow.name;
    }

    const workflow = workflows.find(
      (item) => item.id === execution.workflow_id
    );

    return workflow?.name || `Workflow #${execution.workflow_id}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString();
  };

  const getStatusIcon = (value) => {
    switch (value) {
      case "SUCCESS":
        return <CheckCircle2 size={15} />;
      case "FAILED":
        return <XCircle size={15} />;
      case "RUNNING":
        return <RefreshCw size={15} className="animate-spin" />;
      default:
        return <Clock size={15} />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            MONITORING
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Execution History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor workflow runs, inspect failures, and retry failed executions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchExecutions}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <label
            htmlFor="execution-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Filter by status
          </label>

          <select
            id="execution-status"
            value={status}
            onChange={(event) => handleStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="execution-workflow"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Filter by workflow
          </label>

          <select
            id="execution-workflow"
            value={workflowId}
            onChange={(event) => handleWorkflowFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All workflows</option>

            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>

        {(status || workflowId) && (
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setWorkflowId("");
                setPage(1);
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <XCircle size={16} />
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Execution table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Activity size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Workflow Runs
            </h2>

            <p className="text-sm text-slate-500">
              Latest executions for the selected filters
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={22} className="animate-spin" />
            Loading executions...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <XCircle className="mx-auto text-red-500" size={32} />

            <p className="mt-3 font-medium text-slate-800">
              Could not load execution history
            </p>

            <p className="mt-1 text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={fetchExecutions}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : executions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Search size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No executions found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing the filters or wait until a workflow runs.
            </p>

            {(status || workflowId) && (
              <button
                type="button"
                onClick={() => {
                  setStatus("");
                  setWorkflowId("");
                  setPage(1);
                }}
                className="mt-4 font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Execution</th>
                    <th className="px-5 py-4 font-semibold">Workflow</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created At</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {executions.map((execution) => (
                    <tr
                      key={execution.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          #{execution.id}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Workflow ID: {execution.workflow_id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <Workflow size={16} className="shrink-0 text-slate-400" />
                          {getWorkflowName(execution)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            statusStyles[execution.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getStatusIcon(execution.status)}
                          {execution.status || "UNKNOWN"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(execution.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/executions/${execution.id}`}
                            aria-label={`View execution ${execution.id}`}
                            title="View details"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Eye size={16} />
                            Details
                          </Link>

                          {execution.status === "FAILED" && (
                            <button
                              type="button"
                              onClick={() => handleRetry(execution)}
                              disabled={retryingId === execution.id}
                              title="Retry failed execution"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {retryingId === execution.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <RotateCcw size={16} />
                              )}

                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {page} · {executions.length} execution
                {executions.length === 1 ? "" : "s"} shown
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (executions.length === PAGE_SIZE) {
                      setPage((current) => current + 1);
                    }
                  }}
                  disabled={executions.length < PAGE_SIZE}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Executions;
