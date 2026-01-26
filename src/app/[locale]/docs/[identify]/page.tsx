import { redirect, notFound } from 'next/navigation';
import { getDb, getSchema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

interface DocsIndexParams {
  params: Promise<{ identify: string }>;
}

export default async function DocsIndexPage({ params }: DocsIndexParams) {
  const { identify } = await params;
  const db = (await getDb()) as any;
  const schema = getSchema();

  const projectList = await db
    .select({ id: (schema.projects as any).id })
    .from(schema.projects)
    .where(eq((schema.projects as any).identify, identify));
  const project = projectList[0];

  if (!project) notFound();

  const firstDocList = await db
    .select({ identify: (schema.documents as any).identify, id: (schema.documents as any).id })
    .from(schema.documents)
    .where(eq((schema.documents as any).projectId, project.id))
    .orderBy(asc((schema.documents as any).sort), asc((schema.documents as any).createdAt))
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
