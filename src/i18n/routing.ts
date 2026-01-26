import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // 支持的语言列表
  locales: ['en', 'zh-CN', 'zh-TW', 'ja', 'ru'],

  // 默认语言
  defaultLocale: 'zh-CN',
  
  // 语言前缀策略：始终显示语言前缀
  localePrefix: 'always'
});

// 轻量级导航包装器，用于在组件中轻松使用
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
