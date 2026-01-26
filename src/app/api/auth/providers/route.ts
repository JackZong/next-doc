import { NextResponse } from 'next/server';
import { getDbSync } from '@/lib/db';
import { systemConfig } from '@/lib/db/schema/sqlite';
import { CONFIG_KEYS } from '@/lib/constants/config';

export async function GET() {
  try {
    const db = getDbSync();
    const configs = await db
      .select()
      .from(systemConfig)
      .all();

    const configMap: Record<string, string> = {};
    configs.forEach((config) => {
      configMap[config.key] = config.value || '';
    });

    return NextResponse.json({
      success: true,
      github: configMap[CONFIG_KEYS.GITHUB_AUTH_ENABLED] === 'true',
      google: configMap[CONFIG_KEYS.GOOGLE_AUTH_ENABLED] === 'true',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取第三方登录配置失败' });
  }
}
