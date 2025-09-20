import { createBrowserRouter, Navigate } from "react-router";
import { lazy, Suspense } from "react";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Pages
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import CreateGroup from "../pages/group/CreateGroup";
import JoinGroup from "../pages/group/JoinGroup";
import PayDues from "../pages/PayDues";
import DuesManager from "../pages/DuesManager";
import Cashout from "../pages/Cashout";

// Lazy loaded pages
const NotFound = lazy(() => import("../pages/not-found"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if user has wallet and is in group
  const hasWallet = localStorage.getItem('grouppay_wallet');
  const hasGroup = localStorage.getItem('grouppay_group_id');
  
  if (!hasWallet) {
    return <Navigate to="/" replace />;
  }
  
  if (!hasGroup && window.location.pathname !== '/group/create' && window.location.pathname !== '/group/join') {
    return <Navigate to="/group/create" replace />;
  }
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/group",
    children: [
      {
        path: "create",
        element: <CreateGroup />,
      },
      {
        path: "join",
        element: <JoinGroup />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "dues",
        element: <PayDues />,
      },
      {
        path: "escrow",
        element: <DuesManager />,
      },
      {
        path: "cashout",
        element: <Cashout />,
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NotFound />
      </Suspense>
    ),
  },
]);
