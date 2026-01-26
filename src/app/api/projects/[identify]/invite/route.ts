import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync , getSchema } from '@/lib/db';

import { eq, and } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { getInviteEmailTemplate } from '@/lib/email/templates';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const { email, role } = await request.json();
    const currentUserPayload = await getCurrentUser();

    if (!currentUserPayload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const db = getDbSync(); const schema = getSchema();

    // 获取当前用户的完整信息（包括姓名）
    const currentUserList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).id, currentUserPayload.userId))
      .limit(1);
    const currentUser = currentUserList[0];

    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取语言环境
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    // 获取项目并检查权限
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    const project = projectList[0];

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 检查当前用户是否有权邀请（只有 owner 可以邀请，或者管理员）
    const membershipList = await db
      .select()
      .from(schema.projectMembers)
      .where(and(eq((schema.projectMembers as any).projectId, project.id), eq((schema.projectMembers as any).userId, currentUser.id)))
      .limit(1);
    const membership = membershipList[0];

    if (currentUser.role !== 'admin' && (!membership || membership.role !== 'owner')) {
      return NextResponse.json({ error: '权限不足，只有所有者可以邀请成员' }, { status: 403 });
    }

    // 检查用户是否已经是成员
    const targetUserList = await db.select().from(schema.users).where(eq((schema.users as any).email, email)).limit(1);
    const targetUser = targetUserList[0];
    if (targetUser) {
      const existingMemberList = await db
        .select()
        .from(schema.projectMembers)
        .where(and(eq((schema.projectMembers as any).projectId, project.id), eq((schema.projectMembers as any).userId, targetUser.id)))
        .limit(1);
    const existingMember = existingMemberList[0];
      
      if (existingMember) {
        return NextResponse.json({ error: '该用户已经是项目成员' }, { status: 400 });
      }
    }

    // 生成邀请 Token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天过期

    await db.insert(schema.invitations).values({
      id: randomUUID(),
      projectId: project.id,
      email,
      role: role || 'viewer',
      token,
      inviterId: currentUser.id,
      expiresAt,
    });

    // 发送邀请邮件
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
    const template = getInviteEmailTemplate({
      projectName: project.name,
      inviterName: currentUser.name || 'NextDoc 用户',
      inviteLink,
      locale,
    });

    try {
      await sendEmail({
        to: email,
        ...template,
      });
    } catch (emailError) {
      console.error('发送邀请邮件失败:', emailError);
      // 仍然返回成功，因为数据库记录已创建，用户可以手动复制链接
      return NextResponse.json({ 
        success: true, 
        message: '邀请已创建，但邮件发送失败，请手动分享链接',
        inviteLink 
      });
    }

    return NextResponse.json({ success: true, message: '邀请已发送' });
  } catch (error) {
    console.error('邀请成员错误:', error);
    return NextResponse.json({ error: (error as Error).message || '邀请失败' }, { status: 500 });
  }
}
