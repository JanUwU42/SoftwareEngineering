import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

declare global {
	var __prisma: PrismaClient | undefined;
}

let _prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
	// During build, return a dummy proxy - it won't actually be called
	if (building) {
		return new Proxy({} as PrismaClient, {
			get() {
				throw new Error('Prisma client should not be accessed during build');
			}
		});
	}

	// Return cached instance if available
	if (_prisma) {
		return _prisma;
	}

	// Check global for dev hot-reload persistence
	if (globalThis.__prisma) {
		_prisma = globalThis.__prisma;
		return _prisma;
	}

	// Get DATABASE_URL from SvelteKit's dynamic env (loaded from .env at runtime)
	const connectionString = env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	// Create the Prisma client with pg adapter
	const pool = new pg.Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	_prisma = new PrismaClient({ adapter });

	// Cache globally in development to survive hot reloads
	if (process.env.NODE_ENV !== 'production') {
		globalThis.__prisma = _prisma;
	}

	return _prisma;
}

// Export a proxy that lazily initializes the real Prisma client on first access
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
	get(_target, prop: string | symbol) {
		const client = getPrismaClient();
		const value = Reflect.get(client, prop);
		// Bind methods to the client instance
		if (typeof value === 'function') {
			return value.bind(client);
		}
		return value;
	}
});