import { randomUUID } from 'node:crypto';

const REQUIRED = ['name', 'description', 'owner', 'version'];
const ALLOWED = new Set([...REQUIRED, 'url', 'tags']);

export function validateService(input, existing = [], excludeId = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Service data must be a JSON object.');
  }
  for (const key of Object.keys(input)) {
    if (!ALLOWED.has(key)) throw new Error(`Unknown field: ${key}`);
  }
  const service = {
    name: String(input.name ?? '').trim(),
    description: String(input.description ?? '').trim(),
    owner: String(input.owner ?? '').trim(),
    version: String(input.version ?? '').trim(),
    url: String(input.url ?? '').trim(),
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : String(input.tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
  };
  const missing = REQUIRED.filter((key) => !service[key]);
  if (missing.length) throw new Error(`Missing required field(s): ${missing.join(', ')}`);
  if (service.name.length > 100) throw new Error('name must be 100 characters or fewer.');
  if (service.description.length > 1000) throw new Error('description must be 1000 characters or fewer.');
  if (service.owner.length > 100) throw new Error('owner must be 100 characters or fewer.');
  if (service.version.length > 40) throw new Error('version must be 40 characters or fewer.');
  if (service.url && !/^https?:\/\//i.test(service.url)) {
    throw new Error('url must start with http:// or https://.');
  }
  if (service.tags.some((tag) => tag.length > 40)) throw new Error('Each tag must be 40 characters or fewer.');
  const duplicate = existing.some((item) => item.id !== excludeId && item.name.toLocaleLowerCase() === service.name.toLocaleLowerCase());
  if (duplicate) throw new Error(`A service named "${service.name}" already exists.`);
  return service;
}

export function createService(input, existing, now = new Date()) {
  const service = validateService(input, existing);
  const timestamp = now.toISOString();
  return { id: randomUUID(), ...service, createdAt: timestamp, updatedAt: timestamp };
}

export function updateService(existing, id, changes, now = new Date()) {
  const current = existing.find((item) => item.id === id);
  if (!current) throw new Error(`No service found with id "${id}".`);
  const fields = [...REQUIRED, 'url', 'tags'];
  const candidate = Object.fromEntries(fields.map((key) => [key, current[key]]));
  const service = validateService({ ...candidate, ...changes }, existing, id);
  return { ...current, ...service, updatedAt: now.toISOString() };
}

export function searchServices(services, query) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [...services];
  return services.filter((service) =>
    [service.name, service.description, service.owner, service.version, service.url, ...service.tags]
      .some((value) => String(value ?? '').toLocaleLowerCase().includes(term)),
  );
}

export function sortServices(services) {
  return [...services].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
