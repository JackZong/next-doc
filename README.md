# NextDoc

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-blue?logo=tailwind-css)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.0-8b5cf6)](https://www.better-auth.com/)

**NextDoc** is a modern, clean, and powerful documentation management and collaboration platform built with Next.js 16+. It aims to help teams manage knowledge bases and project documentation more efficiently through a premium UI/UX experience.

English | [简体中文](./README_zh.md)

## ✨ Features

- 🔐 **Authentication**: Powered by `Better-Auth`, supporting email registration, social login (GitHub/Google), **password reset**, and **mandatory email verification**.
- 📄 **Multi-project Management**: Create multiple documentation projects with flexible visibility settings (Public, Private, Password protected).
- 📝 **Premium Editing Experience**: Built-in **Markdown** editor with real-time preview to meet all creator needs.
- 👥 **Role-Based Access Control (RBAC)**: Three-tier roles including Admin, Editor, and Viewer.
- 🎨 **Modern UI**: Built with the latest Tailwind CSS 4.0 and Shadcn UI, featuring a sleek and premium **Dark Mode**.
- 📧 **Email System**: SMTP configuration for sending verification emails and password recovery links.
- 🛠️ **Admin Dashboard**: Integrated management panel to easily handle users, projects, and global system settings.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Auth**: [Better Auth](https://www.better-auth.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Form Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 🛠️ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/next-doc.git
cd next-doc
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your configurations:

```env
# Core Configuration
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Database (LibSQL/SQLite Example)
DATABASE_URL=file:./dev.db

# Social Login (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP Email Configuration (For verification and password reset)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

### 4. Initialize Database

```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Create default admin account
pnpm db:seed
```

> **Default Admin Account**:
> - Email: `admin@example.com`
> - Password: `Password123`

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the results.

## 📊 Database Configuration

NextDoc supports multiple database engines through Drizzle ORM. You can choose the database that fits your needs.

### 1. Switch Database Type

Modify the `DB_TYPE` variable in your `.env` file:

- **SQLite** (Default): Perfect for small teams or personal use, no extra setup required.
- **MySQL**: Suitable for medium to large-scale projects.
- **PostgreSQL**: Ideal for projects requiring advanced features or high scalability.

### 2. Configuration Examples

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

### 3. Sync Database Schema

After modifying `DB_TYPE` or updating your models, run the following commands:

```bash
# Generate migrations for the specific database
pnpm db:generate

# Push schema change to database
pnpm db:push
```

### 4. Visual Management

Run the following command to open Drizzle Studio:

```bash
pnpm db:studio
```

## 📸 Screenshots

### Login

![Login Page](public/screenshots/login.png)

### Dashboard

![Home Preview](public/screenshots/home.png)

### Project

![Project Page](public/screenshots/project.png)

- **Landing Page**: Modern glassmorphism design showcasing public projects.
- **Admin Panel**: Manage users, permissions, and system configurations.
- **User Settings**: Update profile and security settings (change password).

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

---
💡 If this project helps you, please give us a **Star** 🌟!
