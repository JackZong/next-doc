import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync , getSchema } from '@/lib/db';

import { desc, eq } from 'drizzle-orm';

// 获取所有附件列表
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

    // 获取所有附件及其关联信息
    const attachmentList = await db
      .select({
        id: (schema.attachments as any).id,
        name: (schema.attachments as any).name,
        path: (schema.attachments as any).path,
        size: (schema.attachments as any).size,
        mimeType: (schema.attachments as any).mimeType,
        projectId: (schema.attachments as any).projectId,
        projectName: (schema.projects as any).name,
        uploaderId: (schema.attachments as any).uploaderId,
        uploaderName: (schema.users as any).name,
        createdAt: (schema.attachments as any).createdAt,
      })
      .from(schema.attachments)
      .leftJoin(schema.projects, eq((schema.attachments as any).projectId, (schema.projects as any).id))
      .leftJoin(schema.users, eq((schema.attachments as any).uploaderId, (schema.users as any).id))
      .orderBy(desc((schema.attachments as any).createdAt))
      ;

    return NextResponse.json({
      success: true,
      attachments: attachmentList,
    });
  } catch (error) {
    console.error('获取附件列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
