import { redirect, notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { documents, projects } from '@/lib/db/schema/sqlite';
import { eq, asc } from 'drizzle-orm';

interface DocsIndexParams {
  params: Promise<{ identify: string }>;
}

export default async function DocsIndexPage({ params }: DocsIndexParams) {
  const { identify } = await params;
  const db = await getDb();
  const _db = db as any;

  const projectList = await _db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.identify, identify));
  const project = projectList[0];

  if (!project) notFound();

  const firstDocList = await _db
    .select({ identify: documents.identify, id: documents.id })
    .from(documents)
    .where(eq(documents.projectId, project.id))
    .orderBy(asc(documents.sort), asc(documents.createdAt))
    .limit(1);

  const firstDoc = firstDocList[0];

  if (firstDoc) {
    redirect(`/docs/${identify}/${firstDoc.identify || firstDoc.id}`);
  }

  return (
    <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
      No documents found.
    </div>
  );
}
