import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getDb } from '@/lib/db';
import { documents, projects, users } from '@/lib/db/schema/sqlite';
import * as schema from '@/lib/db/schema/sqlite';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
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
  const db = await getDb();
  const _db = db as unknown as LibSQLDatabase<typeof schema>;

  // 1. Get Project id first
  const projectList = await _db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.identify, identify));
  const project = projectList[0];

  if (!project) return { title: 'Document Not Found' };

  // 2. Get Document title
  const docList = await _db
    .select({ title: documents.title })
    .from(documents)
    .where(
      and(
        eq(documents.projectId, project.id),
        or(eq(documents.identify, docIdentify), eq(documents.id, docIdentify))
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
  const db = await getDb();
  const _db = db as unknown as LibSQLDatabase<typeof schema>;

  // 1. Get Project
  const projectList = await _db
    .select({ id: projects.id, editorType: projects.editorType })
    .from(projects)
    .where(eq(projects.identify, identify));
  const project = projectList[0];

  if (!project) notFound();

  // 2. Get Document
  const docList = await _db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      updatedAt: documents.updatedAt,
      viewCount: documents.viewCount,
      authorName: users.name,
      authorAvatar: users.avatar,
    })
    .from(documents)
    .leftJoin(users, eq(documents.authorId, users.id))
    .where(
      and(
        eq(documents.projectId, project.id),
        or(eq(documents.identify, docIdentify), eq(documents.id, docIdentify))
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
