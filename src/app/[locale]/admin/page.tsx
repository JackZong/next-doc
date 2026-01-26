import { getTranslations } from 'next-intl/server';
import { DashboardContent } from '@/components/admin/dashboard-content';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const td = await getTranslations({ locale, namespace: 'Admin.dashboard' });

  return {
    title: `${td('title')} - ${t('title')}`,
    description: td('description'),
  };
}

export default function AdminDashboardPage() {
  return <DashboardContent />;
}
