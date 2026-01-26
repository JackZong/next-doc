
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hash, compare } from "bcryptjs";
import { getDbSync, getDatabaseType, getSchema } from "../db";
import { sendEmail } from "../email";
import { getVerificationEmailTemplate, getResetPasswordEmailTemplate } from "../email/templates";
import { cookies } from "next/headers";

// Better Auth 配置
// 敏感信息均通过环境变量（.env）管理以确保安全性。

/**
 * 获取当前的语言环境
 */
async function getCurrentLocale() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("NEXT_LOCALE")?.value || "en";
  } catch {
    return "en";
  }
}

const dbType = getDatabaseType();
const dbSchema = getSchema();

const authProviderMap = {
  sqlite: "sqlite",
  mysql: "mysql",
  postgres: "pg",
} as const;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  logger: {
    level: "debug",
  },
  database: drizzleAdapter(getDbSync(), {
    provider: authProviderMap[dbType],
    schema: {
      user: dbSchema.users,
      session: (dbSchema as any).sessions,
      account: (dbSchema as any).accounts,
      verification: (dbSchema as any).verifications || (dbSchema as any).emailVerifications,
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: async (password) => {
        return await hash(password, 10);
      },
      verify: async ({ hash: hashedPassword, password }) => {
        if (!hashedPassword) {
             console.warn("Verify called with undefined hashedPassword. Check database for missing password field in account/user table.");
             return false;
        }
        const isValid = await compare(password, hashedPassword);
        console.log(`[Auth Debug] Verifying password. Input length: ${password.length}, Hash length: ${hashedPassword.length}, Result: ${isValid}`);
        return isValid;
      }
    },
    // 发送验证邮件的回调
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      try {
        const locale = await getCurrentLocale();
        const template = getVerificationEmailTemplate(url, user.name, locale);

        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      } catch (error) {
        console.error("发送验证邮件失败:", error);
      }
    },
    // 发送密码重置邮件的回调
    sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      try {
        const locale = await getCurrentLocale();
        const template = getResetPasswordEmailTemplate(url, user.name, locale);

        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      } catch (error) {
        console.error("发送密码重置邮件失败:", error);
      }
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    }
  },
  user: {
    additionalFields: {
      account: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        defaultValue: "viewer",
      },
      status: {
        type: "string",
        defaultValue: "active",
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // 用户创建前，设置 account 字段（用户名）
          // 如果没有提供 account，默认使用邮箱
          return {
            data: {
              ...user,
              account: user.account || user.email,
            },
          };
        },
      },
    },
  },
  socialProviders: {
    github: {
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }
  }
});
