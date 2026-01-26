import { NextRequest, NextResponse } from 'next/server';
import { getDb, getDatabaseType, sqliteSchema } from '@/lib/db';
import { documentHistory, users, documents } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';

// 获取文档的历史版本列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const dbType = getDatabaseType();

    let histories: any[] = [];

    // 目前主要适配 SQLite，其他数据库可在此扩展分支
    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;
      // @ts-ignore - 解决 Drizzle 内部类型冲突
      histories = await sqliteDb
        .select({
          id: documentHistory.id,
          documentId: documentHistory.documentId,
          content: documentHistory.content,
          changeLog: documentHistory.changeLog,
          version: documentHistory.version,
          createdAt: documentHistory.createdAt,
          creatorName: users.name,
        })
        .from(documentHistory)
        .leftJoin(users, eq(documentHistory.authorId, users.id))
        .where(eq(documentHistory.documentId, id))
        .orderBy(desc(documentHistory.createdAt))
        .all();
    }

    return NextResponse.json({
      success: true,
      histories: histories || [],
    });
  } catch {
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

    const db = await getDb();
    const dbType = getDatabaseType();

    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;
      
      // 查找历史内容
      const history = await sqliteDb
        .select()
        .from(documentHistory)
        .where(eq(documentHistory.id, historyId))
        .get();

      if (!history) {
        return NextResponse.json({ error: '历史版本不存在' }, { status: 404 });
      }

      // 更新当前文档内容
      await sqliteDb.update(documents)
        .set({ 
          content: history.content,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id));
    }

    return NextResponse.json({
      success: true,
      message: '文档已恢复到选定版本',
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
