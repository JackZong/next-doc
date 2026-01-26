import { getTranslations } from 'next-intl/server';
import { AttachmentManagement } from '@/components/admin/attachment-management';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Admin' });
  const ta = await getTranslations({ locale, namespace: 'Admin.attachments' });

  return {
    title: `${ta('title')} - ${t('title')}`,
    description: ta('description'),
  };
}

export default function AdminAttachmentsPage() {
  return <AttachmentManagement />;
}
