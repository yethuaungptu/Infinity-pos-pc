import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.resolve(__dirname, '..', '..');
const dbPath = path.join(rootPath, 'assets', 'agripos.db');

console.log('⚡ Creating fresh production database...');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
  if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
  console.log('  Removed existing database');
}

const assetsDir = path.dirname(dbPath);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

try {
  execSync('npx prisma db push --accept-data-loss --schema prisma/schema.prisma', {
    cwd: rootPath,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
  });
  console.log(`\n✓ Fresh production database created at: ${dbPath}`);

  // Concatenate all migration SQL files into a single schema.sql
  const migrationsDir = path.join(rootPath, 'prisma', 'migrations');
  const migrationDirs = fs.readdirSync(migrationsDir).sort();
  const allSqlParts = [];
  for (const dir of migrationDirs) {
    const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
    if (fs.existsSync(sqlFile)) {
      allSqlParts.push(`-- Migration: ${dir}\n${fs.readFileSync(sqlFile, 'utf-8')}`);
    }
  }
  const schemaSql = allSqlParts.join('\n\n');
  const schemaSqlPath = path.join(rootPath, 'assets', 'schema.sql');
  fs.writeFileSync(schemaSqlPath, schemaSql);
  console.log(`✓ Schema SQL written (${allSqlParts.length} migrations, ${schemaSql.length} bytes)`);

  // Copy to release/app/ (app root, inside the asar via "files" config)
  const appRootPath = path.join(rootPath, 'release', 'app', 'agripos.db');
  fs.copyFileSync(dbPath, appRootPath);
  console.log(`✓ Copied DB to app root: ${appRootPath}`);

  const appSqlPath = path.join(rootPath, 'release', 'app', 'schema.sql');
  fs.copyFileSync(schemaSqlPath, appSqlPath);
  console.log(`✓ Copied schema.sql to app root: ${appSqlPath}`);

  // Also copy to release/app/dist/ as fallback
  const distPath = path.join(rootPath, 'release', 'app', 'dist', 'agripos.db');
  fs.copyFileSync(dbPath, distPath);
  console.log(`✓ Copied DB to dist: ${distPath}`);

  const distSqlPath = path.join(rootPath, 'release', 'app', 'dist', 'schema.sql');
  fs.copyFileSync(schemaSqlPath, distSqlPath);
  console.log(`✓ Copied schema.sql to dist: ${distSqlPath}`);
} catch (err) {
  console.error('✗ Failed to create database:', err.message);
  process.exit(1);
}
