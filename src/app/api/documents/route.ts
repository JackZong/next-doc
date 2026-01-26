import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getDbSync } from '@/lib/db';
import { documents, projects, projectMembers } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, asc, isNull } from 'drizzle-orm';

// 获取项目的文档列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const projectIdentify = searchParams.get('identify');

    if (!projectId && !projectIdentify) {
      return NextResponse.json(
        { error: '缺少项目参数' },
        { status: 400 }
      );
    }

    const db = getDbSync();

    // 获取项目
    const project = await db
      .select({
        id: projects.id,
        visibility: projects.visibility,
        ownerId: projects.ownerId,
      })
      .from(projects)
      .where(
        projectIdentify 
          ? eq(projects.identify, projectIdentify) 
          : eq(projects.id, projectId!)
      )
      .get();

    if (!project || !project.id) {
      console.error('项目不存在或 ID 丢失:', { projectIdentify, projectId, foundProject: project });
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    const tokenPayload = await getCurrentUser();
    if (project.visibility === 'private') {
      if (!tokenPayload) {
        return NextResponse.json(
          { error: '请先登录' },
          { status: 401 }
        );
      }

      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, project.id),
            eq(projectMembers.userId, tokenPayload.userId)
          )
        )
        .get();

      if (!membership && project.ownerId !== tokenPayload.userId) {
        return NextResponse.json(
          { error: '无权访问该项目' },
          { status: 403 }
        );
      }
    }

    // 获取文档列表
    const docsResult = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, project.id))
      .orderBy(asc(documents.sort), asc(documents.createdAt))
      .all();

    const docs = docsResult || [];

    // 构建文档树
    interface DocumentTreeItem extends NonNullable<typeof docsResult[0]> {
      children: DocumentTreeItem[];
    }

    const buildTree = (parentId: string | null): DocumentTreeItem[] => {
      return docs
        .filter((doc) => doc.parentId === parentId)
        .map((doc) => ({
          ...doc,
          children: buildTree(doc.id),
        }));
    };

    const documentTree = buildTree(null);

    return NextResponse.json({
      success: true,
      documents: documentTree,
    });
  } catch (error) {
    console.error('获取文档列表详细错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: String(error) },
      { status: 500 }
    );
  }
}

// 创建文档
export async function POST(request: NextRequest) {
  try {
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      projectId, 
      parentId, 
      title, 
      content = '', 
      contentType = 'markdown',
      status = 'draft'
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: '项目ID和标题不能为空' },
        { status: 400 }
      );
    }

    const db = getDbSync();

    // 获取项目
    const project = await db
      .select({
        id: projects.id,
        identify: projects.identify,
        ownerId: projects.ownerId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, tokenPayload.userId)
        )
      )
      .get();

    const canEdit = 
      project.ownerId === tokenPayload.userId ||
      membership?.role === 'owner' ||
      membership?.role === 'editor' ||
      tokenPayload.role === 'admin';

    if (!canEdit) {
      return NextResponse.json(
        { error: '无权在该项目中创建文档' },
        { status: 403 }
      );
    }

    // 生成文档标识
    const randomStr = Math.random().toString(36).substring(2, 15);
    const identify = `${project.identify}-${randomStr}`;

    // 获取排序值
    const existingDocs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.projectId, projectId),
          parentId ? eq(documents.parentId, parentId) : isNull(documents.parentId)
        )
      )
      .all();

    const maxSort = existingDocs.reduce((max, doc) => Math.max(max, doc.sort), -1);

    const docId = uuid();

    // 创建文档
    await db.insert(documents).values({
      id: docId,
      projectId,
      parentId: parentId || null,
      title,
      identify,
      content,
      contentType,
      sort: maxSort + 1,
      status,
      authorId: tokenPayload.userId,
      viewCount: 0,
    }).run();

    const newDoc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId))
      .get();

    return NextResponse.json({
      success: true,
      document: newDoc,
    });
  } catch (error) {
    console.error('创建文档错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
