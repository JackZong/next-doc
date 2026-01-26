import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getDbSync, getSchema } from '@/lib/db';
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

    const db = getDbSync() as any;
    const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select({
        id: (schema.projects as any).id,
        visibility: (schema.projects as any).visibility,
        ownerId: (schema.projects as any).ownerId,
        identify: (schema.projects as any).identify,
      })
      .from(schema.projects)
      .where(
        projectIdentify 
          ? eq((schema.projects as any).identify, projectIdentify) 
          : eq((schema.projects as any).id, projectId!)
      )
      .limit(1);
    const project = projectList[0];

    if (!project || !project.id) {
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

      const membershipList = await db
        .select()
        .from(schema.projectMembers)
        .where(
          and(
            eq((schema.projectMembers as any).projectId, project.id),
            eq((schema.projectMembers as any).userId, tokenPayload.userId)
          )
        )
        .limit(1);
      const membership = membershipList[0];

      if (!membership && project.ownerId !== tokenPayload.userId) {
        return NextResponse.json(
          { error: '无权访问该项目' },
          { status: 403 }
        );
      }
    }

    // 获取文档列表
    const docs = await db
      .select()
      .from(schema.documents)
      .where(eq((schema.documents as any).projectId, project.id))
      .orderBy(asc((schema.documents as any).sort), asc((schema.documents as any).createdAt));

    // 构建文档树
    type DocumentTreeItem = any & {
      children: DocumentTreeItem[];
    };

    const buildTree = (parentId: string | null): DocumentTreeItem[] => {
      return (docs as any[])
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

    const db = getDbSync() as any;
    const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select({
        id: (schema.projects as any).id,
        identify: (schema.projects as any).identify,
        ownerId: (schema.projects as any).ownerId,
      })
      .from(schema.projects)
      .where(eq((schema.projects as any).id, projectId))
      .limit(1);
    
    const project = projectList[0];

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    const membershipList = await db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq((schema.projectMembers as any).projectId, projectId),
          eq((schema.projectMembers as any).userId, tokenPayload.userId)
        )
      )
      .limit(1);
    const membership = membershipList[0];

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
      .from(schema.documents)
      .where(
        and(
          eq((schema.documents as any).projectId, projectId),
          parentId ? eq((schema.documents as any).parentId, parentId) : isNull((schema.documents as any).parentId)
        )
      );

    const maxSort = (existingDocs as any[]).reduce((max, doc) => Math.max(max, doc.sort), -1);

    const docId = uuid();

    // 创建文档
    await db.insert(schema.documents).values({
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
    });

    const newDocList = await db
      .select()
      .from(schema.documents)
      .where(eq((schema.documents as any).id, docId))
      .limit(1);

    return NextResponse.json({
      success: true,
      document: newDocList[0],
    });
  } catch (error) {
    console.error('创建文档错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
