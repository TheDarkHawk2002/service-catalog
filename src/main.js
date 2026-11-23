#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createService, searchServices, sortServices, updateService } from './catalog.js';
import { readCatalog, writeCatalog } from './store.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_FILE = resolve(ROOT, 'data', 'services.json');

function usage() {
  return `Service Catalog\n\nCommands:\n  list [--file PATH]\n  add --name TEXT --description TEXT --owner TEXT --version TEXT [--url URL] [--tags a,b] [--file PATH]\n  update --id ID [--name TEXT] [--description TEXT] [--owner TEXT] [--version TEXT] [--url URL] [--tags a,b] [--file PATH]\n  delete --id ID [--file PATH]\n  search --query TEXT [--file PATH]\n\nThe default catalog is data/services.json. Use --file to work with another local file.\n`;
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (!key) throw new Error('Empty option name.');
    if (options[key] !== undefined) throw new Error(`Option --${key} was supplied more than once.`);
    const value = args[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`Option --${key} needs a value.`);
    options[key] = value;
    i += 1;
  }
  return options;
}

function rejectUnknown(options, allowed) {
  const unknown = Object.keys(options).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`Unknown option(s): ${unknown.map((x) => `--${x}`).join(', ')}`);
}

function print(services) {
  const rows = sortServices(services);
  if (rows.length === 0) {
    console.log('No services found.');
    return;
  }
  for (const service of rows) {
    console.log(`${service.name}  [${service.id}]`);
    console.log(`  ${service.description}`);
    console.log(`  Owner: ${service.owner} | Version: ${service.version}${service.url ? ` | ${service.url}` : ''}`);
    if (service.tags?.length) console.log(`  Tags: ${service.tags.join(', ')}`);
  }
}

async function main(argv) {
  const [command, ...args] = argv;
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(usage());
    return 0;
  }
  if (!['list', 'add', 'update', 'delete', 'search'].includes(command)) throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  const options = parseArgs(args);
  const path = resolve(options.file ?? DEFAULT_FILE);
  delete options.file;
  const services = await readCatalog(path);

  if (command === 'list') {
    rejectUnknown(options, new Set());
    print(services);
    return 0;
  }
  if (command === 'search') {
    rejectUnknown(options, new Set(['query']));
    if (!options.query?.trim()) throw new Error('Provide a non-empty --query.');
    print(searchServices(services, options.query));
    return 0;
  }
  if (command === 'add') {
    rejectUnknown(options, new Set(['name', 'description', 'owner', 'version', 'url', 'tags']));
    const service = createService(options, services);
    services.push(service);
    await writeCatalog(path, services);
    console.log(`Added ${service.name} (${service.id}).`);
    return 0;
  }
  if (command === 'update') {
    rejectUnknown(options, new Set(['id', 'name', 'description', 'owner', 'version', 'url', 'tags']));
    if (!options.id?.trim()) throw new Error('Provide --id.');
    const { id, ...changes } = options;
    const index = services.findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`No service found with id "${id}".`);
    services[index] = updateService(services, id, changes);
    await writeCatalog(path, services);
    console.log(`Updated ${services[index].name} (${id}).`);
    return 0;
  }
  rejectUnknown(options, new Set(['id']));
  if (!options.id?.trim()) throw new Error('Provide --id.');
  const index = services.findIndex((item) => item.id === options.id);
  if (index < 0) throw new Error(`No service found with id "${options.id}".`);
  const [removed] = services.splice(index, 1);
  await writeCatalog(path, services);
  console.log(`Deleted ${removed.name} (${removed.id}).`);
  return 0;
}

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(`service-catalog: ${error.message}`);
  process.exitCode = 2;
});
