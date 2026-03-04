import { SidebarNav } from '@/components/layout/sidebar-nav';

export function Sidebar() {
  return (
    <aside className="bg-background hidden w-64 shrink-0 border-r md:block">
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </div>
    </aside>
  );
}
