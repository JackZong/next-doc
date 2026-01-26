import { getTranslations } from 'next-intl/server';
import { UserManagement } from '@/components/admin/user-management';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const tu = await getTranslations({ locale, namespace: 'Admin.users' });

  return {
    title: `${tu('title')} - ${t('title')}`,
    description: tu('description'),
  };
}

export default function AdminUsersPage() {
  return <UserManagement />;
}
