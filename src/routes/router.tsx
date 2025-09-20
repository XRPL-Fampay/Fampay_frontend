import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { lazy, Suspense } from "react";

// home
import Home from "@/pages/home";
// not found
import NotFound from "@/pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
