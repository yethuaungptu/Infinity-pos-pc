import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.cloud.prisma',
  migrations: {
    path: 'prisma/migrations-cloud',
  },
  datasource: {
    url: process.env.DATABASE_URL_CLOUD,
  },
});
