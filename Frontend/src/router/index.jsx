// ─── src/router/index.jsx ─────────────────────────────────────────────────────
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import ErrorPage from "../components/pages/ErrorPage";
import NotFound from "../components/pages/NotFound.jsx";

// Lazy-loaded pages
import { lazy, Suspense } from "react";
import { Spinner } from "../components/ui/Spinner";

const Lazy = (imp) => {
     const C = lazy(imp);
     return (props) => <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Spinner /></div>}><C {...props} /></Suspense>;
};

const AllSavesPage = Lazy(() => import("../features/saves/pages/AllSavesPage"));
const FavoritesPage = Lazy(() => import("../features/saves/pages/FavoritesPage.jsx"));
const ArchivePage = Lazy(() => import("../features/saves/pages/ArchivePage.jsx"));
const GraphPage = Lazy(() => import("../features/graph/pages/GraphPage"));
const ClustersPage = Lazy(() => import("../features/clusters/pages/ClustersPage"));
const CollectionPage = Lazy(() => import("../features/collections/pages/CollectionPage"));
const TagPage = Lazy(() => import("../features/tags/pages/TagPage"));
const SettingsPage = Lazy(() => import("../features/user/pages/SettingsPage"));
const LoginPage = Lazy(() => import("../features/auth/pages/LoginPage"));
const SignupPage = Lazy(() => import("../features/auth/pages/SignupPage"));
const VerifyOTPPage = Lazy(() => import("../features/auth/pages/VerifyOTPPage"));
const ForgotPasswordPage = Lazy(() => import("../features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = Lazy(() => import("../features/auth/pages/ResetPasswordPage"));

export const router = createBrowserRouter([
     {
          path: "/",
          element: <AppLayout />,
          errorElement: <ErrorPage />,
          children: [
               { index: true, element: <AllSavesPage /> },
               { path: "favorites", element: <FavoritesPage /> },
               { path: "archive", element: <ArchivePage /> },
               { path: "graph", element: <GraphPage /> },
               { path: "clusters", element: <ClustersPage /> },
               { path: "collections/:id", element: <CollectionPage /> },
               { path: "tags/:id", element: <TagPage /> },
               { path: "settings", element: <SettingsPage /> },
          ],
     },
     {
          element: <AuthLayout />,
          children: [
               { path: "login", element: <LoginPage /> },
               { path: "signup", element: <SignupPage /> },
               { path: "verify-otp", element: <VerifyOTPPage /> },
               { path: "forgot-password", element: <ForgotPasswordPage /> },
               { path: "reset-password/:token", element: <ResetPasswordPage /> },
          ],
     },
     { path: "*", element: <NotFound /> },
]);
