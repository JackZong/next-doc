'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserStore } from '@/stores/user-store';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import { authClient } from '@/lib/auth/auth-client';
import { toast } from 'sonner';

interface HeaderProps {
  projectLogo?: string;
  projectTitle?: string;
}

export function Header({ projectLogo, projectTitle }: HeaderProps) {
  const t = useTranslations('Navigation');
  const authT = useTranslations('Auth');
  const homeT = useTranslations('HomePage');
  const commonT = useTranslations('Common');
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      logout();
      toast.success(authT('logout') + ' ' + commonT('success'));
      router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
      toast.error(authT('logout') + ' ' + commonT('error'));
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            {projectLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={projectLogo} alt={projectTitle} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <Logo />
                <span className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                  {projectTitle || commonT('title')}
                </span>
              </>
            )}
          </Link>
        </div>

        {/* 导航 */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {homeT('allProjects')}
          </Link>
          {isAuthenticated && (
            <Link 
              href={{ pathname: '/', query: { mine: 'true' } }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {homeT('myProjects')}
            </Link>
          )}
        </nav>

        {/* 用户区域 */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent"
                onClick={() => router.push('/projects/new')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {homeT('newProject')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => router.push('/user/profile')}
                  >
                    {t('profile')}
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => router.push('/admin')}
                    >
                      {t('admin')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                    onClick={handleLogout}
                  >
                    {authT('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => router.push('/login')}
              >
                {authT('login')}
              </Button>
              <Button
                size="sm"
                className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => router.push('/register')}
              >
                {authT('register')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
