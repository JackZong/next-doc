import { 
  mysqlTable, 
  varchar, 
  text, 
  datetime, 
  int, 
  bigint,
  boolean
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ================================
// 用户表
// ================================
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  account: varchar('account', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  image: varchar('image', { length: 500 }),
  emailVerified: boolean('email_verified').notNull().default(false),
  // 角色: admin(管理员), editor(编辑者), viewer(查看者)
  role: varchar('role', { length: 20, enum: ['admin', 'editor', 'viewer'] }).notNull().default('viewer'),
  // 状态: active(活跃), disabled(禁用)
  status: varchar('status', { length: 20, enum: ['active', 'disabled'] }).notNull().default('active'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 项目表
// ================================
export const projects = mysqlTable('projects', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  // 项目标识（URL友好）
  identify: varchar('identify', { length: 100 }).notNull().unique(),
  description: text('description'),
  cover: varchar('cover', { length: 500 }),
  logo: varchar('logo', { length: 500 }),
  favicon: varchar('favicon', { length: 500 }),
  // 可见性: public(公开), private(私有), password(密码保护), token(Token访问)
  visibility: varchar('visibility', { length: 20, enum: ['public', 'private', 'password', 'token'] }).notNull().default('private'),
  password: varchar('password', { length: 255 }),
  // Token访问密钥
  accessToken: varchar('access_token', { length: 64 }),
  // 编辑器类型: markdown(Markdown编辑器), richtext(富文本编辑器)
  editorType: varchar('editor_type', { length: 20, enum: ['markdown', 'richtext'] }).notNull().default('markdown'),
  sort: int('sort').notNull().default(0),
  ownerId: varchar('owner_id', { length: 36 }).notNull().references(() => users.id),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 项目成员表
// ================================
export const projectMembers = mysqlTable('project_members', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  // 角色: owner(所有者), editor(编辑者), viewer(查看者)
  role: varchar('role', { length: 20, enum: ['owner', 'editor', 'viewer'] }).notNull().default('viewer'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 文档表
// ================================
export const documents = mysqlTable('documents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  parentId: varchar('parent_id', { length: 36 }),
  title: varchar('title', { length: 300 }).notNull(),
  // 文档标识
  identify: varchar('identify', { length: 100 }).notNull(),
  // 文档内容 (Markdown/HTML)
  content: text('content'),
  // 内容类型: markdown, richtext
  contentType: varchar('content_type', { length: 20, enum: ['markdown', 'richtext'] }).notNull().default('markdown'),
  sort: int('sort').notNull().default(0),
  // 状态: draft(草稿), published(已发布)
  status: varchar('status', { length: 20, enum: ['draft', 'published'] }).notNull().default('draft'),
  authorId: varchar('author_id', { length: 36 }).notNull().references(() => users.id),
  // 阅读次数
  viewCount: int('view_count').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 文档历史表
// ================================
export const documentHistory = mysqlTable('document_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  documentId: varchar('document_id', { length: 36 }).notNull().references(() => documents.id),
  content: text('content'),
  changeLog: text('change_log'),
  version: int('version').notNull(),
  authorId: varchar('author_id', { length: 36 }).notNull().references(() => users.id),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 评论表
// ================================
export const comments = mysqlTable('comments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  documentId: varchar('document_id', { length: 36 }).notNull().references(() => documents.id),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  content: text('content').notNull(),
  parentId: varchar('parent_id', { length: 36 }),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 附件表
// ================================
export const attachments = mysqlTable('attachments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id),
  documentId: varchar('document_id', { length: 36 }).references(() => documents.id),
  name: varchar('name', { length: 255 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploaderId: varchar('uploader_id', { length: 36 }).notNull().references(() => users.id),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 系统配置表
// ================================
export const systemConfig = mysqlTable('system_config', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 邮件验证码表
// ================================
export const emailVerifications = mysqlTable('email_verifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// 项目邀请表
// ================================
export const invitations = mysqlTable('invitations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  projectId: varchar('project_id', { length: 36 }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20, enum: ['editor', 'viewer'] }).notNull().default('viewer'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  inviterId: varchar('inviter_id', { length: 36 }).notNull().references(() => users.id),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
});

// ================================
// Better Auth 表
// ================================
export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: datetime('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const accounts = mysqlTable('accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: datetime('access_token_expires_at'),
  refreshTokenExpiresAt: datetime('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const verifications = mysqlTable('verifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at'),
  updatedAt: datetime('updated_at'),
});

// ================================
// 关系定义
// ================================
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  documents: many(documents),
  comments: many(comments),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  documents: many(documents),
  attachments: many(attachments),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [documents.authorId],
    references: [users.id],
  }),
  parent: one(documents, {
    fields: [documents.parentId],
    references: [documents.id],
  }),
  children: many(documents),
  history: many(documentHistory),
  comments: many(comments),
  attachments: many(attachments),
}));

export const documentHistoryRelations = relations(documentHistory, ({ one }) => ({
  document: one(documents, {
    fields: [documentHistory.documentId],
    references: [documents.id],
  }),
  author: one(users, {
    fields: [documentHistory.authorId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  document: one(documents, {
    fields: [comments.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  project: one(projects, {
    fields: [attachments.projectId],
    references: [projects.id],
  }),
  document: one(documents, {
    fields: [attachments.documentId],
    references: [documents.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploaderId],
    references: [users.id],
  }),
}));

// ================================
// 类型导出
// ================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentHistory = typeof documentHistory.$inferSelect;
export type NewDocumentHistory = typeof documentHistory.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
