import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { styleText } from "node:util";
import { fileURLToPath } from "node:url";

import { run } from "@mermaid-js/mermaid-cli";
import sql from "mssql";

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey: boolean;
}

export interface DatabaseForeignKey {
  name: string;
  columns: string[];
  referencedSchema: string;
  referencedTable: string;
}

export interface DatabaseTable {
  schemaName: string;
  tableName: string;
  columns: DatabaseColumn[];
  foreignKeys: DatabaseForeignKey[];
}

export interface DiagramOutputPaths {
  mermaidPath: `${string}.mmd`;
  pngPath: `${string}.png`;
}

interface ColumnRow {
  schemaName: string;
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface ForeignKeyRow {
  name: string;
  parentSchema: string;
  parentTable: string;
  parentColumn: string;
  referencedSchema: string;
  referencedTable: string;
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MERMAID_OUTPUT_PATH = ".output/NovaStore_Proje.mmd";
const DEFAULT_PNG_OUTPUT_PATH = ".output/NovaStore_Proje.png";

export function resolveDiagramOutputPaths(
  mermaidPath = DEFAULT_MERMAID_OUTPUT_PATH,
  pngPath = DEFAULT_PNG_OUTPUT_PATH,
): DiagramOutputPaths {
  if (extname(mermaidPath) !== ".mmd") {
    throw new Error("Mermaid output path must use the .mmd extension.");
  }
  if (extname(pngPath) !== ".png") {
    throw new Error("PNG output path must use the .png extension.");
  }

  return {
    mermaidPath: resolve(projectRoot, mermaidPath) as `${string}.mmd`,
    pngPath: resolve(projectRoot, pngPath) as `${string}.png`,
  };
}

function tableKey(schemaName: string, tableName: string): string {
  return JSON.stringify([schemaName, tableName]);
}

function mermaidEntityName(schemaName: string, tableName: string): string {
  const name = `${schemaName}.${tableName}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${name}"`;
}

function uniqueIdentifier(name: string, used: Set<string>): string {
  const base = name.replace(/[^A-Za-z0-9_]/g, "_");
  const identifier = /^[A-Za-z_]/.test(base) ? base : `_${base}`;
  let candidate = identifier;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = `${identifier}_${suffix}`;
    suffix += 1;
  }

  used.add(candidate);
  return candidate;
}

export function buildMermaidDiagram(tables: DatabaseTable[]): string {
  if (tables.length === 0) {
    throw new Error("No user tables found in the database.");
  }

  const tableIds = new Map<string, string>();
  for (const table of tables) {
    tableIds.set(tableKey(table.schemaName, table.tableName), mermaidEntityName(table.schemaName, table.tableName));
  }

  const entities = tables.map((table) => {
    const columnIds = new Set<string>();
    const columns = table.columns.map((column) => {
      const name = uniqueIdentifier(column.name, columnIds);
      const keys = [column.primaryKey && "PK", column.foreignKey && "FK"].filter(Boolean);
      return `        ${column.type} ${name}${keys.length ? ` ${keys.join(", ")}` : ""}`;
    });

    return `    ${tableIds.get(tableKey(table.schemaName, table.tableName))} {\n${columns.join("\n")}\n    }`;
  });

  const relationships = tables.flatMap((table) =>
    table.foreignKeys.map((foreignKey) => {
      const childId = tableIds.get(tableKey(table.schemaName, table.tableName));
      const parentId = tableIds.get(
        tableKey(foreignKey.referencedSchema, foreignKey.referencedTable),
      );
      if (!parentId || !childId) {
        throw new Error(`Foreign key "${foreignKey.name}" references a table missing from the schema.`);
      }

      const optionalParent = foreignKey.columns.some((columnName) => {
        const column = table.columns.find((item) => item.name === columnName);
        if (!column) {
          throw new Error(`Foreign key "${foreignKey.name}" references missing column "${columnName}".`);
        }
        return column.nullable;
      });

      const parentCardinality = optionalParent ? "o|" : "||";
      const label = uniqueIdentifier(foreignKey.name, new Set<string>());
      return `    ${parentId} ${parentCardinality}--o{ ${childId} : ${label}`;
    }),
  );

  return `erDiagram\n${[...entities, ...relationships].join("\n")}\n`;
}

async function getDatabaseSchema(pool: sql.ConnectionPool): Promise<DatabaseTable[]> {
  const [columnResult, foreignKeyResult] = await Promise.all([
    pool.request().query<ColumnRow>(`
      SELECT
        s.name AS schemaName,
        t.name AS tableName,
        c.name AS columnName,
        ty.name AS dataType,
        c.is_nullable AS isNullable,
        CONVERT(bit, CASE WHEN pk.column_id IS NULL THEN 0 ELSE 1 END) AS isPrimaryKey,
        CONVERT(bit, CASE WHEN fk.parent_column_id IS NULL THEN 0 ELSE 1 END) AS isForeignKey
      FROM sys.tables AS t
      INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
      INNER JOIN sys.columns AS c ON c.object_id = t.object_id
      INNER JOIN sys.types AS ty ON ty.user_type_id = c.user_type_id
      LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.indexes AS i
        INNER JOIN sys.index_columns AS ic
          ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
      ) AS pk ON pk.object_id = c.object_id AND pk.column_id = c.column_id
      LEFT JOIN (
        SELECT DISTINCT parent_object_id, parent_column_id
        FROM sys.foreign_key_columns
      ) AS fk ON fk.parent_object_id = c.object_id AND fk.parent_column_id = c.column_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name, c.column_id;
    `),
    pool.request().query<ForeignKeyRow>(`
      SELECT
        fk.name AS name,
        ps.name AS parentSchema,
        pt.name AS parentTable,
        pc.name AS parentColumn,
        rs.name AS referencedSchema,
        rt.name AS referencedTable
      FROM sys.foreign_keys AS fk
      INNER JOIN sys.foreign_key_columns AS fkc ON fkc.constraint_object_id = fk.object_id
      INNER JOIN sys.tables AS pt ON pt.object_id = fkc.parent_object_id
      INNER JOIN sys.schemas AS ps ON ps.schema_id = pt.schema_id
      INNER JOIN sys.columns AS pc
        ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
      INNER JOIN sys.tables AS rt ON rt.object_id = fkc.referenced_object_id
      INNER JOIN sys.schemas AS rs ON rs.schema_id = rt.schema_id
      ORDER BY fk.object_id, fkc.constraint_column_id;
    `),
  ]);

  const tables = new Map<string, DatabaseTable>();

  for (const row of columnResult.recordset) {
    const key = tableKey(row.schemaName, row.tableName);
    let table = tables.get(key);

    if (!table) {
      table = { schemaName: row.schemaName, tableName: row.tableName, columns: [], foreignKeys: [] };
      tables.set(key, table);
    }

    table.columns.push({
      name: row.columnName,
      type: row.dataType,
      nullable: row.isNullable,
      primaryKey: row.isPrimaryKey,
      foreignKey: row.isForeignKey,
    });
  }

  const foreignKeys = new Map<string, DatabaseForeignKey>();
  for (const row of foreignKeyResult.recordset) {
    const key = JSON.stringify([row.parentSchema, row.parentTable, row.name]);
    let foreignKey = foreignKeys.get(key);
    if (!foreignKey) {
      foreignKey = {
        name: row.name,
        columns: [],
        referencedSchema: row.referencedSchema,
        referencedTable: row.referencedTable,
      };
      foreignKeys.set(key, foreignKey);
      tables.get(tableKey(row.parentSchema, row.parentTable))?.foreignKeys.push(foreignKey);
    }
    foreignKey.columns.push(row.parentColumn);
  }

  return [...tables.values()];
}

async function generateDatabaseDiagram(
  mermaidPath = DEFAULT_MERMAID_OUTPUT_PATH,
  pngPath = DEFAULT_PNG_OUTPUT_PATH,
): Promise<DiagramOutputPaths> {
  const envFile = resolve(projectRoot, ".env");
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }

  const username = process.env.MSSQL_SA_USERNAME;
  const password = process.env.MSSQL_SA_PASSWORD;
  if (!username || !password) {
    throw new Error("Set MSSQL_SA_USERNAME and MSSQL_SA_PASSWORD in the environment or .env file.");
  }

  const server = process.env.MSSQL_SERVER ?? "localhost";
  const port = Number(process.env.MSSQL_PORT ?? "1433");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("MSSQL_PORT must be an integer between 1 and 65535.");
  }
  const paths = resolveDiagramOutputPaths(mermaidPath, pngPath);

  const pool = new sql.ConnectionPool({
    server,
    port,
    user: username,
    password,
    database: process.env.MSSQL_DATABASE ?? "NovaStoreDB",
    options: {
      encrypt: true,
      trustServerCertificate:
        process.env.MSSQL_TRUST_SERVER_CERTIFICATE === "true" ||
        server === "localhost" ||
        server === "127.0.0.1",
    },
  });

  try {
    await pool.connect();
    const diagram = buildMermaidDiagram(await getDatabaseSchema(pool));
    await Promise.all([
      mkdir(dirname(paths.mermaidPath), { recursive: true }),
      mkdir(dirname(paths.pngPath), { recursive: true }),
    ]);
    await writeFile(paths.mermaidPath, diagram);
    await run(paths.mermaidPath, paths.pngPath, { quiet: true });
    return paths;
  } finally {
    await pool.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const mermaidPath = process.argv[2] ?? DEFAULT_MERMAID_OUTPUT_PATH;
  const pngPath = process.argv[3] ?? DEFAULT_PNG_OUTPUT_PATH;
  const paths = await generateDatabaseDiagram(mermaidPath, pngPath);
  console.log(
    `${styleText(["bgBlue", "white"], " INFO ")} Wrote ${paths.mermaidPath} and ${paths.pngPath}`,
  );
}