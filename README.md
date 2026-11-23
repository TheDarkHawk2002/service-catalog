# Service Catalog

A small command-line tool for keeping a local catalog of software services. Each entry stores a name, description, owner, version, optional URL, tags, and timestamps. The project uses only Node.js built-in modules and stores data in JSON.

## Features

- List, add, update, delete, and search catalog entries
- Validate required fields, lengths, URLs, tags, and duplicate names
- Sort output consistently for quick scanning
- Write updates through a temporary file before replacing the catalog
- Preserve malformed input instead of silently replacing it
- Use a different local JSON file with `--file`

## Requirements

Node.js 20 or newer. No package installation is required.

## Examples

Run commands from the project directory:

```powershell
npm start -- list
npm start -- search --query "monitoring"
npm start -- add --name "Audit Console" --description "Review operational events" --owner "Platform Team" --version "1.2.0" --url "https://example.test/audit" --tags "operations,review"
npm start -- update --id "SERVICE_ID" --version "1.2.1"
npm start -- delete --id "SERVICE_ID"
```

Every command defaults to `data/services.json`. The CLI prints the generated service ID after adding an entry. To keep examples isolated, pass a separate path:

```powershell
npm start -- add --file work/services.json --name "Demo Service" --description "Local example" --owner "Demo Team" --version "0.1.0"
```

## Data and safe use

The checked-in catalog contains synthetic sample entries. The tool is local and does not make network requests; a URL is stored as metadata and is not contacted. Do not store credentials, private endpoints, or confidential service details in a public copy of this repository.
