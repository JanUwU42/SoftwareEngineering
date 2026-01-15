import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

declare global {
	var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
	const connectionString = env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const pool = new pg.Pool({
		connectionString,
		ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
		max: 5,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 10000
	});

	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
	// During build, return a dummy proxy that will never actually be called
	if (building) {
		return new Proxy({} as PrismaClient, {
			get() {
				return new Proxy(() => {}, {
					get() {
						return () => Promise.resolve(null);
					},
					apply() {
						return Promise.resolve(null);
					}
				});
			}
		});
	}

	// Return cached instance if available
	if (globalThis.__prisma) {
		return globalThis.__prisma;
	}

	// Create new instance
	const client = createPrismaClient();

	// Cache globally to reuse across requests and survive hot reloads
	globalThis.__prisma = client;

	return client;
}

// Export the prisma client - lazily initialized on first use
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
	get(_target, prop: string | symbol) {
		const client = getPrismaClient();
		return Reflect.get(client, prop);
	}
});