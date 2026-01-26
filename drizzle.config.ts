import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const dbType = (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'mysql' | 'postgres';

const getConfigs = () => {
  switch (dbType) {
    case 'postgres':
      return {
        dialect: 'postgresql' as const,
        schema: './src/lib/db/schema/postgres.ts',
        out: './drizzle/postgres',
        dbCredentials: {
          url: process.env.POSTGRES_URL,
        },
      };
    case 'mysql':
      return {
        dialect: 'mysql' as const,
        schema: './src/lib/db/schema/mysql.ts',
        out: './drizzle/mysql',
        dbCredentials: {
          host: process.env.MYSQL_HOST,
          port: parseInt(process.env.MYSQL_PORT || '3306'),
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
        },
      };
    case 'sqlite':
    default:
      return {
        dialect: 'sqlite' as const,
        schema: './src/lib/db/schema/sqlite.ts',
        out: './drizzle/sqlite',
        dbCredentials: {
          url: process.env.SQLITE_PATH ? `file:${process.env.SQLITE_PATH}` : 'data/next-doc.db',
        },
      };
  }
};

export default defineConfig(getConfigs());
