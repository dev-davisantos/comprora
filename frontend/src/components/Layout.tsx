import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  FolderKanban,
  Building2,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/orcamentos', label: 'Orçamentos', icon: Wallet },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/fornecedores', label: 'Fornecedores', icon: Building2 },
  { to: '/segmentos', label: 'Segmentos', icon: Layers },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:h-screen sm:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-background sm:h-screen sm:w-60 sm:border-b-0 sm:border-r">
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-lg font-bold text-primary">
            Comprora
          </h1>
        </div>

        <nav className="flex flex-row gap-1 overflow-x-auto p-2 sm:flex-1 sm:flex-col sm:overflow-visible">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition-colors sm:flex-row sm:justify-start sm:gap-3 sm:px-3 sm:text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:min-h-0 sm:overflow-auto sm:p-6">
        {children}
      </main>
    </div>
  );
}
