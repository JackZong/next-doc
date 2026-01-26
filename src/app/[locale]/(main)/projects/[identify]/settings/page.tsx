'use client';

import { use, useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectSettingsBasic } from '@/components/project/project-settings-basic';
import { ProjectSettingsMembers } from '@/components/project/project-settings-members';
import { useProjectStore } from '@/stores/project-store';
import { ChevronLeft, Settings, Users, Info } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectSettingsPage({ params }: { params: Promise<{ identify: string }> }) {
  const { identify } = use(params);
  const { currentProject, fetchProject, isLoading } = useProjectStore();
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (identify && (!currentProject || currentProject.identify !== identify)) {
      fetchProject(identify);
    }
  }, [identify, fetchProject, currentProject]);

  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 bg-muted" />
            <Skeleton className="h-[400px] w-full bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header projectLogo={currentProject?.logo} projectTitle={currentProject?.name} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 返回链接 - 贴左显示，与顶部 Logo 对齐 */}
        <Link 
          href={`/projects/${identify}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors mb-6 w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          返回项目
        </Link>

        {/* 居中布局容器 */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              项目设置
            </h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-muted border border-border p-1">
              <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 px-6">
                <Info className="h-4 w-4" />
                基本设置
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 px-6">
                <Users className="h-4 w-4" />
                成员管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="m-0 focus-visible:outline-none">
              <ProjectSettingsBasic identify={identify} />
            </TabsContent>
            
            <TabsContent value="members" className="m-0 focus-visible:outline-none">
              <ProjectSettingsMembers identify={identify} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
