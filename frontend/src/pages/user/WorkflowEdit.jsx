
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, LoaderCircle } from "lucide-react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function WorkflowEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      is_enabled: true,
    },
  });

  useEffect(() => {
    let active = true;

    const fetchWorkflow = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await API.get(`/workflows/${id}`);

        if (active) {
          reset({
            name: response.data.name || "",
            description: response.data.description || "",
            is_enabled: Boolean(response.data.is_enabled),
          });
        }
      } catch (error) {
        if (active) {
          const message =
            error.response?.data?.detail ||
            "Unable to load workflow details.";

          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchWorkflow();

    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      await API.put(`/workflows/${id}`, {
        name: data.name.trim(),
        description: data.description.trim() || null,
        is_enabled: data.is_enabled,
      });

      toast.success("Workflow updated successfully!");
      navigate(`/workflows/${id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update workflow."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-600">
        <LoaderCircle className="animate-spin" size={22} />
        <span>Loading workflow...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">{loadError}</p>

          <button
            onClick={() => navigate("/workflows")}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate(`/workflows/${id}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Workflow
      </button>

      <div>
        <p className="text-sm font-medium text-indigo-600">
          WORKFLOW SETTINGS
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Edit Workflow
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update your workflow name, description, and enabled status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Workflow Name *
          </label>

          <input
            id="name"
            type="text"
            placeholder="Example: Website Form Notification"
            {...register("name", {
              required: "Workflow name is required.",
              minLength: {
                value: 3,
                message: "Name must contain at least 3 characters.",
              },
              maxLength: {
                value: 100,
                message: "Name cannot exceed 100 characters.",
              },
              validate: (value) =>
                value.trim().length > 0 ||
                "Workflow name cannot be empty.",
            })}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Description
          </label>

          <textarea
            id="description"
            rows={4}
            placeholder="Describe what this workflow does..."
            {...register("description", {
              maxLength: {
                value: 500,
                message: "Description cannot exceed 500 characters.",
              },
            })}
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            id="is_enabled"
            type="checkbox"
            {...register("is_enabled")}
            className="mt-1 h-4 w-4 accent-indigo-600"
          />

          <div>
            <label
              htmlFor="is_enabled"
              className="cursor-pointer font-semibold text-slate-800"
            >
              Enable this workflow
            </label>

            <p className="mt-1 text-sm text-slate-500">
              Enabled workflows can run when their configured triggers fire.
              Disabled workflows will not run.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(`/workflows/${id}`)}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkflowEdit;
