'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Paperclip, 
  Settings 
} from 'lucide-react';

export function AdminSidebar() {
  const t = useTranslations('Admin.sidebar');
  const pathname = usePathname();

  const navItems = [
    {
      title: t('dashboard'),
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: t('users'),
      href: '/admin/users',
      icon: Users,
    },
    {
      title: t('projects'),
      href: '/admin/projects',
      icon: FolderKanban,
    },
    {
      title: t('attachments'),
      href: '/admin/attachments',
      icon: Paperclip,
    },
    {
      title: t('configure'),
      href: '/admin/configure',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card min-h-[calc(100vh-64px)] hidden lg:block">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
