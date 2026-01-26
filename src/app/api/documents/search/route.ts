import { NextRequest, NextResponse } from 'next/server';
import { getDbSync, getSchema } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { like, or } from 'drizzle-orm';

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

    const db = getDbSync() as any;
    const schema = getSchema();

    const results = await db
      .select({
        id: (schema.documents as any).id,
        title: (schema.documents as any).title,
        identify: (schema.documents as any).identify,
        projectId: (schema.documents as any).projectId,
      })
      .from(schema.documents)
      .where(
        or(
          like((schema.documents as any).title, `%${keyword}%`),
          like((schema.documents as any).content, `%${keyword}%`)
        )
      );

    return NextResponse.json({
      success: true,
      documents: results || [],
    });
  } catch (error) {
    console.error('搜索文档错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
