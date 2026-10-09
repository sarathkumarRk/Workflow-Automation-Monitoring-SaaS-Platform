
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { LockKeyhole, Mail, Workflow } from "lucide-react";

import API from "../../api/axios";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const token = response.data.access_token;

      localStorage.setItem("access_token", token);

      const meResponse = await API.get("/auth/me");
      const user = meResponse.data;

      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_name", user.name);
      localStorage.setItem("user_email", user.email);

      toast.success("Login successful!");

      const requestedPath = location.state?.from?.pathname;

      if (requestedPath && requestedPath !== "/login") {
        navigate(requestedPath, { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      const message =
        error.response?.data?.detail || "Login failed. Please try again.";

      toast.error(
        typeof message === "string" ? message : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        <div className="hidden flex-col justify-center bg-slate-900 p-10 text-white md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500 p-3">
              <Workflow size={28} />
            </div>
            <h1 className="text-2xl font-bold">FlowMonitor</h1>
          </div>

          <h2 className="mb-4 text-4xl font-bold leading-tight">
            Automate workflows.
            <br />
            Monitor everything.
          </h2>

          <p className="leading-7 text-slate-300">
            Create workflows, automate repetitive tasks, and monitor
            every execution from one place.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to your Workflow Automation account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <Mail size={18} className="text-slate-400" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  className="w-full px-3 py-3 outline-none"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
              </div>

              {errors.email && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <LockKeyhole size={18} className="text-slate-400" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  className="w-full px-3 py-3 outline-none"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="whitespace-nowrap text-xs font-medium text-indigo-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
