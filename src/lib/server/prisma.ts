import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

declare global {
	var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
	const connectionString =
		env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL || env.DATABASE_URL || env.PRISMA_DATABASE_URL;

	if (!connectionString) {
		throw new Error(
			'Database connection string not found. Please set POSTGRES_URL, DATABASE_URL, or PRISMA_DATABASE_URL.'
		);
	}

	if (
		connectionString.startsWith('prisma+postgres://') ||
		connectionString.startsWith('prisma://')
	) {
		throw new Error(
			'Prisma Accelerate URL detected. Please use a direct PostgreSQL connection string.'
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
	if (building) {
		return new Proxy({} as PrismaClient, {
			get() {
				return new Proxy(() => {}, {
					get: () => () => Promise.resolve(null),
					apply: () => Promise.resolve(null)
				});
			}
		});
	}

	if (globalThis.__prisma) {
		return globalThis.__prisma;
	}

	const client = createPrismaClient();
	globalThis.__prisma = client;
	return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
	get(_target, prop: string | symbol) {
		return Reflect.get(getPrismaClient(), prop);
	}
});
