"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInventoryStore } from "@/store/use-inventory-store";

type NavbarProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function Navbar({ title, description, actions }: NavbarProps) {
  const refreshAll = useInventoryStore((s) => s.refreshAll);
  const loading = useInventoryStore((s) => s.loading);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshAll()}
          disabled={loading}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
        {actions}
      </div>
    </header>
  );
}
