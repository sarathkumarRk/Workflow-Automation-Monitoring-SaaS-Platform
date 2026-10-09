
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Workflow,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

import API from "../../api/axios";

function AdminDashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [workflowResponse, executionResponse] = await Promise.all([
        API.get("/workflows/", {
          params: { page: 1, limit: 100 },
        }),
        API.get("/executions/", {
          params: { page: 1, limit: 100 },
        }),
      ]);

      setWorkflows(
        Array.isArray(workflowResponse.data)
          ? workflowResponse.data
          : workflowResponse.data.items || []
      );

      setExecutions(
        Array.isArray(executionResponse.data)
          ? executionResponse.data
          : executionResponse.data.items || []
      );
    } catch (err) {
      const message =
        err.response?.data?.detail || "Unable to load dashboard data.";

      setError(
        typeof message === "string" ? message : "Unable to load dashboard."
      );
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const activeWorkflows = workflows.filter(
    (workflow) => workflow.is_enabled
  ).length;

  const successfulExecutions = executions.filter(
    (execution) => execution.status === "SUCCESS"
  ).length;

  const failedExecutions = executions.filter(
    (execution) => execution.status === "FAILED"
  ).length;

  const stats = [
    {
      label: "Total Workflows",
      value: workflows.length,
      icon: Workflow,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Active Workflows",
      value: activeWorkflows,
      icon: Activity,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Successful Executions",
      value: successfulExecutions,
      icon: CheckCircle2,
      color: "bg-sky-100 text-sky-700",
    },
    {
      label: "Failed Executions",
      value: failedExecutions,
      icon: XCircle,
      color: "bg-rose-100 text-rose-700",
    },
  ];

  if (loading) {
    return (
      <div
        className="flex min-h-64 items-center justify-center"
        role="status"
      >
        <RefreshCw className="animate-spin text-indigo-600" size={28} />
        <span className="ml-3 text-slate-600">
          Loading dashboard...
        </span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              ADMINISTRATION
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-slate-500">
              Monitor workflow and execution activity.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {error && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <section
          aria-label="Dashboard statistics"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </span>
                  <span className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Workflow Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current workflow status
                </p>
              </div>
              <Workflow className="text-indigo-600" size={24} />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Active</span>
                <span className="font-semibold text-emerald-700">
                  {activeWorkflows}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${
                      workflows.length
                        ? (activeWorkflows / workflows.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Disabled</span>
                <span className="font-semibold text-slate-700">
                  {workflows.length - activeWorkflows}
                </span>
              </div>
            </div>

            <Link
              to="/workflows"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View workflows <ArrowRight size={16} />
            </Link>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Execution Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest loaded execution records
                </p>
              </div>
              <Activity className="text-indigo-600" size={24} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Successful</p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">
                  {successfulExecutions}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Failed</p>
                <p className="mt-2 text-2xl font-bold text-rose-800">
                  {failedExecutions}
                </p>
              </div>
            </div>

            <Link
              to="/executions"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View executions <ArrowRight size={16} />
            </Link>
          </article>
        </section>

        {workflows.length === 0 && executions.length === 0 && !error && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Workflow
              size={36}
              className="mx-auto text-slate-400"
            />
            <h2 className="mt-4 font-semibold text-slate-800">
              No dashboard data yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create a workflow and run it to see activity here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;
