'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Home, Menu, LayoutDashboard, Users, FolderKanban, Paperclip, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const t = useTranslations('Admin');
  const nt = useTranslations('Admin.sidebar');
  const pathname = usePathname();

  const navItems = [
    { title: nt('dashboard'), href: '/admin', icon: LayoutDashboard },
    { title: nt('users'), href: '/admin/users', icon: Users },
    { title: nt('projects'), href: '/admin/projects', icon: FolderKanban },
    { title: nt('attachments'), href: '/admin/attachments', icon: Paperclip },
    { title: nt('configure'), href: '/admin/configure', icon: Settings },
  ];

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-50">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 移动端菜单 */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-card border-border p-0">
                <SheetHeader className="p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <SheetTitle className="text-lg font-bold text-foreground text-left">
                      {t('subtitle')}
                    </SheetTitle>
                  </div>
                </SheetHeader>
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
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
              </SheetContent>
            </Sheet>
          </div>

          <Logo size="sm" className="hidden sm:flex" />
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground leading-tight">{t('title')}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <Home className="h-4 w-4" />
              {t('backToHome')}
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground">
              <Home className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Avatar className="size-8 sm:size-9">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
