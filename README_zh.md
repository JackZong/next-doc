# NextDoc

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-blue?logo=tailwind-css)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.0-8b5cf6)](https://www.better-auth.com/)

**NextDoc** 是一款基于 Next.js 16+ 构建的现代、简洁、且功能强大的文档管理与协作平台。它旨在通过极致的 UI/UX 体验，帮助团队更高效地管理知识库和项目文档。

[English](./README.md) | 简体中文

## ✨ 核心特性

- 🔐 **身份验证**：基于 `Better-Auth` 实现，支持邮箱注册、社交登录（GitHub/Google）、**忘记密码重置**及**邮箱强制验证**。
- 📄 **多项目管理**：支持创建多个文档项目，可灵活设置项目可见性（公开、私有、密码访问）。
- 📝 **极致编辑体验**：支持 **Markdown** 实时预览编辑器，满足不同创作者的需求。
- 👥 **角色权限管理**：内置管理员 (Admin)、编辑者 (Editor)、查看者 (Viewer) 三级角色。
- 🎨 **精美现代 UI**：采用最新的 Tailwind CSS 4.0 和 Shadcn UI 组件库，完美支持高级感的**深色模式**。
- 📧 **完善的邮件系统**：支持 SMTP 配置，用于发送验证邮件和找回密码。
- 🛠️ **管理后台**：内置管理面板，轻松管理用户、项目及系统全局配置。

## 🚀 技术栈

- **框架**: [Next.js 16 (App Router)](https://nextjs.org/)
- **认证**: [Better Auth](https://www.better-auth.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **样式**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **组件库**: [Shadcn UI](https://ui.shadcn.com/)
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs/)
- **表单校验**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 🛠️ 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/next-doc.git
cd next-doc
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 环境配置

复制 `.env.example` 并重命名为 `.env`，填入您的配置：

```env
# 核心配置
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# 数据库 (LibSQL/SQLite 示例)
DATABASE_URL=file:./dev.db

# 社交登录 (可选)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP 邮件配置 (用于验证码和密码找回)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

### 4. 数据库初始化

```bash
# 生成迁移文件
pnpm db:generate

# 推送结构到数据库
pnpm db:push

# 创建默认管理员账号
pnpm db:seed
```

> **默认管理员账号**:
> - 邮箱: `admin@example.com`
> - 密码: `Password123`

### 5. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 📊 数据库配置与管理

NextDoc 基于 Drizzle ORM 支持多种数据库引擎。您可以根据项目规模选择合适的数据库。

### 1. 切换数据库类型

在 `.env` 文件中修改 `DB_TYPE` 变量：

- **SQLite** (默认): 适用于小型团队或个人使用，无需额外安装。
- **MySQL**: 适用于中大型项目。
- **PostgreSQL**: 适用于需要高级特性或高度可扩展的项目。

### 2. 具体配置方法

#### 📂 SQLite

```env
DB_TYPE=sqlite
SQLITE_PATH=./data/nextdoc.db
```

#### 🐬 MySQL

```env
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=next-doc
```

#### 🐘 PostgreSQL

```env
DB_TYPE=postgres
POSTGRES_URL=postgresql://user:password@localhost:5432/next-doc
```

### 3. 同步数据库结构

在修改 `DB_TYPE` 或更新模型后，请运行以下命令同步数据库：

```bash
# 生成对应数据库的迁移文件
pnpm db:generate

# 推送结构到数据库
pnpm db:push
```

### 4. 可视化管理

运行以下命令开启 Drizzle Studio，在浏览器中直接管理数据：

```bash
pnpm db:studio
```

## 📸 界面预览

### 登录

![登录页面](public/screenshots/login.png)

### 首页

![首页预览](public/screenshots/home.png)

### 项目

![项目页面](public/screenshots/project.png)

- **首页**: 展示公开的文档项目，采用现代玻璃拟态设计。
- **管理后台**: 可视化管理用户、权限及系统全局配置。
- **个人设置**: 修改资料、安全设置（修改密码）。

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

---
💡 如果这个项目对你有帮助，欢迎给一个 **Star** 🌟！
