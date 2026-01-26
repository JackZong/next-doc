/**
 * 邮件语言类型
 */
export type EmailLocale = 'zh-CN' | 'en' | 'ja' | 'ru' | 'zh-TW';

/**
 * 默认语言
 */
const DEFAULT_LOCALE: EmailLocale = 'en';

/**
 * 邮件翻译内容结构
 */
interface EmailTranslation {
  verification: {
    subject: string;
    title: string;
    welcome: string;
    instruction: (name: string) => string;
    button: string;
    fallback: string;
    expiry: string;
    footer: string;
  };
  resetPassword: {
    subject: string;
    title: string;
    instruction: (name: string) => string;
    button: string;
    fallback: string;
    expiry: string;
    security: string;
  };
  invite: {
    subject: (projectName: string) => string;
    title: string;
    instruction: (inviterName: string, projectName: string) => string;
    button: string;
    textFallback: (inviterName: string, projectName: string) => string;
    footer: string;
  };
}

/**
 * 邮件翻译内容
 */
const translations: Record<EmailLocale, EmailTranslation> = {
  'zh-CN': {
    verification: {
      subject: '验证您的邮箱 - NextDoc',
      title: '验证您的邮箱',
      welcome: '欢迎注册 NextDoc！',
      instruction: (name: string) => `您好 ${name}，请点击下方链接验证您的邮箱：`,
      button: '验证邮箱',
      fallback: '或复制以下链接到浏览器：',
      expiry: '此链接 24 小时内有效。',
      footer: '如果您没有注册 NextDoc，请忽略此邮件。'
    },
    resetPassword: {
      subject: '重置您的密码 - NextDoc',
      title: '重置密码',
      instruction: (name: string) => `您好 ${name}，我们收到了您重置密码的请求。请点击下方按钮重置您的密码：`,
      button: '重置密码',
      fallback: '或复制以下链接到浏览器：',
      expiry: '此链接 1 小时内有效。如果您没有请求重置密码，请忽略此邮件。',
      security: '为了您的账户安全，请不要将此链接分享给他人。'
    },
    invite: {
      subject: (projectName: string) => `NextDoc - 项目协作邀请: ${projectName}`,
      title: '项目协作邀请',
      instruction: (inviterName: string, projectName: string) => `您好！<strong>${inviterName}</strong> 邀请您加入项目 <strong>${projectName}</strong> 进行协作。`,
      button: '接受邀请',
      textFallback: (inviterName: string, projectName: string) => `${inviterName} 邀请您加入项目 ${projectName}。`,
      footer: '如果您没有 NextDoc 账号，点击上述按钮后将引导您完成注册。'
    }
  },
  'en': {
    verification: {
      subject: 'Verify Your Email - NextDoc',
      title: 'Verify Your Email',
      welcome: 'Welcome to NextDoc!',
      instruction: (name: string) => `Hello ${name}, please click the button below to verify your email address:`,
      button: 'Verify Email',
      fallback: 'Or copy the link below into your browser:',
      expiry: 'This link is valid for 24 hours.',
      footer: "If you didn't register at NextDoc, please ignore this email."
    },
    resetPassword: {
      subject: 'Reset Your Password - NextDoc',
      title: 'Reset Password',
      instruction: (name: string) => `Hello ${name}, we received a request to reset your password. Please click the button below to set a new password:`,
      button: 'Reset Password',
      fallback: 'Or copy the link below into your browser:',
      expiry: 'This link is valid for 1 hour. If you did not request a password reset, please ignore this email.',
      security: 'For your account security, please do not share this link with others.'
    },
    invite: {
      subject: (projectName: string) => `NextDoc - Project Invitation: ${projectName}`,
      title: 'Project Invitation',
      instruction: (inviterName: string, projectName: string) => `Hello! <strong>${inviterName}</strong> has invited you to collaborate on the project <strong>${projectName}</strong>.`,
      button: 'Accept Invitation',
      textFallback: (inviterName: string, projectName: string) => `${inviterName} invited you to join project ${projectName}.`,
      footer: "If you don't have a NextDoc account, you will be guided to register after clicking the button."
    }
  },
  'ja': {
    verification: {
      subject: 'メールアドレスの確認 - NextDoc',
      title: 'メールアドレスの確認',
      welcome: 'NextDocへようこそ！',
      instruction: (name: string) => `${name} 様、以下のボタンをクリックしてメールアドレスの確認を完了してください：`,
      button: 'メールアドレスを確認',
      fallback: 'または、以下のリンクをブラウザにコピー＆ペーストしてください：',
      expiry: 'このリンクの有効期限は24時間です。',
      footer: 'NextDocに登録した覚えがない場合は、このメールを無視してください。'
    },
    resetPassword: {
      subject: 'パスワードのリセット - NextDoc',
      title: 'パスワードのリセット',
      instruction: (name: string) => `${name} 様、パスワードのリセットリクエストを承りました。以下のボタンをクリックして新しいパスワードを設定してください：`,
      button: 'パスワードをリセット',
      fallback: 'または、以下のリンクをブラウザにコピー＆ペーストしてください：',
      expiry: 'このリンクの有効期限は1時間です。リクエストに覚えがない場合は、このメールを無視してください。',
      security: 'アカウントの安全のため、このリンクを他人に教えないでください。'
    },
    invite: {
      subject: (projectName: string) => `NextDoc - プロジェクト招待: ${projectName}`,
      title: 'プロジェクト招待',
      instruction: (inviterName: string, projectName: string) => `こんにちは！ <strong>${inviterName}</strong> さんが、プロジェクト <strong>${projectName}</strong> への招待を送信しました。`,
      button: '招待を承諾',
      textFallback: (inviterName: string, projectName: string) => `${inviterName} さんがプロジェクト ${projectName} にあなたを招待しました。`,
      footer: 'NextDocアカウントをお持ちでない場合は、ボタンをクリックした後に登録画面へ案内されます。'
    }
  },
  'ru': {
    verification: {
      subject: 'Подтвердите ваш адрес электронной почты - NextDoc',
      title: 'Подтвердите ваш Email',
      welcome: 'Добро пожаловать в NextDoc!',
      instruction: (name: string) => `Здравствуйте, ${name}! Пожалуйста, нажмите на кнопку ниже, чтобы подтвердить ваш адрес электронной почты:`,
      button: 'Подтвердить Email',
      fallback: 'Или скопируйте ссылку ниже в ваш браузер:',
      expiry: 'Эта ссылка действительна в течение 24 часов.',
      footer: 'Если вы не регистрировались в NextDoc, пожалуйста, игнорируйте это письмо.'
    },
    resetPassword: {
      subject: 'Сброс вашего пароля - NextDoc',
      title: 'Сброс пароля',
      instruction: (name: string) => `Здравствуйте, ${name}! Мы получили запрос на сброс вашего пароля. Пожалуйста, нажмите на кнопку ниже, чтобы установить новый пароль:`,
      button: 'Сбросить пароль',
      fallback: 'Или скопируйте ссылку ниже в ваш браузер:',
      expiry: 'Эта ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, игнорируйте это письмо.',
      security: 'Для безопасности вашего аккаунта, пожалуйста, не делитесь этой ссылкой с другими.'
    },
    invite: {
      subject: (projectName: string) => `NextDoc - Приглашение в проект: ${projectName}`,
      title: 'Приглашение в проект',
      instruction: (inviterName: string, projectName: string) => `Здравствуйте! <strong>${inviterName}</strong> пригласил вас к участию в проекте <strong>${projectName}</strong>.`,
      button: 'Принять приглашение',
      textFallback: (inviterName: string, projectName: string) => `${inviterName} пригласил вас присоединиться к проекту ${projectName}.`,
      footer: 'Если у вас нет учетной записи NextDoc, после нажатия кнопки вам будет предложено зарегистрироваться.'
    }
  },
  'zh-TW': {
    verification: {
      subject: '驗證您的郵箱 - NextDoc',
      title: '驗證您的郵箱',
      welcome: '歡迎註冊 NextDoc！',
      instruction: (name: string) => `您好 ${name}，請點擊下方鏈接驗證您的郵箱：`,
      button: '驗證郵箱',
      fallback: '或複製以下鏈接到瀏覽器：',
      expiry: '此鏈接 24 小時內有效。',
      footer: '如果您沒有註冊 NextDoc，請忽略此郵件。'
    },
    resetPassword: {
      subject: '重置您的密碼 - NextDoc',
      title: '重置密碼',
      instruction: (name: string) => `您好 ${name}，我們收到了您重置密碼的請求。請點擊下方按鈕重置您的密碼：`,
      button: '重置密碼',
      fallback: '或複製以下鏈接到瀏覽器：',
      expiry: '此鏈接 1 小時內有效。如果您沒有請求重置密碼，請忽略此郵件。',
      security: '為了您的賬戶安全，請不要將此鏈接分享給他人。'
    },
    invite: {
      subject: (projectName: string) => `NextDoc - 項目協作邀請: ${projectName}`,
      title: '項目協作邀請',
      instruction: (inviterName: string, projectName: string) => `您好！<strong>${inviterName}</strong> 邀請您加入項目 <strong>${projectName}</strong> 進行協作。`,
      button: '接受邀請',
      textFallback: (inviterName: string, projectName: string) => `${inviterName} 邀請您加入項目 ${projectName}。`,
      footer: '如果您沒有 NextDoc 賬號，點擊上述按鈕後將引導您完成註冊。'
    }
  }
};

/**
 * 获取翻译内容
 */
function getTranslation(locale: string = DEFAULT_LOCALE) {
  return translations[locale as EmailLocale] || translations[DEFAULT_LOCALE];
}

/**
 * 邮箱验证模板
 */
export function getVerificationEmailTemplate(url: string, name: string, locale: string = DEFAULT_LOCALE) {
  const t = getTranslation(locale).verification;
  
  return {
    subject: t.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 24px;">${t.title}</h2>
        <p style="color: #0f172a; font-size: 18px; font-weight: bold;">${t.welcome}</p>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">
          ${t.instruction(name)}
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
            ${t.button}
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          ${t.fallback}<br/>
          <span style="word-break: break-all; color: #2563eb;">${url}</span>
        </p>
        <p style="color: #64748b; font-size: 14px;">
          ${t.expiry}
        </p>
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>${t.footer}</p>
          <p>© ${new Date().getFullYear()} NextDoc. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `${t.welcome} ${t.instruction(name)} ${url} ${t.expiry}`,
  };
}

/**
 * 密码重置模板
 */
export function getResetPasswordEmailTemplate(url: string, name: string, locale: string = DEFAULT_LOCALE) {
  const t = getTranslation(locale).resetPassword;

  return {
    subject: t.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 24px;">${t.title}</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">
          ${t.instruction(name)}
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
            ${t.button}
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          ${t.fallback}<br/>
          <span style="word-break: break-all; color: #2563eb;">${url}</span>
        </p>
        <p style="color: #64748b; font-size: 14px;">
          ${t.expiry}
        </p>
        <p style="color: #ef4444; font-size: 12px; margin-top: 16px;">
          ${t.security}
        </p>
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>© ${new Date().getFullYear()} NextDoc. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `${t.title}: ${t.instruction(name)} ${url} ${t.expiry}`,
  };
}

/**
 * 项目邀请模板
 */
export function getInviteEmailTemplate({
  projectName,
  inviterName,
  inviteLink,
  locale = DEFAULT_LOCALE
}: {
  projectName: string;
  inviterName: string;
  inviteLink: string;
  locale?: string;
}) {
  const t = getTranslation(locale).invite;

  return {
    subject: t.subject(projectName),
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 24px;">${t.title}</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">
          ${t.instruction(inviterName, projectName)}
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
            ${t.button}
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          ${t.footer}
        </p>
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>© ${new Date().getFullYear()} NextDoc. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `${t.textFallback(inviterName, projectName)} ${inviteLink}`,
  };
}
