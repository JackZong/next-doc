'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Settings, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';

interface Project {
  id: string;
  name: string;
  identify: string;
  description: string | null;
  visibility: 'public' | 'private' | 'password' | 'token';
  ownerName: string;
  documentCount: number;
  memberCount: number;
  createdAt: string;
}

export function ProjectManagement() {
  const t = useTranslations('Admin.projects');
  const tc = useTranslations('Common');
  const locale = useLocale();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/projects');
      const data = await res.json();
      
      if (data.success) {
        setProjects(data.projects);
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    try {
      setDeletingId(projectId);
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(t('deleteSuccess', { name: projectName }));
        fetchProjects();
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.identify.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVisibilityBadge = (visibility: string) => {
    const variants = {
      public: 'default',
      private: 'secondary',
      password: 'outline',
      token: 'outline',
    } as const;

    const labels = {
      public: t('visibilityLabels.public'),
      private: t('visibilityLabels.private'),
      password: t('visibilityLabels.password'),
      token: 'Token',
    };

    return (
      <Badge variant={variants[visibility as keyof typeof variants] || 'default'}>
        {labels[visibility as keyof typeof labels] || visibility}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{t('list')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>

          {/* 项目表格 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{tc('loading')}</div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="text-foreground">{t('name')}</TableHead>
                    <TableHead className="text-foreground hidden lg:table-cell">{t('identify')}</TableHead>
                    <TableHead className="text-foreground hidden md:table-cell">{t('owner')}</TableHead>
                    <TableHead className="text-foreground">{t('visibility')}</TableHead>
                    <TableHead className="text-foreground hidden sm:table-cell text-center">{t('documents')}</TableHead>
                    <TableHead className="text-foreground hidden sm:table-cell text-center">{t('members')}</TableHead>
                    <TableHead className="text-foreground hidden xl:table-cell">{t('createTime')}</TableHead>
                    <TableHead className="text-right text-foreground">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? t('noMatchingProjects') : tc('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">
                          <div className="space-y-1">
                            <div className="truncate max-w-[150px] sm:max-w-[200px]">{project.name}</div>
                            {project.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground hidden lg:table-cell">
                          {project.identify}
                        </TableCell>
                        <TableCell className="text-foreground text-sm hidden md:table-cell">{project.ownerName}</TableCell>
                        <TableCell>{getVisibilityBadge(project.visibility)}</TableCell>
                        <TableCell className="text-muted-foreground text-center hidden sm:table-cell">{project.documentCount}</TableCell>
                        <TableCell className="text-muted-foreground text-center hidden sm:table-cell">{project.memberCount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden xl:table-cell">
                          {new Date(project.createdAt).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/projects/${project.identify}`} target="_blank">
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                {t('view')}
                              </Button>
                            </Link>
                            <Link href={`/projects/${project.identify}/settings`} target="_blank">
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Settings className="h-4 w-4" />
                                {t('settings')}
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="gap-2 text-destructive hover:text-destructive"
                                  disabled={deletingId === project.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t('delete')}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                    <Trash2 className="h-5 w-5" />
                                    {t('confirmDeleteTitle')}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    {t('confirmDeleteDesc')}
                                    <br /><br />
                                    {t('name')}: <span className="font-mono font-semibold text-foreground">{project.name}</span>
                                    <br />
                                    {t('identify')}: <span className="font-mono font-semibold text-foreground">{project.identify}</span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border">{tc('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteProject(project.id, project.name)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    {tc('confirm')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
