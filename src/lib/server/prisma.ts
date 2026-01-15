import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
// WICHTIG: Importiere env von SvelteKit, nicht process.env nutzen!
import { DATABASE_URL } from '$env/static/private';

declare global {
    var prisma: PrismaClient | undefined;
}

// Hier nutzen wir die importierte Variable
const connectionString = DATABASE_URL;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
    globalThis.prisma ||
    new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
