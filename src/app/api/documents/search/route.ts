import { NextRequest, NextResponse } from 'next/server';
import { getDb, getDatabaseType, sqliteSchema } from '@/lib/db';
import { documents } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { like, or } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';

// 搜索文档
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      return NextResponse.json({
        success: true,
        documents: [],
      });
    }

    const tokenPayload = await getCurrentUser();
    if (!tokenPayload) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = await getDb();
    const dbType = getDatabaseType();

    let results: { id: string; title: string; identify: string; projectId: string }[] = [];

    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;
      results = await sqliteDb
        .select({
          id: documents.id,
          title: documents.title,
          identify: documents.identify,
          projectId: documents.projectId,
        })
        .from(documents)
        .where(
          or(
            like(documents.title, `%${keyword}%`),
            like(documents.content, `%${keyword}%`)
          )
        )
        .all();
    }

    return NextResponse.json({
      success: true,
      documents: results || [],
    });
  } catch (error) {
    console.error('搜索文档错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
