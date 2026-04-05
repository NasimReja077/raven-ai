// ─── src/components/pages/NotFound.jsx ───────────────────────────────────────
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
     
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <h1 className="text-7xl font-black text-foreground/10 mb-4">404</h1>
      <h2 className="text-xl font-bold text-foreground mb-2">Page not found</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Even Raven couldn't find this page.
      </p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
