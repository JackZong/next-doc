import { NextRequest, NextResponse } from 'next/server';
import { getDbSync, getSchema } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

// 获取文档的历史版本列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDbSync() as any;
    const schema = getSchema();

    const histories = await db
      .select({
        id: (schema.documentHistory as any).id,
        documentId: (schema.documentHistory as any).documentId,
        content: (schema.documentHistory as any).content,
        changeLog: (schema.documentHistory as any).changeLog,
        version: (schema.documentHistory as any).version,
        createdAt: (schema.documentHistory as any).createdAt,
        creatorName: (schema.users as any).name,
      })
      .from(schema.documentHistory)
      .leftJoin(schema.users, eq((schema.documentHistory as any).authorId, (schema.users as any).id))
      .where(eq((schema.documentHistory as any).documentId, id))
      .orderBy(desc((schema.documentHistory as any).createdAt));

    return NextResponse.json({
      success: true,
      histories: histories || [],
    });
  } catch (error) {
    console.error('获取文档历史版本错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 恢复历史版本
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { historyId } = await request.json();

    if (!historyId) {
      return NextResponse.json({ error: '请选择要恢复的版本' }, { status: 400 });
    }

    const tokenPayload = await getCurrentUser();
    if (!tokenPayload) {
       return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = getDbSync() as any;
    const schema = getSchema();

    // 查找历史内容
    const historyList = await db
      .select()
      .from(schema.documentHistory)
      .where(eq((schema.documentHistory as any).id, historyId))
      .limit(1);

    const history = historyList[0];

    if (!history) {
      return NextResponse.json({ error: '历史版本不存在' }, { status: 404 });
    }

    // 更新当前文档内容
    await db.update(schema.documents)
      .set({ 
        content: history.content,
        updatedAt: new Date(),
      })
      .where(eq((schema.documents as any).id, id));

    return NextResponse.json({
      success: true,
      message: '文档已恢复到选定版本',
    });
  } catch (error) {
    console.error('恢复文档历史版本错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
