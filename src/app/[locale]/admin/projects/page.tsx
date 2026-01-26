import { getTranslations } from 'next-intl/server';
import { ProjectManagement } from '@/components/admin/project-management';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const tp = await getTranslations({ locale, namespace: 'Admin.projects' });

  return {
    title: `${tp('title')} - ${t('title')}`,
    description: tp('description'),
  };
}

export default function AdminProjectsPage() {
  return <ProjectManagement />;
}
