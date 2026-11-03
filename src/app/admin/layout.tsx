import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Extra layer of security (Middleware should catch this, but double-check)
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#F9F9F9]">
      
      {/* Sidebar - Extracted to Client Component for active link states */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-auto">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-display font-bold text-gray-800">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            <div className="w-10 h-10 bg-[var(--brand-maroon)] rounded-full flex items-center justify-center text-white font-bold">
              {session.user.name?.charAt(0) || "A"}
            </div>
            
            {/* Logout Button */}
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}>
              <button 
                type="submit" 
                className="ml-4 text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider transition"
              >
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
