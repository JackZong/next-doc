import { getTranslations } from 'next-intl/server';
import { ConfigureManagement } from '@/components/admin/configure-management';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const tc = await getTranslations({ locale, namespace: 'Admin.configure' });

  return {
    title: `${tc('title')} - ${t('title')}`,
    description: tc('description'),
  };
}

export default function AdminConfigurePage() {
  return <ConfigureManagement />;
}
