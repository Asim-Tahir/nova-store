import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import * as script from "./unify-queries.ts";

async function setupEnvironment(tempDirName: string) {
  const projectDir = await mkdtemp(join(tmpdir(), tempDirName));
  const sourceDir = join(projectDir, "src/sql");
  const outputFile = join(projectDir, "NovaStore_Proje.sql");

  await mkdir(join(sourceDir, "chapter-10"), { recursive: true });
  await mkdir(join(sourceDir, "chapter-2", "nested"), { recursive: true });
  await writeFile(join(sourceDir, "chapter-10", "1.sql"), "SELECT 10;\n");
  await writeFile(join(sourceDir, "chapter-2", "10.sql"), "SELECT 10file;\n");
  await writeFile(join(sourceDir, "chapter-2", "2.sql"), "SELECT 2;\n");
  await writeFile(join(sourceDir, "chapter-2", "nested", "1.sql"), "SELECT nested;\n");
  await writeFile(join(sourceDir, "chapter-2", "notes.txt"), "not SQL\n");
  await writeFile(outputFile, "");

  return {
    projectDir,
    sourceDir,
    outputFile,
    cleanupEnvironment: () => rm(projectDir, { recursive: true, force: true }),
  };
}

test("joins SQL files recursively in alphanumeric folder and filename order", async () => {
  const { sourceDir, outputFile, cleanupEnvironment } = await setupEnvironment("unify-queries-");

  try {
    await script.unifyQueries?.(sourceDir, outputFile);

    assert.equal(
      await readFile(outputFile, "utf8"),
      "SELECT 2;\n\nSELECT 10file;\n\nSELECT nested;\n\nSELECT 10;\n",
    );
  } finally {
    await cleanupEnvironment();
  }
});

test("uses the source directory and output path passed to the CLI", async () => {
  const { projectDir, sourceDir, cleanupEnvironment } = await setupEnvironment("unify-queries-cli-");
  const outputFile = join(projectDir, "custom-query.sql");
  const scriptFile = fileURLToPath(new URL("./unify-queries.ts", import.meta.url));

  try {
    execFileSync(process.execPath, [scriptFile, sourceDir, outputFile]);

    assert.equal(
      await readFile(outputFile, "utf8"),
      "SELECT 2;\n\nSELECT 10file;\n\nSELECT nested;\n\nSELECT 10;\n",
    );
  } finally {
    await cleanupEnvironment();
  }
});

test("rejects a SQL source path that is not a directory", async () => {
  const { projectDir, outputFile, cleanupEnvironment } = await setupEnvironment("unify-queries-source-");
  const sourceFile = join(projectDir, "not-a-directory.sql");
  const scriptFile = fileURLToPath(new URL("./unify-queries.ts", import.meta.url));

  try {
    await writeFile(sourceFile, "not a source directory");
    const result = spawnSync(process.execPath, [scriptFile, sourceFile, outputFile], {
      encoding: "utf8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /SQL source path must be an existing directory/);
    assert.equal(await readFile(outputFile, "utf8"), "");
  } finally {
    await cleanupEnvironment();
  }
});

test("rejects an output path without a .sql extension", async () => {
  const { projectDir, sourceDir, cleanupEnvironment } = await setupEnvironment("unify-queries-output-");
  const outputFile = join(projectDir, "custom-query.txt");
  const scriptFile = fileURLToPath(new URL("./unify-queries.ts", import.meta.url));

  try {
    const result = spawnSync(process.execPath, [scriptFile, sourceDir, outputFile], {
      encoding: "utf8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /SQL output path must use the \.sql extension/);
    assert.deepEqual((await readdir(projectDir)).sort(), ["NovaStore_Proje.sql", "src"]);
  } finally {
    await cleanupEnvironment();
  }
});
