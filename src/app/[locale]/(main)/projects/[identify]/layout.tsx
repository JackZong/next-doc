import { Metadata } from 'next';
import {  getDbSync, getSchema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ identify: string }> 
}): Promise<Metadata> {
  // 解析参数
  const resolvedParams = await params;
  const { identify } = resolvedParams;
  
  try {
    const db = getDbSync() as any;
    const schema = getSchema();
    
    // 查询项目信息
    const projectList = await db
      .select({
        name: (schema.projects as any).name,
        description: (schema.projects as any).description,
        favicon: (schema.projects as any).favicon,
      })
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);

    const project = projectList[0];

    if (!project) {
      return {
        title: 'NextDoc',
      };
    }

    const title = `${project.name} - NextDoc`;
    
    return {
      title,
      description: project.description || '项目文档管理系统',
      icons: project.favicon ? {
        icon: project.favicon,
        shortcut: project.favicon,
      } : undefined,
    };
  } catch (error) {
    console.error('Generate metadata error:', error);
    return {
      title: 'NextDoc',
    };
  }
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
