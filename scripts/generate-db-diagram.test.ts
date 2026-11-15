import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { run } from "@mermaid-js/mermaid-cli";
import { buildMermaidDiagram, resolveDiagramOutputPaths } from "./generate-db-diagram.ts";

const schema = [
  {
    schemaName: "dbo",
    tableName: "Categories",
    columns: [
      { name: "CategoryId", type: "int", nullable: false, primaryKey: true, foreignKey: false },
      { name: "CategoryName", type: "nvarchar", nullable: false, primaryKey: false, foreignKey: false },
    ],
    foreignKeys: [],
  },
  {
    schemaName: "dbo",
    tableName: "Products",
    columns: [
      { name: "ProductId", type: "int", nullable: false, primaryKey: true, foreignKey: false },
      { name: "CategoryId", type: "int", nullable: false, primaryKey: false, foreignKey: true },
    ],
    foreignKeys: [
      {
        name: "FK_ProductCategory",
        columns: ["CategoryId"],
        referencedSchema: "dbo",
        referencedTable: "Categories",
      },
    ],
  },
];

test("builds Mermaid ER entities and foreign-key relationships", () => {
  assert.equal(
    buildMermaidDiagram(schema),
    `erDiagram
    "dbo.Categories" {
        int CategoryId PK
        nvarchar CategoryName
    }
    "dbo.Products" {
        int ProductId PK
        int CategoryId FK
    }
    "dbo.Categories" ||--o{ "dbo.Products" : FK_ProductCategory
`,
  );
});

test("resolves custom Mermaid and PNG paths independently", () => {
  const paths = resolveDiagramOutputPaths(
    ".output/custom/schema.mmd",
    ".output/images/inventory.png",
  );

  assert.equal(paths.mermaidPath, resolve(process.cwd(), ".output/custom/schema.mmd"));
  assert.equal(paths.pngPath, resolve(process.cwd(), ".output/images/inventory.png"));
});

test("rejects output paths with the wrong extensions", () => {
  assert.throws(
    () => resolveDiagramOutputPaths(".output/schema.txt", ".output/schema.png"),
    /\.mmd/,
  );
  assert.throws(
    () => resolveDiagramOutputPaths(".output/schema.mmd", ".output/schema.svg"),
    /\.png/,
  );
});

test("requires each output parent path to be a directory", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-db-diagram-"));
  const filePath = join(outputDir, "not-a-directory");

  try {
    await writeFile(filePath, "existing file");
    assert.throws(
      () =>
        resolveDiagramOutputPaths(
          join(filePath, "schema.mmd"),
          join(outputDir, "schema.png"),
        ),
      /Mermaid output directory must be a directory/,
    );
    assert.throws(
      () =>
        resolveDiagramOutputPaths(
          join(outputDir, "schema.mmd"),
          join(filePath, "schema.png"),
        ),
      /PNG output directory must be a directory/,
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("rejects directories used as output files", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-db-diagram-"));
  const mermaidPath = join(outputDir, "schema.mmd");
  const pngPath = join(outputDir, "schema.png");

  try {
    await mkdir(mermaidPath);
    await mkdir(pngPath);
    assert.throws(
      () => resolveDiagramOutputPaths(mermaidPath, join(outputDir, "other.png")),
      /Mermaid output path must be a file/,
    );
    assert.throws(
      () => resolveDiagramOutputPaths(join(outputDir, "other.mmd"), pngPath),
      /PNG output path must be a file/,
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("renders a Mermaid diagram to PNG through the Node API", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-db-diagram-"));
  const inputPath = join(outputDir, "NovaStore_Proje.mmd");
  const outputPath = join(outputDir, "NovaStore_Proje.png") as `${string}.png`;

  try {
    await writeFile(inputPath, buildMermaidDiagram(schema));
    await run(inputPath, outputPath, { quiet: true });

    const png = await readFile(outputPath);
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.ok(png.readUInt32BE(16) > 0);
    assert.ok(png.readUInt32BE(20) > 0);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
