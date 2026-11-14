import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

test("writes to the output path passed to the CLI", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "unify-queries-output-"));
  const outputFile = join(projectDir, "custom-query.sql");
  const scriptFile = fileURLToPath(new URL("./unify-queries.ts", import.meta.url));

  try {
    execFileSync(process.execPath, [scriptFile, outputFile]);

    assert.match(await readFile(outputFile, "utf8"), /CREATE DATABASE NovaStoreDB;/);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});
