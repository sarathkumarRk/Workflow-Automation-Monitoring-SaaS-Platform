
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Workflow,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";

import API from "../../api/axios";

function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
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

      const workflowData = workflowResponse.data;
      const executionData = executionResponse.data;

      setWorkflows(
        Array.isArray(workflowData)
          ? workflowData
          : workflowData.items || []
      );

      setExecutions(
        Array.isArray(executionData)
          ? executionData
          : executionData.items || []
      );
    } catch (err) {
      const message =
        err.response?.data?.detail || "Unable to load dashboard data.";

      setError(
        typeof message === "string" ? message : "Unable to load dashboard."
      );
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
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
      title: "Total Workflows",
      value: workflows.length,
      icon: Workflow,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Active Workflows",
      value: activeWorkflows,
      icon: Activity,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Successful Executions",
      value: successfulExecutions,
      icon: CheckCircle2,
      color: "bg-sky-100 text-sky-700",
    },
    {
      title: "Failed Executions",
      value: failedExecutions,
      icon: XCircle,
      color: "bg-rose-100 text-rose-700",
    },
  ];

  // Group execution records by date for the trend chart.
  const trendMap = {};

  executions.forEach((execution) => {
    const dateValue =
      execution.created_at || execution.started_at;

    if (!dateValue) return;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);

    if (!trendMap[key]) {
      trendMap[key] = {
        date: key,
        successful: 0,
        failed: 0,
      };
    }

    if (execution.status === "SUCCESS") {
      trendMap[key].successful += 1;
    }

    if (execution.status === "FAILED") {
      trendMap[key].failed += 1;
    }
  });

  const trendData = Object.values(trendMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((item) => ({
      ...item,
      date: new Date(`${item.date}T00:00:00`).toLocaleDateString(
        "en-IN",
        { day: "2-digit", month: "short" }
      ),
    }));

  const statusData = [
    { name: "Successful", value: successfulExecutions },
    { name: "Failed", value: failedExecutions },
  ];

  const COLORS = ["#10b981", "#f43f5e"];

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <RefreshCw size={26} className="animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              WORKSPACE OVERVIEW
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-slate-500">
              Monitor your workflows and execution activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchDashboard}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <Link
              to="/workflows/create"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Create Workflow
            </Link>
          </div>
        </header>

        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchDashboard}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <section
          aria-label="Workflow statistics"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                </div>

                <p className="mt-5 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </article>
            );
          })}
        </section>

        {/* Charts */}
        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">
              Execution Trends
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Successful and failed executions by day, based on loaded records.
            </p>

            <div className="mt-6 h-72 w-full">
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No execution trend data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="successful"
                      name="Successful"
                      stroke="#10b981"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="#f43f5e"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Success vs Failure
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Execution status distribution.
            </p>

            <div className="mt-6 h-64 w-full">
              {successfulExecutions + failedExecutions === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                  No completed executions available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.filter((item) => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {statusData
                        .filter((item) => item.value > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === "Successful"
                                ? COLORS[0]
                                : COLORS[1]
                            }
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>
        </section>

        {/* Recent executions */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Executions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest execution records returned by the API.
              </p>
            </div>

            <Link
              to="/executions"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {executions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <Activity className="mx-auto text-slate-400" size={30} />
              <p className="mt-3 font-medium text-slate-700">
                No executions yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Run a workflow to see execution activity here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="px-3 py-3 font-medium">Execution ID</th>
                    <th className="px-3 py-3 font-medium">Workflow ID</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Created At</th>
                    <th className="px-3 py-3 font-medium">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {[...executions]
                    .sort(
                      (a, b) =>
                        new Date(b.created_at || b.started_at || 0) -
                        new Date(a.created_at || a.started_at || 0)
                    )
                    .slice(0, 5)
                    .map((execution) => (
                      <tr
                        key={execution.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-4 font-semibold text-slate-800">
                          #{execution.id}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          #{execution.workflow_id}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              execution.status === "SUCCESS"
                                ? "bg-emerald-100 text-emerald-700"
                                : execution.status === "FAILED"
                                  ? "bg-rose-100 text-rose-700"
                                  : execution.status === "RUNNING"
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {execution.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-600">
                          {execution.created_at
                            ? new Date(execution.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-3 py-4">
                          <Link
                            to={`/executions/${execution.id}`}
                            className="font-semibold text-indigo-600 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
