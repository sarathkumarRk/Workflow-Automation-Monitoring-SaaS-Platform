
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Dashboard from "../pages/user/Dashboard";
import Workflows from "../pages/user/Workflows";
import WorkflowCreate from "../pages/user/WorkflowCreate";
import WorkflowEdit from "../pages/user/WorkflowEdit";
import WorkflowDetails from "../pages/user/WorkflowDetails";
import Executions from "../pages/user/Executions";
import ExecutionDetails from "../pages/user/ExecutionDetails";

import AdminDashboard from "../pages/admin/AdminDashboard";

function AppRoutes() {
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("user_role") || "").toUpperCase();

  const defaultPath = token
    ? role === "ADMIN"
      ? "/admin/dashboard"
      : "/dashboard"
    : "/login";

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={<Navigate to={defaultPath} replace />}
        />

        <Route
          path="/login"
          element={
            token ? (
              <Navigate to={defaultPath} replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            token ? (
              <Navigate to={defaultPath} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* USER routes */}
        <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/workflows" element={<Workflows />} />

          <Route
            path="/workflows/create"
            element={<WorkflowCreate />}
          />

          <Route
            path="/workflows/:id"
            element={<WorkflowDetails />}
          />

          <Route
            path="/workflows/:id/edit"
            element={<WorkflowEdit />}
          />

          <Route path="/executions" element={<Executions />} />

          <Route
            path="/executions/:id"
            element={<ExecutionDetails />}
          />
        </Route>

        {/* ADMIN routes */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
        </Route>

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to={defaultPath} replace />}
        />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}

export default AppRoutes;
