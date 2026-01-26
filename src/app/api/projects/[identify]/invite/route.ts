import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { projects, projectMembers, invitations, users } from '@/lib/db/schema/sqlite';
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

    const db = getDbSync();

    // 获取当前用户的完整信息（包括姓名）
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUserPayload.userId))
      .get();

    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取语言环境
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    // 获取项目并检查权限
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.identify, identify))
      .get();

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 检查当前用户是否有权邀请（只有 owner 可以邀请，或者管理员）
    const membership = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, currentUser.id)))
      .get();

    if (currentUser.role !== 'admin' && (!membership || membership.role !== 'owner')) {
      return NextResponse.json({ error: '权限不足，只有所有者可以邀请成员' }, { status: 403 });
    }

    // 检查用户是否已经是成员
    const targetUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (targetUser) {
      const existingMember = await db
        .select()
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, targetUser.id)))
        .get();
      
      if (existingMember) {
        return NextResponse.json({ error: '该用户已经是项目成员' }, { status: 400 });
      }
    }

    // 生成邀请 Token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天过期

    await db.insert(invitations).values({
      id: randomUUID(),
      projectId: project.id,
      email,
      role: role || 'viewer',
      token,
      inviterId: currentUser.id,
      expiresAt,
    }).run();

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
