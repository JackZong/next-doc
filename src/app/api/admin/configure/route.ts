import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync , getSchema } from '@/lib/db';

import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CONFIG_KEYS } from '@/lib/constants/config';

// 获取配置
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const db = getDbSync(); const schema = getSchema();

    // 获取所有配置
    const configs = await db
      .select()
      .from(schema.systemConfig);

    // 转换为键值对
    const configMap: Record<string, string> = {};
    configs.forEach((config: any) => {
      configMap[config.key] = config.value || '';
    });

    // 返回配置对象
    // 优先使用数据库配置，环境变量作为默认值（虽然通常只用一个来源，但这里为了兼容性）
    const smtpPassword = configMap[CONFIG_KEYS.SMTP_PASSWORD] || process.env.SMTP_PASSWORD;

    return NextResponse.json({
      success: true,
      config: {
        requireCaptcha: configMap[CONFIG_KEYS.REQUIRE_CAPTCHA] === 'true',
        allowRegister: configMap[CONFIG_KEYS.ALLOW_REGISTER] !== 'false', // 默认开启
        
        // 邮件配置
        smtpHost: configMap[CONFIG_KEYS.SMTP_HOST] || process.env.SMTP_HOST || '',
        smtpPort: configMap[CONFIG_KEYS.SMTP_PORT] || process.env.SMTP_PORT || '587',
        smtpUser: configMap[CONFIG_KEYS.SMTP_USER] || process.env.SMTP_USER || '',
        // 不返回真实密码
        smtpPassword: smtpPassword ? '******' : '',
        smtpFrom: configMap[CONFIG_KEYS.SMTP_FROM] || process.env.SMTP_FROM || '',

        // 第三方登录配置（暂时仍主要从 .env 读取，若需支持 DB 配置可类似处理）
        githubAuthEnabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        githubClientId: process.env.GITHUB_CLIENT_ID || '',
        googleAuthEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      },
      currentUserEmail: currentUser.email,
    });
  } catch (error) {
    console.error('获取配置错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 保存配置
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      requireCaptcha,
      allowRegister,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFrom
    } = body;

    const db = getDbSync(); const schema = getSchema();

    // 保存或更新配置
    const configsToSave = [
      { key: CONFIG_KEYS.REQUIRE_CAPTCHA, value: String(requireCaptcha), description: '登录是否需要验证码' },
      { key: CONFIG_KEYS.ALLOW_REGISTER, value: String(allowRegister), description: '是否开放注册' },
    ];
    
    // 如果提供了 SMTP 配置，则保存
    if (smtpHost !== undefined) configsToSave.push({ key: CONFIG_KEYS.SMTP_HOST, value: smtpHost, description: 'SMTP服务器地址' });
    if (smtpPort !== undefined) configsToSave.push({ key: CONFIG_KEYS.SMTP_PORT, value: smtpPort, description: 'SMTP端口' });
    if (smtpUser !== undefined) configsToSave.push({ key: CONFIG_KEYS.SMTP_USER, value: smtpUser, description: 'SMTP用户名' });
    if (smtpFrom !== undefined) configsToSave.push({ key: CONFIG_KEYS.SMTP_FROM, value: smtpFrom, description: '邮件发送者' });
    
    // 密码特殊处理：如果不为空且不等于掩码，则更新
    if (smtpPassword && smtpPassword !== '******') {
       configsToSave.push({ key: CONFIG_KEYS.SMTP_PASSWORD, value: smtpPassword, description: 'SMTP密码' });
    }

    for (const config of configsToSave) {
      // 检查配置是否存在
      const existingList = await db
        .select()
        .from(schema.systemConfig)
        .where(eq((schema.systemConfig as any).key, config.key))
        .limit(1);
      
      const existing = existingList[0];

      if (existing) {
        // 更新
        await db
          .update(schema.systemConfig)
          .set({
            value: config.value,
            updatedAt: new Date(),
          })
          .where(eq((schema.systemConfig as any).key, config.key));
      } else {
        // 插入
        await db
          .insert(schema.systemConfig)
          .values({
            id: randomUUID(),
            key: config.key,
            value: config.value,
            description: config.description,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: '系统配置已保存',
    });
  } catch (error) {
    console.error('保存配置错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
