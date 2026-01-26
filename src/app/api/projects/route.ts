import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import {  getDbSync , getSchema } from '@/lib/db';

import { getCurrentUser } from '@/lib/auth';
import { eq, desc, or } from 'drizzle-orm';

// 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const tokenPayload = await getCurrentUser();
    const db = getDbSync() as any;
    const schema = getSchema();

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const onlyMine = searchParams.get('mine') === 'true';

    let projectList;
    
    if (tokenPayload && onlyMine) {
      // 获取用户参与的项目
      projectList = await db
        .select({
          id: (schema.projects as any).id,
          name: (schema.projects as any).name,
          identify: (schema.projects as any).identify,
          description: (schema.projects as any).description,
          cover: (schema.projects as any).cover,
          logo: (schema.projects as any).logo,
          favicon: (schema.projects as any).favicon,
          visibility: (schema.projects as any).visibility,
          ownerId: (schema.projects as any).ownerId,
          ownerName: (schema.users as any).name,
          createdAt: (schema.projects as any).createdAt,
          updatedAt: (schema.projects as any).updatedAt,
        })
        .from(schema.projects)
        .leftJoin(schema.users, eq((schema.projects as any).ownerId, (schema.users as any).id))
        .leftJoin(schema.projectMembers, eq((schema.projects as any).id, (schema.projectMembers as any).projectId))
        .where(
          or(
            eq((schema.projects as any).ownerId, tokenPayload.userId),
            eq((schema.projectMembers as any).userId, tokenPayload.userId)
          )
        )
        .orderBy(desc((schema.projects as any).updatedAt))
        .limit(limit)
        .offset(offset);
    } else if (tokenPayload) {
      // 已登录用户可以看到公开项目和自己参与的项目
      projectList = await db
        .select({
          id: (schema.projects as any).id,
          name: (schema.projects as any).name,
          identify: (schema.projects as any).identify,
          description: (schema.projects as any).description,
          cover: (schema.projects as any).cover,
          logo: (schema.projects as any).logo,
          favicon: (schema.projects as any).favicon,
          visibility: (schema.projects as any).visibility,
          ownerId: (schema.projects as any).ownerId,
          ownerName: (schema.users as any).name,
          createdAt: (schema.projects as any).createdAt,
          updatedAt: (schema.projects as any).updatedAt,
        })
        .from(schema.projects)
        .leftJoin(schema.users, eq((schema.projects as any).ownerId, (schema.users as any).id))
        .leftJoin(schema.projectMembers, eq((schema.projects as any).id, (schema.projectMembers as any).projectId))
        .where(
          or(
            eq((schema.projects as any).visibility, 'public'),
            eq((schema.projects as any).ownerId, tokenPayload.userId),
            eq((schema.projectMembers as any).userId, tokenPayload.userId)
          )
        )
        .orderBy(desc((schema.projects as any).updatedAt))
        .limit(limit)
        .offset(offset);
    } else {
      // 未登录用户只能看到公开项目
      projectList = await db
        .select({
          id: (schema.projects as any).id,
          name: (schema.projects as any).name,
          identify: (schema.projects as any).identify,
          description: (schema.projects as any).description,
          cover: (schema.projects as any).cover,
          logo: (schema.projects as any).logo,
          favicon: (schema.projects as any).favicon,
          visibility: (schema.projects as any).visibility,
          ownerId: (schema.projects as any).ownerId,
          ownerName: (schema.users as any).name,
          createdAt: (schema.projects as any).createdAt,
          updatedAt: (schema.projects as any).updatedAt,
        })
        .from(schema.projects)
        .leftJoin(schema.users, eq((schema.projects as any).ownerId, (schema.users as any).id))
        .where(eq((schema.projects as any).visibility, 'public'))
        .orderBy(desc((schema.projects as any).updatedAt))
        .limit(limit)
        .offset(offset);
    }

    // 去重（由于 LEFT JOIN 可能产生重复）
    const uniqueProjects = Array.from(
      new Map(projectList.map((p: any) => [p.id, p])).values()
    );

    return NextResponse.json({
      success: true,
      projects: uniqueProjects,
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 创建项目
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
    const { name, identify, description, visibility = 'private', password, editorType = 'markdown' } = body;

    // 参数验证
    if (!name || !identify) {
      return NextResponse.json(
        { error: '项目名称和标识不能为空' },
        { status: 400 }
      );
    }

    // 标识格式验证（只允许字母、数字、横杠）
    const identifyRegex = /^[a-zA-Z0-9-]+$/;
    if (!identifyRegex.test(identify)) {
      return NextResponse.json(
        { error: '项目标识只能包含字母、数字和横杠' },
        { status: 400 }
      );
    }

    const db = getDbSync() as any;
    const schema = getSchema();

    // 检查标识是否已存在
    const existingProjects = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);

    if (existingProjects.length > 0) {
      return NextResponse.json(
        { error: '该项目标识已被使用' },
        { status: 400 }
      );
    }

    const projectId = uuid();

    // 创建项目
    await db.insert(schema.projects).values({
      id: projectId,
      name,
      identify,
      description: description || null,
      visibility,
      password: visibility === 'password' ? password : null,
      editorType,
      ownerId: tokenPayload.userId,
      sort: 0,
    });

    // 添加所有者为项目成员
    await db.insert(schema.projectMembers).values({
      id: uuid(),
      projectId,
      userId: tokenPayload.userId,
      role: 'owner',
    });

    // 获取新创建的项目
    const newProjects = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).id, projectId))
      .limit(1);

    return NextResponse.json({
      success: true,
      project: newProjects[0],
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
