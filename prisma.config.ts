import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// For prisma generate, we don't need a real DATABASE_URL
// Only migrations and runtime need the actual connection string
// Using process.env with fallback to avoid build errors on Vercel
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  datasource: {
    url: databaseUrl,
  },

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  }
});