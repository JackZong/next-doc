import { NextRequest, NextResponse } from 'next/server';
import { getDbSync } from '@/lib/db';
import { users, emailVerifications } from '@/lib/db/schema/sqlite';
import { sendEmail } from '@/lib/email';
import { getVerificationEmailTemplate } from '@/lib/email/templates';
import { eq } from 'drizzle-orm';
import { randomUUID, randomInt } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: '无效邮箱地址' }, { status: 400 });
    }

    const db = getDbSync();

    // 检查邮箱是否已注册
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // 生成 6 位数字验证码
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟后过期

    // 保存验证码到数据库
    await db.insert(emailVerifications).values({
      id: randomUUID(),
      email,
      code,
      expiresAt,
    }).run();

    // 发送邮件
    const template = getVerificationEmailTemplate(code, email.split('@')[0], 'zh-CN');
    await sendEmail({
      to: email,
      ...template,
    });

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error: unknown) {
    console.error('发送验证码错误:', error);
    const errorMessage = error instanceof Error ? error.message : '发送失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
