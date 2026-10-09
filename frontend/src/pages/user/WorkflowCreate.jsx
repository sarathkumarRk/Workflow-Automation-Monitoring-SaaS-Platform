
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Workflow,
  Zap,
  GitBranch,
  ListChecks,
  Plus,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import API from "../../api/axios";

const steps = [
  { title: "Basic Details", icon: Workflow },
  { title: "Trigger", icon: Zap },
  { title: "Conditions", icon: GitBranch },
  { title: "Actions", icon: ListChecks },
];

function WorkflowCreate() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [triggerType, setTriggerType] = useState("manual");
  const [triggerConfig, setTriggerConfig] = useState({
    interval_minutes: 60,
    secret: "",
  });

  const [conditions, setConditions] = useState([]);
  const [actions, setActions] = useState([
    {
      action_type: "send_email",
      config: {
        to: "",
        subject: "",
        body: "",
      },
    },
  ]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      is_enabled: true,
    },
    mode: "onTouched",
  });

  const nextStep = async () => {
    if (currentStep === 0) {
      const valid = await trigger(["name", "description"]);

      if (!valid) return;
    }

    if (currentStep === 1 && triggerType === "scheduled") {
      if (
        !Number.isInteger(Number(triggerConfig.interval_minutes)) ||
        Number(triggerConfig.interval_minutes) < 1
      ) {
        toast.error("Interval must be at least 1 minute.");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const previousStep = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const addCondition = () => {
    setConditions((items) => [
      ...items,
      {
        field: "status",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const updateCondition = (index, key, value) => {
    setConditions((items) =>
      items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      )
    );
  };

  const removeCondition = (index) => {
    setConditions((items) => items.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions((items) => [
      ...items,
      {
        action_type: "send_email",
        config: { to: "", subject: "", body: "" },
      },
    ]);
  };

  const updateActionType = (index, actionType) => {
    const defaultConfig =
      actionType === "send_email"
        ? { to: "", subject: "", body: "" }
        : actionType === "call_webhook"
          ? { url: "", method: "POST" }
          : { status: "" };

    setActions((items) =>
      items.map((item, i) =>
        i === index
          ? { action_type: actionType, config: defaultConfig }
          : item
      )
    );
  };

  const updateActionConfig = (index, key, value) => {
    setActions((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              config: { ...item.config, [key]: value },
            }
          : item
      )
    );
  };

  const removeAction = (index) => {
    setActions((items) => items.filter((_, i) => i !== index));
  };

  const validateActions = () => {
    if (actions.length === 0) {
      toast.error("Add at least one action.");
      return false;
    }

    for (let index = 0; index < actions.length; index++) {
      const action = actions[index];
      const config = action.config;

      if (action.action_type === "send_email") {
        if (!config.to.trim() || !config.subject.trim() || !config.body.trim()) {
          toast.error(`Complete all email fields in action ${index + 1}.`);
          return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.to)) {
          toast.error(`Enter a valid email in action ${index + 1}.`);
          return false;
        }
      }

      if (action.action_type === "call_webhook") {
        if (!config.url.trim()) {
          toast.error(`Webhook URL is required in action ${index + 1}.`);
          return false;
        }

        try {
          const url = new URL(config.url);

          if (url.protocol !== "https:" && url.protocol !== "http:") {
            throw new Error("Invalid protocol");
          }
        } catch {
          toast.error(`Enter a valid webhook URL in action ${index + 1}.`);
          return false;
        }
      }

      if (action.action_type === "update_status" && !config.status.trim()) {
        toast.error(`Status is required in action ${index + 1}.`);
        return false;
      }
    }

    return true;
  };

  const onSubmit = async () => {
    if (currentStep !== steps.length - 1) return;

    if (!validateActions()) return;

    const formValues = getValues();

    setSaving(true);

    try {
      // Current backend endpoint creates the workflow itself.
      const response = await API.post("/workflows/", {
        name: formValues.name.trim(),
        description: formValues.description.trim() || null,
        is_enabled: formValues.is_enabled,
      });

      const workflow = response.data;

      /*
       * Trigger, condition and action configuration must be saved
       * using corresponding backend endpoints. Those endpoints are
       * not present in the workflow router code shared so far.
       */
      const draftConfiguration = {
        workflow_id: workflow.id,
        trigger: {
          trigger_type: triggerType,
          config:
            triggerType === "scheduled"
              ? {
                  interval_minutes: Number(
                    triggerConfig.interval_minutes
                  ),
                }
              : triggerType === "webhook"
                ? { secret: triggerConfig.secret }
                : {},
        },
        conditions: conditions.map((condition) => ({
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
        })),
        actions,
      };

      // Configuration is kept in memory only; it is not persisted.
      console.info("Workflow configuration awaiting backend APIs:", draftConfiguration);

      toast.success(
        "Workflow created. Trigger, conditions and actions still need backend APIs to be saved."
      );

      navigate(`/workflows/${workflow.id}`);
    } catch (error) {
      const detail = error.response?.data?.detail;

      toast.error(
        typeof detail === "string"
          ? detail
          : "Unable to create workflow."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/workflows"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft size={17} />
          Back to workflows
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            WORKFLOW BUILDER
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Create Workflow
          </h1>
          <p className="mt-2 text-slate-500">
            Configure the trigger, conditions, and actions for your workflow.
          </p>
        </div>

        {/* Step indicator */}
        <nav
          aria-label="Workflow creation steps"
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = index === currentStep;
            const completed = index < currentStep;

            return (
              <div
                key={step.title}
                className={`rounded-xl border p-3 ${
                  active
                    ? "border-indigo-500 bg-indigo-50"
                    : completed
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      active
                        ? "bg-indigo-600 text-white"
                        : completed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {completed ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          noValidate
        >
          {/* Step 1: Basic details */}
          {currentStep === 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Basic Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Give your workflow a name and description.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Workflow name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    {...register("name", {
                      required: "Workflow name is required.",
                      minLength: {
                        value: 3,
                        message: "Use at least 3 characters.",
                      },
                    })}
                    placeholder="Example: Order Notification"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register("description", {
                      maxLength: {
                        value: 500,
                        message: "Description cannot exceed 500 characters.",
                      },
                    })}
                    placeholder="Describe what this workflow does..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    {...register("is_enabled")}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  Enable workflow immediately after creation
                </label>
              </div>
            </section>
          )}

          {/* Step 2: Trigger */}
          {currentStep === 1 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Choose a Trigger
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select what starts this workflow.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    value: "manual",
                    title: "Manual",
                    description: "Start the workflow manually.",
                  },
                  {
                    value: "scheduled",
                    title: "Scheduled",
                    description: "Run at a configured interval.",
                  },
                  {
                    value: "webhook",
                    title: "Incoming Webhook",
                    description: "Start from an external HTTP request.",
                  },
                ].map((trigger) => (
                  <button
                    type="button"
                    key={trigger.value}
                    onClick={() => setTriggerType(trigger.value)}
                    aria-pressed={triggerType === trigger.value}
                    className={`rounded-xl border p-4 text-left transition ${
                      triggerType === trigger.value
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <Zap
                      size={22}
                      className={
                        triggerType === trigger.value
                          ? "text-indigo-600"
                          : "text-slate-500"
                      }
                    />
                    <h3 className="mt-3 font-semibold text-slate-900">
                      {trigger.title}
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-slate-500">
                      {trigger.description}
                    </p>
                  </button>
                ))}
              </div>

              {triggerType === "scheduled" && (
                <div className="mt-6">
                  <label
                    htmlFor="interval"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Interval in minutes <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="interval"
                    type="number"
                    min="1"
                    value={triggerConfig.interval_minutes}
                    onChange={(event) =>
                      setTriggerConfig((config) => ({
                        ...config,
                        interval_minutes: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {triggerType === "webhook" && (
                <div className="mt-6">
                  <label
                    htmlFor="webhook-secret"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Webhook secret <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="webhook-secret"
                    type="password"
                    autoComplete="new-password"
                    value={triggerConfig.secret}
                    onChange={(event) =>
                      setTriggerConfig((config) => ({
                        ...config,
                        secret: event.target.value,
                      }))
                    }
                    placeholder="Enter a strong secret"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    This secret must be saved in the backend trigger
                    configuration before the webhook can be used.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Step 3: Conditions */}
          {currentStep === 2 && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Configure Conditions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    All configured conditions must match before actions run.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addCondition}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus size={17} />
                  Add condition
                </button>
              </div>

              {conditions.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                  <GitBranch className="mx-auto text-slate-400" size={30} />
                  <p className="mt-3 font-medium text-slate-700">
                    No conditions added
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Conditions are optional. You can continue without them.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">
                          Condition {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          aria-label={`Remove condition ${index + 1}`}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label
                            htmlFor={`condition-field-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Field
                          </label>
                          <select
                            id={`condition-field-${index}`}
                            value={condition.field}
                            onChange={(event) =>
                              updateCondition(index, "field", event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          >
                            <option value="status">Status</option>
                            <option value="amount">Amount</option>
                            <option value="name">Name</option>
                            <option value="text">Text</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`condition-operator-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Operator
                          </label>
                          <select
                            id={`condition-operator-${index}`}
                            value={condition.operator}
                            onChange={(event) =>
                              updateCondition(
                                index,
                                "operator",
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not equals</option>
                            <option value="greater_than">Greater than</option>
                            <option value="less_than">Less than</option>
                            <option value="contains">Contains</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`condition-value-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Value
                          </label>
                          <input
                            id={`condition-value-${index}`}
                            value={condition.value}
                            onChange={(event) =>
                              updateCondition(index, "value", event.target.value)
                            }
                            placeholder="Enter value"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Step 4: Actions */}
          {currentStep === 3 && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Configure Actions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Actions execute in the order shown.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addAction}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus size={17} />
                  Add action
                </button>
              </div>

              <div className="mt-6 space-y-5">
                {actions.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-800">
                        Action {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        aria-label={`Remove action ${index + 1}`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <label
                      htmlFor={`action-type-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Action type <span className="text-red-500">*</span>
                    </label>

                    <select
                      id={`action-type-${index}`}
                      value={action.action_type}
                      onChange={(event) =>
                        updateActionType(index, event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-3"
                    >
                      <option value="send_email">Send Email</option>
                      <option value="call_webhook">Call Webhook</option>
                      <option value="update_status">Update Status</option>
                    </select>

                    {action.action_type === "send_email" && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor={`action-email-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Recipient email *
                          </label>
                          <input
                            id={`action-email-${index}`}
                            type="email"
                            value={action.config.to}
                            onChange={(event) =>
                              updateActionConfig(index, "to", event.target.value)
                            }
                            placeholder="recipient@example.com"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`action-subject-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Subject *
                          </label>
                          <input
                            id={`action-subject-${index}`}
                            value={action.config.subject}
                            onChange={(event) =>
                              updateActionConfig(
                                index,
                                "subject",
                                event.target.value
                              )
                            }
                            placeholder="Email subject"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`action-body-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Message *
                          </label>
                          <textarea
                            id={`action-body-${index}`}
                            rows={3}
                            value={action.config.body}
                            onChange={(event) =>
                              updateActionConfig(
                                index,
                                "body",
                                event.target.value
                              )
                            }
                            placeholder="Enter email message"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          />
                        </div>
                      </div>
                    )}

                    {action.action_type === "call_webhook" && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor={`action-url-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            Webhook URL *
                          </label>
                          <input
                            id={`action-url-${index}`}
                            type="url"
                            value={action.config.url}
                            onChange={(event) =>
                              updateActionConfig(index, "url", event.target.value)
                            }
                            placeholder="https://example.com/webhook"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`action-method-${index}`}
                            className="mb-1 block text-sm text-slate-600"
                          >
                            HTTP method
                          </label>
                          <select
                            id={`action-method-${index}`}
                            value={action.config.method}
                            onChange={(event) =>
                              updateActionConfig(
                                index,
                                "method",
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {action.action_type === "update_status" && (
                      <div className="mt-4">
                        <label
                          htmlFor={`action-status-${index}`}
                          className="mb-1 block text-sm text-slate-600"
                        >
                          New status *
                        </label>
                        <input
                          id={`action-status-${index}`}
                          value={action.config.status}
                          onChange={(event) =>
                            updateActionConfig(
                              index,
                              "status",
                              event.target.value
                            )
                          }
                          placeholder="Example: completed"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {actions.length === 0 && (
                <p className="mt-5 text-sm text-red-600" role="alert">
                  Add at least one action before saving.
                </p>
              )}
            </section>
          )}

          {/* Navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={previousStep}
              disabled={currentStep === 0 || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={17} />
              Previous
            </button>

            <p className="text-sm text-slate-500">
              Step {currentStep + 1} of {steps.length}
            </p>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
              >
                Next
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                {saving ? "Creating..." : "Create Workflow"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

export default WorkflowCreate;
