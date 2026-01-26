import nodemailer from 'nodemailer';
import { getDbSync, getSchema } from '@/lib/db';
import { CONFIG_KEYS } from '@/lib/constants/config';

/**
 * 从数据库获取 SMTP 配置
 */
async function getSmtpConfig() {
  const db = getDbSync() as any;
  const schema = getSchema();
  const configs = await db.select().from(schema.systemConfig);
  
  const configMap: Record<string, string> = {};
  configs.forEach((c: any) => {
    configMap[c.key] = c.value || '';
  });

  return {
    host: configMap[CONFIG_KEYS.SMTP_HOST] || process.env.SMTP_HOST,
    port: parseInt(configMap[CONFIG_KEYS.SMTP_PORT] || process.env.SMTP_PORT || '587'),
    user: configMap[CONFIG_KEYS.SMTP_USER] || process.env.SMTP_USER,
    pass: configMap[CONFIG_KEYS.SMTP_PASSWORD] || process.env.SMTP_PASSWORD,
    from: configMap[CONFIG_KEYS.SMTP_FROM] || process.env.SMTP_FROM,
  };
}

/**
 * 创建邮件传输器
 */
async function createTransporter() {
  const config = await getSmtpConfig();
  
  if (!config.host || !config.user || !config.pass) {
    throw new Error('邮件服务器配置不完整');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

/**
 * 发送邮件
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const config = await getSmtpConfig();
  const transporter = await createTransporter();

  return await transporter.sendMail({
    from: `"NextDoc" <${config.from || config.user}>`,
    to,
    subject,
    text,
    html,
  });
}
