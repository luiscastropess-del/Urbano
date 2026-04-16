// app/admin/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, MessageSquare, Users, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/places', label: 'Lugares', icon: MapPin },
  { href: '/admin/reviews', label: 'Avaliações', icon: MessageSquare },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white/50 backdrop-blur-xl border-r border-white/30 p-6 flex flex-col">
        <h1 className="text-2xl font-black mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Urbano Admin</h1>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="justify-start text-error">
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
