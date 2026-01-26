import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync, getSchema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';

// 删除附件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const db = getDbSync() as any;
    const schema = getSchema();

    // 检查附件是否存在
    const attachmentList = await db
      .select()
      .from(schema.attachments)
      .where(eq((schema.attachments as any).id, id))
      .limit(1);
      
    const attachment = attachmentList[0];

    if (!attachment) {
      return NextResponse.json(
        { error: '附件不存在' },
        { status: 404 }
      );
    }

    // 删除物理文件
    try {
      const filePath = join(process.cwd(), 'public', attachment.path);
      await unlink(filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
      // 即使文件删除失败，也继续删除数据库记录
    }

    // 删除数据库记录
    await db
      .delete(schema.attachments)
      .where(eq((schema.attachments as any).id, id));

    return NextResponse.json({
      success: true,
      message: '附件已删除',
    });
  } catch (error) {
    console.error('删除附件错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
