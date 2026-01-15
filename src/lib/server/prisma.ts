import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
// Use dynamic import for Vercel compatibility (runtime instead of build-time)
import { env } from '$env/dynamic/private';

declare global {
    var prisma: PrismaClient | undefined;
}

// Use the dynamic environment variable
const connectionString = env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
    globalThis.prisma ||
    new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}