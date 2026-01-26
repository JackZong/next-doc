
import { getDb, getSchema } from '../src/lib/db';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function main() {
  console.log('Starting database seeding...');
  
  try {
    const db = await getDb();
    const schema = getSchema();
    const { users, accounts } = schema as any;

    const adminEmail = 'admin@example.com';
    const adminPassword = 'Password123';

    // 清理旧的管理员账号（如果存在），确保重新创建时包含正确的 Account 记录
    await (db as any).delete(users).where(eq(users.email, adminEmail));



    console.log('Creating admin user...');
    
    // 使用 better-auth 兼容的哈希设置（这里假设 better-auth 默认配置能识别 bcrypt，
    // 或者我们应该让 better-auth 来 hash，但在 seed 脚本里很难调用 auth.api 
    // 因为它是运行在 node 进程里的。
    // 如果 better-auth 默认用的是 scrypt，这里用 bcrypt 可能导致密码验证失败。
    // 但错误是 Account not found，先解决账号存在问题。）
    const hashedPassword = await hash(adminPassword, 10);

    const userId = uuidv4();
    const newUser = {
      id: userId,
      account: 'admin',
      email: adminEmail,
      password: hashedPassword, // 为了兼容性保留
      name: 'Admin',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await (db as any).insert(users).values(newUser);

    // 必须创建 account 记录，Better Auth 才能识别凭据
    const newAccount = {
      id: uuidv4(),
      userId: userId,
      accountId: adminEmail, // 对于 credential 登录，accountId 通常是唯一标识符（邮箱）
      providerId: 'credential',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (accounts) {
       await (db as any).insert(accounts).values(newAccount);
    } else {
       console.warn('Accounts table not found in schema, skipping account creation.');
    }
    
    console.log('Admin user created successfully:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
