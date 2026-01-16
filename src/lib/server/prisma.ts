import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

declare global {
	var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
	// Try multiple environment variable names
	const connectionString =
		env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL || env.DATABASE_URL || env.PRISMA_DATABASE_URL;

	if (!connectionString) {
		throw new Error(
			'Database connection string not found. Please set POSTGRES_URL, DATABASE_URL, or PRISMA_DATABASE_URL environment variable.'
		);
	}

	// Check if this is a Prisma Accelerate URL (starts with prisma+postgres://)
	// Prisma Accelerate requires a different setup - for now we'll extract the underlying connection
	// or throw an error with helpful guidance
	if (
		connectionString.startsWith('prisma+postgres://') ||
		connectionString.startsWith('prisma://')
	) {
		throw new Error(
			'Prisma Accelerate URL detected. This application uses direct PostgreSQL connections via pg adapter. ' +
				'Please use a direct PostgreSQL connection string (POSTGRES_URL or POSTGRES_URL_NON_POOLING) from your Vercel Postgres settings, ' +
				'or set DATABASE_URL to a direct postgres:// connection string.'
		);
	}

	const pool = new pg.Pool({
		connectionString,
		ssl:
			connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production'
				? { rejectUnauthorized: false }
				: undefined,
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
