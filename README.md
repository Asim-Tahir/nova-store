# Nova Store

Nova Store is an e-commerce database for managing products, categories,
customers, and orders.

## Requirements

- Node.js 22.18 or later and npm
- Docker Desktop or another Docker Compose installation (for the local SQL
  Server database)
- A SQL Server client to run the `.sql` files against the local database
  - [![Install VS Code SQL Server in VS Code](https://img.shields.io/badge/Install%20SQL%20Server%20extension%20in-VS%20Code-007ACC?logo=visualstudiocode)](vscode:extension/ms-mssql.mssql) to connect to the local SQL Server and run the `.sql` files in VSCode.
  - Install [DBeaver](https://dbeaver.io/download/) or another SQL Server client if you prefer a Desktop DB client application.

## Install

From this directory, install the Node.js dependencies:

```sh
npm install
```

## Run SQL Server locally

1. Copy the example environment file and set a strong password for the SQL
   Server `sa` account:

   ```sh
   cp .env.example .env
   ```

   Edit `MSSQL_SA_PASSWORD` in `.env`. Docker Compose requires this variable.
   Keep `.env` private; it is ignored by Git.

2. Start the database container:

   ```sh
   docker compose up -d
   docker compose logs -f db
   ```

   Wait for SQL Server to finish starting, then stop following the logs with
   `Ctrl+C`. The server is available at `localhost,1433`.

3. Connect with a SQL Server client using login `sa` and the password from
   `.env`. Run the following files in order:

   - `src/sql/chapter-1/01-create-db-and-tables.sql`
   - `src/sql/chapter-2/01-seed-categories.sql`
   - `src/sql/chapter-2/02-seed-products.sql`
   - `src/sql/chapter-2/03-seed-customers.sql`
   - `src/sql/chapter-2/04-seed-orders.sql`

   You can then run the queries in `src/sql/chapter-3/`. The view in
   `src/sql/chapter-4/01-create-view.sql` is optional.

Stop the container when you are done:

```sh
docker compose down
```

The database data is stored in the `nova_store_data` Docker volume and remains
after stopping the container. To delete the database data as well, run
`docker compose down -v`.

## Scripts

### Run tests

Run the project's automated test suite:

```sh
npm test
```

### Combine SQL files

Combine the SQL files under `src/sql/` into `.output/NovaStore_Proje.sql`:

```sh
npm run unify-queries
```

You can pass a different source directory and output file:

```sh
npm run unify-queries -- src/sql .output/Combined.sql
```

### Generate a database diagram

Connect to the local SQL Server and generate a Mermaid diagram and convert this Mermaid diagram to PNG in
`.output/`. The command uses `MSSQL_SA_USERNAME` and `MSSQL_SA_PASSWORD` environment variables for the database connection settings in `.env`.

```sh
npm run generate-db-diagram
```

### Build the report

Generate six PNG result tables in `.output/report/` and a DOCX report at
`.output/NovaStore_Proje.docx`.

```sh
npm run build-report
```

You can provide a different image directory and DOCX path:

```sh
npm run build-report -- .output/images .output/NovaStore_Proje.docx
```

Relative output paths are resolved from the directory where you run the
command. The script creates missing output directories. It reads the SQL
statements from `src/sql/chapter-3/` and uses the result rows defined in the
script; it does not connect to SQL Server or run the queries.
