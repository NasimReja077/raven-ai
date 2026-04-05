import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background p-10 flex flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-bold text-foreground mb-4">
        Raven AI - UI Test
      </h1>

      <div className="flex flex-wrap gap-4 justify-center">
        <Button>Primary Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      <p className="text-muted-foreground text-center mt-8 max-w-md">
        যদি বাটনগুলো সুন্দর ম্যাজেন্টা কালার + গোলাকার দেখায়, তাহলে তোমার Shadcn + Custom Theme সঠিকভাবে কাজ করছে।
      </p>
    </div>
  );
}

export default App;