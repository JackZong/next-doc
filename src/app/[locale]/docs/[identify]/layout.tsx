import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDbSync, getSchema } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';
import { DocsHeader } from '@/components/docs/docs-header';
import { DocsLayoutWrapper } from '@/components/docs/docs-layout-wrapper';
import { DocumentTreeNode } from '@/stores/document-store';
import { getCurrentUser } from '@/lib/auth';

interface DocsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ identify: string }>;
}

export async function generateMetadata({ params }: DocsLayoutProps): Promise<Metadata> {
  const { identify } = await params;
  const db = getDbSync() as any;
  const schema = getSchema();

  const projectList = await db
    .select({ favicon: (schema.projects as any).favicon })
    .from(schema.projects)
    .where(eq((schema.projects as any).identify, identify));
    
  const project = projectList[0];

  if (project?.favicon) {
    return {
      icons: {
        icon: project.favicon,
      },
    };
  }

  return {};
}

export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const { identify } = await params;
  const db = getDbSync() as any;
  const schema = getSchema();

  const projectList = await db
    .select()
    .from(schema.projects)
    .where(eq((schema.projects as any).identify, identify));
    
  const project = projectList[0];

  if (!project) {
    notFound();
  }

  // ============================================
  // 权限验证
  // ============================================
  let hasAccess = false;
  const visibility = project.visibility;

  if (visibility === 'public') {
    hasAccess = true;
  } else if (visibility === 'token') {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(`access_token_${identify}`)?.value;
    if (tokenCookie && tokenCookie === project.accessToken) {
      hasAccess = true;
    }
  } else if (visibility === 'password') {
    // 密码访问暂未完全实现，后续需要从 Cookie Read Project Password
    hasAccess = false; 
  }

  // 如果尚未获得访问权限 (例如 private 或 token/password 验证失败)，尝试检查用户权限
  if (!hasAccess) {
    const user = await getCurrentUser();
    if (user) {
      if (project.ownerId === user.userId) {
        hasAccess = true;
      } else {
        // Check if member
        const memberList = await db
          .select()
          .from(schema.projectMembers)
          .where(
            and(
              eq((schema.projectMembers as any).projectId, project.id),
              eq((schema.projectMembers as any).userId, user.userId)
            )
          )
          .limit(1);
        const member = memberList[0];
        if (member) {
          hasAccess = true;
        }
      }
    }
  }

  if (!hasAccess) {
    // 根据情况处理拒绝访问
    if (visibility === 'private') {
         // 如果是私有项目且用户未登录或无权，跳转登录
         const user = await getCurrentUser();
         if (!user) {
             redirect(`/login?redirect=/docs/${identify}`);
         }
    }
    // 其他情况（Token错误、密码错误、已登录但无权）直接 404 或显示无权
    // 为了安全，通常对不存在或无权的项目显示 404
    notFound();
  }

  const docsList = await db
    .select()
    .from(schema.documents)
    .where(eq((schema.documents as any).projectId, project.id))
    .orderBy(asc((schema.documents as any).sort), asc((schema.documents as any).createdAt));

  // Build tree
  type Doc = any;
  const buildTree = (parentId: string | null): DocumentTreeNode[] => {
    return (docsList as Doc[])
      .filter((doc: Doc) => doc.parentId === parentId)
      .map((doc: Doc) => ({
        ...doc,
        children: buildTree(doc.id),
      })) as DocumentTreeNode[];
  };

  const documentTree = buildTree(null);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DocsHeader 
        projectLogo={project.logo || undefined} 
        projectName={project.name} 
      />
      <DocsLayoutWrapper 
        documents={documentTree} 
        projectIdentify={identify}
      >
         {children}
      </DocsLayoutWrapper>
    </div>
  );
}
