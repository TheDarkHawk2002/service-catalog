import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readCatalog(path) {
  let content;
  try {
    content = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Catalog JSON is invalid; source was left untouched: ${error.message}`);
  }
  if (!Array.isArray(parsed)) throw new Error('Catalog root must be a JSON array; source was left untouched.');
  const ids = new Set();
  for (const row of parsed) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id.trim()) {
      throw new Error('Catalog contains a record without a valid id; source was left untouched.');
    }
    if (ids.has(row.id)) throw new Error(`Catalog contains duplicate id "${row.id}"; source was left untouched.`);
    ids.add(row.id);
  }
  return parsed;
}

export async function writeCatalog(path, services) {
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(tempPath, `${JSON.stringify(services, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(tempPath, path);
  } catch (error) {
    try { await (await import('node:fs/promises')).unlink(tempPath); } catch { /* no temporary file to clean up */ }
    throw new Error(`Cannot safely write catalog ${path}: ${error.message}`);
  }
}
