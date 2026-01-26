import { Metadata } from 'next';
import {  getDbSync, getSchema } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InviteAcceptClient } from './invite-accept-client';

import Link from 'next/link';

export const metadata: Metadata = {
  title: '接受项目邀请 - NextDoc',
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const user = await getCurrentUser();
  
  const db = getDbSync() as any;
  const schema = getSchema();
  const invitationList = await db
    .select()
    .from(schema.invitations)
    .where(and(eq((schema.invitations as any).token, token), gt((schema.invitations as any).expiresAt, new Date())))
    .limit(1);

  const invitation = invitationList[0];

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">邀请无效或已过期</h1>
          <p className="text-muted-foreground">该邀请链接已失效。请联系项目所有者重新发送邀请邮件。</p>
          <Link href="/" className="inline-block pt-4 text-primary hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const projectList = await db
    .select()
    .from(schema.projects)
    .where(eq((schema.projects as any).id, invitation.projectId))
    .limit(1);
    
  const project = projectList[0];

  if (!user) {
    // 检查被邀请的邮箱是否已注册
    const existingUserList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).email, invitation.email))
      .limit(1);
    
    const existingUser = existingUserList[0];

    const baseUrl = existingUser ? '/login' : '/register';
    redirect(`${baseUrl}?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`);
  }

  // 检查是否已经是成员
  const membershipList = await db
    .select()
    .from(schema.projectMembers)
    .where(and(eq((schema.projectMembers as any).projectId, invitation.projectId), eq((schema.projectMembers as any).userId, user.userId)))
    .limit(1);

  const membership = membershipList[0];

  if (membership) {
    redirect(`/docs/${project?.identify}`);
  }

  return (
    <InviteAcceptClient 
      token={token}
      projectName={project?.name || '未知项目'}
      role={invitation.role}
    />
  );
}
