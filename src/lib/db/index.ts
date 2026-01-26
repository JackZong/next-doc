import { drizzle as drizzleSqlite, LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzlePostgres, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMysql, MySql2Database } from 'drizzle-orm/mysql2';
import { createClient } from '@libsql/client';
import postgres from 'postgres';
import mysql from 'mysql2/promise';
import * as sqliteSchema from './schema/sqlite';
import * as postgresSchema from './schema/postgres';
import * as mysqlSchema from './schema/mysql';

// 数据库类型
export type DatabaseType = 'sqlite' | 'mysql' | 'postgres';

// 获取当前数据库类型
export function getDatabaseType(): DatabaseType {
  const dbType = process.env.DB_TYPE as DatabaseType;
  return dbType || 'sqlite';
}

// SQLite 连接
function createSqliteConnection() {
  const dbUrl = process.env.SQLITE_PATH ? `file:${process.env.SQLITE_PATH}` : 'file:data/next-doc.db';
  const client = createClient({ url: dbUrl });
  return drizzleSqlite(client, { schema: sqliteSchema });
}

// PostgreSQL 连接
function createPostgresConnection() {
  const connectionString = process.env.POSTGRES_URL || 'postgresql://localhost:5432/next-doc';
  const client = postgres(connectionString);
  return drizzlePostgres(client, { schema: postgresSchema });
}

// MySQL 连接
function createMysqlConnection() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'next-doc',
  });
  return drizzleMysql(pool, { schema: mysqlSchema, mode: 'default' });
}

// 数据库定义类型
export type AppDb = any;

// 数据库实例缓存
let dbInstance: AppDb | null = null;

// 获取数据库连接（同步版本 - 支持所有数据库）
export function getDbSync(): AppDb {
  if (dbInstance) {
    return dbInstance;
  }

  const dbType = getDatabaseType();
  
  switch (dbType) {
    case 'sqlite':
      dbInstance = createSqliteConnection();
      break;
    case 'postgres':
      dbInstance = createPostgresConnection();
      break;
    case 'mysql':
      dbInstance = createMysqlConnection();
      break;
    default:
      throw new Error(`不支持的数据库类型: ${dbType}`);
  }

  return dbInstance;
}

// 获取数据库连接（兼容异步接口）
export async function getDb(): Promise<AppDb> {
  return getDbSync();
}

// 获取文档历史表名 (兼容性封装)
export function getSchema() {
  const dbType = getDatabaseType();
  switch (dbType) {
    case 'sqlite':
      return sqliteSchema;
    case 'postgres':
      return postgresSchema;
    case 'mysql':
      return mysqlSchema;
    default:
      return sqliteSchema;
  }
}

// 导出 Schema
export { sqliteSchema, postgresSchema, mysqlSchema };
