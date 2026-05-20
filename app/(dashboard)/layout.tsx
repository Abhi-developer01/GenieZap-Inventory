import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
