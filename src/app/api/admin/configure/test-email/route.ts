import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { testEmail } = body;

    // 从环境变量读取配置，不再信任前端传入的值
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || '587';
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !testEmail) {
      return NextResponse.json({ error: '系统尚未配置 SMTP 环境参数，请检查 .env。' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      // 超时设置，防止测试挂起
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });

    // 验证连接
    await transporter.verify();

    // 发送测试邮件
    await transporter.sendMail({
      from: `"NextDoc Test" <${smtpFrom || smtpUser}>`,
      to: testEmail,
      subject: 'NextDoc 邮件服务器测试',
      text: '如果您收到这封邮件，说明您的 SMTP 服务器配置正确。',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2F54EB;">NextDoc 邮件测试</h2>
          <p>恭喜！您的 SMTP 服务器配置已通过测试。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">这是一封系统生成的测试邮件，请勿回复。</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: '测试邮件已发送，请检查收件箱' });
  } catch (error) {
    console.error('邮件测试失败:', error);
    return NextResponse.json({ 
      error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}` 
    }, { status: 500 });
  }
}
