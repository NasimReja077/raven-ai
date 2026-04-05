// ─── src/components/pages/ErrorPage.jsx ──────────────────────────────────────
import { useRouteError, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  const error = useRouteError();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground mb-2">
        {error?.statusText || error?.message || "An unexpected error occurred"}
      </p>
      <Button asChild className="mt-4">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
