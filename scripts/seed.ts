
import { getDb, getSchema } from '../src/lib/db';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Starting database seeding...');
  
  try {
    const db = await getDb();
    const schema = getSchema();
    const { users, accounts } = schema as any;

    const adminEmail = 'admin@example.com';
    const adminPassword = 'Password123';

    console.log(`Processing user: ${adminEmail}`);
    
    // 1. 查找或创建用户
    let userId: string;
    const existingUsers = await (db as any).select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    const hashedPassword = await hash(adminPassword, 10);

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`User found (ID: ${userId}). Updating password...`);
      await (db as any).update(users).set({ 
        password: hashedPassword,
        updatedAt: new Date() 
      }).where(eq(users.id, userId));
    } else {
      userId = uuidv4();
      console.log(`Creating new user (ID: ${userId})...`);
      await (db as any).insert(users).values({
        id: userId,
        account: 'admin',
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. 清理旧的 credential 账号
    console.log(`Cleaning up old credential accounts for user ${userId}...`);
    await (db as any).delete(accounts).where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.providerId, 'credential')
      )
    );

    // 3. 插入新的 account 记录
    console.log(`Creating fresh credential account...`);
    await (db as any).insert(accounts).values({
      id: uuidv4(),
      userId: userId,
      accountId: adminEmail,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('--- Seed Success ---');
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
