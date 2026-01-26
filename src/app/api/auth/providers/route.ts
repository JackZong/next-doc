import { NextResponse } from 'next/server';
import { getDbSync, getSchema } from '@/lib/db';
import { CONFIG_KEYS } from '@/lib/constants/config';

export async function GET() {
  try {
    const db = getDbSync() as any;
    const schema = getSchema();
    const configs = await db
      .select()
      .from(schema.systemConfig);

    const configMap: Record<string, string> = {};
    configs.forEach((config: any) => {
      configMap[config.key] = config.value || '';
    });

    return NextResponse.json({
      success: true,
      github: configMap[CONFIG_KEYS.GITHUB_AUTH_ENABLED] === 'true' || !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      google: configMap[CONFIG_KEYS.GOOGLE_AUTH_ENABLED] === 'true' || !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取第三方登录配置失败' });
  }
}
