
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  LoaderCircle,
  Workflow,
  FileJson,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../../api/axios";

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  RUNNING: "bg-blue-50 text-blue-700 border-blue-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

function getStatusIcon(status) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle2 size={18} />;
    case "FAILED":
      return <XCircle size={18} />;
    case "RUNNING":
      return <RefreshCw size={18} className="animate-spin" />;
    default:
      return <Clock size={18} />;
  }
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

function JsonViewer({ data, emptyMessage = "No data available." }) {
  if (data === null || data === undefined) {
    return (
      <p className="text-sm text-slate-500">{emptyMessage}</p>
    );
  }

  let formatted;

  try {
    formatted =
      typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2);
  } catch {
    formatted = String(data);
  }

  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
      {formatted}
    </pre>
  );
}

function ExecutionDetails() {
  const { id } = useParams();

  const [execution, setExecution] = useState(null);
  const [stepLogs, setStepLogs] = useState([]);
  const [workflowName, setWorkflowName] = useState("");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/executions/${id}`);

      const executionData = response.data.execution;
      const logs = response.data.step_logs || [];

      setExecution(executionData);
      setStepLogs(logs);

      // Workflow names are fetched separately if they are not included
      // in the execution response.
      if (executionData?.workflow?.name) {
        setWorkflowName(executionData.workflow.name);
      } else if (executionData?.workflow_id) {
        try {
          const workflowResponse = await API.get(
            `/workflows/${executionData.workflow_id}`
          );

          setWorkflowName(workflowResponse.data.name || "");
        } catch {
          setWorkflowName("");
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Unable to load execution details.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRetry = async () => {
    if (!execution || execution.status !== "FAILED") {
      toast.info("Only failed executions can be retried.");
      return;
    }

    try {
      setRetrying(true);

      const response = await API.post(`/executions/${id}/retry`);

      toast.success("Retry execution created successfully.");

      const newExecutionId = response.data?.id;

      if (newExecutionId && String(newExecutionId) !== String(id)) {
        window.location.assign(`/executions/${newExecutionId}`);
        return;
      }

      await fetchDetails();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          "Unable to retry this execution."
      );
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-500">
        <LoaderCircle size={22} className="animate-spin" />
        Loading execution details...
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={24}
              className="shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to display execution
              </h2>

              <p className="mt-2 text-sm text-red-700">
                {error || "Execution not found."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchDetails}
              className="rounded-xl bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm"
            >
              Try Again
            </button>

            <Link
              to="/executions"
              className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white"
            >
              Back to Executions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = execution.status || "UNKNOWN";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <Link
        to="/executions"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Executions
      </Link>

      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Activity size={24} />
              </div>

              <div>
                <p className="text-sm font-medium text-indigo-600">
                  EXECUTION DETAILS
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Execution #{execution.id}
                </h1>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  statusStyles[status] ||
                  "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {getStatusIcon(status)}
                {status}
              </span>

              <span className="text-sm text-slate-500">
                Workflow ID: {execution.workflow_id}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchDetails}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            {status === "FAILED" && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retrying ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <RotateCcw size={17} />
                )}

                {retrying ? "Retrying..." : "Retry Execution"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Workflow size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-slate-500">Workflow</p>

              <p className="mt-1 break-words font-semibold text-slate-900">
                {workflowName || `Workflow #${execution.workflow_id}`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <Clock size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Created At</p>

              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(execution.created_at)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Error details */}
      {status === "FAILED" && execution.error_message && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <XCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Execution Failed
              </h2>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-700">
                {execution.error_message}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Input data */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <FileJson size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Input Data
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Data passed to the workflow engine
            </p>
          </div>
        </div>

        <JsonViewer
          data={execution.input_data}
          emptyMessage="This execution has no input data."
        />
      </section>

      {/* Step logs */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900">
            Execution Step Logs
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {stepLogs.length} step log
            {stepLogs.length === 1 ? "" : "s"} recorded
          </p>
        </div>

        {stepLogs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity
              size={30}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-medium text-slate-800">
              No step logs available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Step logs will appear here when the backend records them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stepLogs.map((log, index) => {
              const logStatus = (
                log.status ||
                log.step_status ||
                "UNKNOWN"
              ).toUpperCase();

              const failed = logStatus === "FAILED";
              const success = logStatus === "SUCCESS";

              return (
                <article
                  key={log.id ?? `${log.execution_id}-${index}`}
                  className="p-5 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        failed
                          ? "bg-red-50 text-red-600"
                          : success
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {failed ? (
                        <XCircle size={18} />
                      ) : success ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Clock size={18} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {log.step_name ||
                            log.action_name ||
                            log.step_type ||
                            `Step ${index + 1}`}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            failed
                              ? "bg-red-50 text-red-700"
                              : success
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {logStatus}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(log.created_at)}
                      </p>

                      {(log.message || log.error_message || log.error) && (
                        <p
                          className={`mt-3 whitespace-pre-wrap break-words text-sm leading-6 ${
                            failed ? "text-red-700" : "text-slate-600"
                          }`}
                        >
                          {log.message ||
                            log.error_message ||
                            log.error}
                        </p>
                      )}

                      {(log.input_data || log.output_data) && (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          {log.input_data && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Step Input
                              </p>

                              <JsonViewer data={log.input_data} />
                            </div>
                          )}

                          {log.output_data && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Step Output
                              </p>

                              <JsonViewer data={log.output_data} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ExecutionDetails;
