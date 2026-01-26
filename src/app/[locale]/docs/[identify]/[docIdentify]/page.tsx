import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getDb, getSchema } from '@/lib/db';
import { eq, and, or } from 'drizzle-orm';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';


interface DocPageProps {
  params: Promise<{
    identify: string;
    docIdentify: string;
  }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { identify, docIdentify } = await params;
  const db = await getDb() as any;
  const schema = getSchema();

  // 1. Get Project id first
  const projectList = await db
    .select({ id: (schema.projects as any).id })
    .from(schema.projects)
    .where(eq((schema.projects as any).identify, identify));
  const project = projectList[0];

  if (!project) return { title: 'Document Not Found' };

  // 2. Get Document title
  const docList = await db
    .select({ title: (schema.documents as any).title })
    .from(schema.documents)
    .where(
      and(
        eq((schema.documents as any).projectId, project.id),
        or(eq((schema.documents as any).identify, docIdentify), eq((schema.documents as any).id, docIdentify))
      )
    );
  
  const doc = docList[0];

  if (!doc) return { title: 'Document Not Found' };

  return {
    title: doc.title,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { identify, docIdentify } = await params;
  const db = await getDb() as any;
  const schema = getSchema();

  // 1. Get Project
  const projectList = await db
    .select({ id: (schema.projects as any).id, editorType: (schema.projects as any).editorType })
    .from(schema.projects)
    .where(eq((schema.projects as any).identify, identify));
  const project = projectList[0];

  if (!project) notFound();

  // 2. Get Document
  const docList = await db
    .select({
      id: (schema.documents as any).id,
      title: (schema.documents as any).title,
      content: (schema.documents as any).content,
      updatedAt: (schema.documents as any).updatedAt,
      viewCount: (schema.documents as any).viewCount,
      role: (schema.users as any).role,
    })
    .from(schema.documents)
    .leftJoin(schema.users, eq((schema.documents as any).authorId, (schema.users as any).id))
    .where(
      and(
        eq((schema.documents as any).projectId, project.id),
        or(eq((schema.documents as any).identify, docIdentify), eq((schema.documents as any).id, docIdentify))
      )
    );
    
  const doc = docList[0];

  if (!doc) notFound();

  return (
    <div className="w-full px-8 py-12">
        <div className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-8 text-foreground">{doc.title}</h1>
            

        </div>

        <div className="prose dark:prose-invert prose-blue max-w-none">
             {project.editorType === 'richtext' ? (
                <div 
                  className="rich-text-content text-foreground/90 leading-8"
                  dangerouslySetInnerHTML={{ __html: doc.content || '' }} 
                />
             ) : (
                <MarkdownRenderer content={doc.content || ''} />
             )}
        </div>
    </div>
  );
}
