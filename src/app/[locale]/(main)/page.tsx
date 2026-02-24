'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/stores/user-store';
import { useProjectStore, ProjectInfo } from '@/stores/project-store';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { useLocale, useTranslations } from 'next-intl';

// 项目卡片组件
function ProjectCard({ project }: { project: ProjectInfo }) {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const { isAuthenticated } = useUserStore();

  return (
    <Link href={isAuthenticated ? `/projects/${project.identify}` : `/docs/${project.identify}`}>
      <Card className="group h-full bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        {/* 封面 */}
        <div className="relative h-32 overflow-hidden rounded-t-lg bg-muted">
          {project.cover ? (
            <Image 
              src={project.cover} 
              alt={project.name}
              width={400}
              height={200}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
          {/* 可见性标签 */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                project.visibility === 'public' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : project.visibility === 'private'
                    ? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {project.visibility === 'public' 
                ? t('visibilityPublic') 
                : project.visibility === 'private' 
                  ? t('visibilityPrivate') 
                  : t('visibilityPassword')}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {project.name}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm line-clamp-2 h-10">
            {project.description || t('noDescription')}
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {project.ownerName}
          </span>
          <span>
            {new Date(project.createdAt).toLocaleDateString(locale)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

// 加载骨架
function ProjectSkeleton() {
  return (
    <Card className="h-full bg-card border-border">
      <Skeleton className="h-32 rounded-t-lg rounded-b-none bg-muted" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4 bg-muted" />
        <Skeleton className="h-4 w-full mt-2 bg-muted" />
        <Skeleton className="h-4 w-2/3 bg-muted" />
      </CardHeader>
      <CardFooter className="pt-2">
        <Skeleton className="h-4 w-1/4 bg-muted" />
      </CardFooter>
    </Card>
  );
}

export default function HomePage() {
  const t = useTranslations('HomePage');
  const commonT = useTranslations('Common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const { projects, setProjects, isLoading, setLoading } = useProjectStore();
  const [error, setError] = useState('');

  const showMine = searchParams.get('mine') === 'true';

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      
      try {
        const url = showMine ? '/api/projects?mine=true' : '/api/projects';
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || commonT('error'));
          return;
        }

        setProjects(data.projects);
      } catch {
        setError(commonT('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [showMine, setProjects, setLoading, commonT]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {showMine ? t('myProjects') : t('allProjects')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {showMine ? t('myProjectsDesc') : t('allProjectsDesc')}
            </p>
          </div>
          
          {isAuthenticated && (
            <Button
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={() => router.push('/projects/new')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('newProject')}
            </Button>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* 项目列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProjectSkeleton key={i} />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-muted-foreground mb-2">{t('noProjects')}</h3>
            <p className="text-zinc-500 mb-6">
              {showMine ? t('noMyProjectsDesc') : t('noAllProjectsDesc')}
            </p>
            {isAuthenticated && (
              <Button
                className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => router.push('/projects/new')}
              >
                {t('createFirstProject')}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
