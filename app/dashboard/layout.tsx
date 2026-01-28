// app/dashboard/layout.tsx

import Sidebar from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Zůstává statický */}
      <Sidebar />

      {/* Main Content Area - Scroluje se pouze tento obsah */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header Spacer - Zobrazí se jen na mobilu, aby obsah nebyl pod headerem */}
        <div className="h-16 md:hidden flex-shrink-0" /> 

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-7xl mx-auto scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  )
}
