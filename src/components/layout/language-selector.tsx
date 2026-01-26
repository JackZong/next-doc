'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useParams } from 'next/navigation';

export function LanguageSelector() {
  const t = useTranslations('Language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleLanguageChange = (newLocale: string) => {
    // 使用 next-intl 的 router.replace 自动处理路径前缀
    router.replace(
      // @ts-expect-error params is valid here
      { pathname, params },
      { locale: newLocale }
    );
  };

  const languages = [
    { code: 'zh-CN', label: t('zh-CN') },
    { code: 'zh-TW', label: t('zh-TW') },
    { code: 'en', label: t('en') },
    { code: 'ja', label: t('ja') },
    { code: 'ru', label: t('ru') },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Languages className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
          <span className="sr-only">{t('label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
