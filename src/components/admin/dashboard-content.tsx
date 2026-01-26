'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Users, FolderKanban, Paperclip, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

interface Stats {
  totalProjects: number;
  totalUsers: number;
  totalAttachments: number;
  activeUsers: number;
  roleStats: Record<string, number>;
  visibilityStats: Record<string, number>;
}

interface RecentProject {
  id: string;
  name: string;
  identify: string;
  visibility: string;
  createdAt: string;
  ownerName: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function DashboardContent() {
  const t = useTranslations('Admin.dashboard');
  const tc = useTranslations('Common');
  const tr = useTranslations('Admin.roles');
  const locale = useLocale();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setRecentProjects(data.recentActivities.projects);
        setRecentUsers(data.recentActivities.users);
      } else {
        toast.error(data.error || t('errorFetch'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setLoading(false);
    }
  }, [t, tc]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getVisibilityBadge = (visibility: string) => {
    const variants = {
      public: 'default',
      private: 'secondary',
      password: 'outline',
      token: 'outline',
    } as const;

    const labels = {
      public: tc('visibilityPublic'),
      private: tc('visibilityPrivate'),
      password: tc('visibilityPassword'),
      token: 'Token',
    };

    return (
      <Badge variant={variants[visibility as keyof typeof variants] || 'default'}>
        {labels[visibility as keyof typeof labels] || visibility}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      editor: 'default',
      viewer: 'secondary',
    } as const;

    const labels = {
      admin: tr('admin'),
      editor: tr('editor'),
      viewer: tr('viewer'),
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('totalProjects')}</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '-' : stats?.totalProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {t('allProjectsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '-' : stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {t('allUsersDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('totalAttachments')}</CardTitle>
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '-' : stats?.totalAttachments || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {t('allAttachmentsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t('activeUsers')}</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '-' : stats?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {t('activeUsersDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近活动 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 最近创建的项目 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('recentProjects')}</CardTitle>
            <CardDescription className="text-muted-foreground">{t('projectsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{tc('loading')}</p>
            ) : recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noProjects')}</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Link 
                        href={`/projects/${project.identify}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(project.createdAt).toLocaleDateString(locale)}
                        <span>·</span>
                        {project.ownerName}
                      </p>
                    </div>
                    {getVisibilityBadge(project.visibility)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近注册的用户 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('recentUsers')}</CardTitle>
            <CardDescription className="text-muted-foreground">{t('usersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{tc('loading')}</p>
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noUsers')}</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString(locale)}
                        <span>·</span>
                        {user.email}
                      </p>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
