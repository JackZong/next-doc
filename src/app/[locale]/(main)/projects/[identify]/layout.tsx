import { Metadata } from 'next';
import { getDbSync } from '@/lib/db';
import { projects } from '@/lib/db/schema/sqlite';
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
    const db = getDbSync();
    
    // 查询项目信息
    const project = await db
      .select({
        name: projects.name,
        description: projects.description,
        favicon: projects.favicon,
      })
      .from(projects)
      .where(eq(projects.identify, identify))
      .get();

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
