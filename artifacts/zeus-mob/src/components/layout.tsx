import { Link, useLocation } from "wouter";
import { LayoutDashboard, Server, Settings, Cpu } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/devices", label: "Devices", icon: Server },
  ];

  return (
    <aside className="w-64 bg-[#050508] border-r border-white/5 h-screen flex flex-col hidden md:flex sticky top-0 shrink-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.3)]">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black text-xl tracking-widest text-white">ZEUS<span className="text-primary">MOB</span></span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,136,0.1)]' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white cursor-pointer transition-colors font-mono text-sm">
          <Settings className="w-4 h-4" />
          System Config
        </div>
        <div className="mt-4 px-4 py-2 bg-black/40 rounded-lg border border-white/5">
          <div className="text-[10px] text-muted-foreground font-mono mb-1">SYSTEM STATUS</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,136,0.8)] animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-primary">OPERATIONAL</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground dark">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
