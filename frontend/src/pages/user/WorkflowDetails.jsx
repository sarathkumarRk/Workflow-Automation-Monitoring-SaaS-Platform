
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Workflow as WorkflowIcon,
  CalendarDays,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function WorkflowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await API.get(`/workflows/${id}`);
      setWorkflow(response.data);
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        "Unable to load workflow details.";

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [id]);

  const handleStatusChange = async () => {
    if (!workflow) return;

    try {
      const nextStatus = !workflow.is_enabled;

      await API.patch(`/workflows/${id}/status`, null, {
        params: { is_enabled: nextStatus },
      });

      setWorkflow((previous) => ({
        ...previous,
        is_enabled: nextStatus,
      }));

      toast.success(
        nextStatus
          ? "Workflow enabled successfully."
          : "Workflow disabled successfully."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to update workflow status."
      );
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workflow?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await API.delete(`/workflows/${id}`);

      toast.success("Workflow deleted successfully.");
      navigate("/workflows", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to delete workflow. Check whether related records prevent deletion."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="animate-spin" size={22} />
        Loading workflow details...
      </div>
    );
  }

  if (loadError || !workflow) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">
            {loadError || "Workflow not found."}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={fetchWorkflow}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-slate-700 shadow-sm"
            >
              <RefreshCw size={16} />
              Try Again
            </button>

            <Link
              to="/workflows"
              className="rounded-lg bg-slate-900 px-4 py-2 text-white"
            >
              Back to Workflows
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enabled = Boolean(workflow.is_enabled);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Link
        to="/workflows"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Workflows
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <WorkflowIcon size={28} />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-600">
                WORKFLOW DETAILS
              </p>

              <h1 className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                {workflow.name}
              </h1>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                {workflow.description || "No description provided."}
              </p>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                    enabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {enabled ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}

                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/workflows/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              <Edit size={17} />
              Edit
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}

              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CalendarDays size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Created At
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {workflow.created_at
                  ? new Date(workflow.created_at).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-3 ${
                enabled
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {enabled ? (
                <CheckCircle2 size={22} />
              ) : (
                <XCircle size={22} />
              )}
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Workflow Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {enabled
                  ? "This workflow is enabled."
                  : "This workflow is currently disabled."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStatusChange}
            className={`mt-5 w-full rounded-xl px-4 py-2.5 font-semibold transition ${
              enabled
                ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {enabled ? "Disable Workflow" : "Enable Workflow"}
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">
          Workflow execution
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          To view execution history, open the Executions page. Manual
          execution requires a dedicated backend endpoint; this page does
          not send a fake execution request.
        </p>

        <Link
          to="/executions"
          className="mt-4 inline-flex rounded-xl bg-amber-100 px-4 py-2.5 font-semibold text-amber-900 hover:bg-amber-200"
        >
          View Executions
        </Link>
      </section>
    </div>
  );
}

export default WorkflowDetails;
