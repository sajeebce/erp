import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-dvh overflow-hidden">
        <div data-print-hide="true"><TopNavbar /></div>
        <main className="min-h-0 flex-1 overflow-y-auto p-6 animate-fade-in">{children}</main>
      </SidebarInset>
      <div data-print-hide="true"><CommandPalette /></div>
    </SidebarProvider>
  );
}
