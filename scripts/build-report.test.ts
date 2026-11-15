import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildReport, prepareResultImages } from "./build-report.ts";

test("prepares one PNG image per result set", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));

  try {
    const files = await prepareResultImages(outputDir);

    assert.equal(files.length, 6);
    assert.ok(files.every((file) => file.endsWith(".png")));
    for (const file of files) {
      const png = await readFile(file);
      assert.deepEqual(
        png.subarray(0, 8),
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      assert.equal(png.readUInt32BE(16), 1280);
      assert.ok(png.readUInt32BE(20) > 0);
    }
    assert.deepEqual(
      (await readdir(outputDir)).sort(),
      files.map((file) => basename(file)).sort(),
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("builds PNG result images and a DOCX", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));
  const docxPath = join(outputDir, "documents", "NovaStore_Proje.docx");

  try {
    const files = await buildReport(outputDir, docxPath);
    const docx = await readFile(docxPath);
    const documentXml = execFileSync(
      "unzip",
      ["-p", docxPath, "word/document.xml"],
      { encoding: "utf8" },
    );

    assert.equal(files.length, 6);
    assert.ok(files.every((file) => file.endsWith(".png")));
    assert.deepEqual([...docx.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    assert.equal((documentXml.match(/<w:drawing\b/g) ?? []).length, 6);
    assert.ok(documentXml.includes("Consolas"));
    assert.ok(documentXml.includes("INNER JOIN"));
    assert.ok(documentXml.includes("DATEDIFF"));
    assert.deepEqual(
      (await readdir(outputDir)).sort(),
      [...files.map((file) => basename(file)), "documents"].sort(),
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("uses the DOCX path passed to the CLI", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));
  const docxPath = join(outputDir, "documents", "custom-report.docx");
  const imageDir = join(outputDir, "images");
  const scriptFile = fileURLToPath(new URL("./build-report.ts", import.meta.url));

  try {
    await mkdir(join(outputDir, "documents"), { recursive: true });
    await writeFile(docxPath, "existing file");
    execFileSync(process.execPath, ["--import", "tsx", scriptFile, imageDir, docxPath]);

    const docx = await readFile(docxPath);
    assert.deepEqual([...docx.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    assert.equal((await readdir(imageDir)).length, 6);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("rejects a DOCX path passed as the image output directory", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));
  const docxPath = join(outputDir, "custom-report.docx");
  const scriptFile = fileURLToPath(new URL("./build-report.ts", import.meta.url));

  try {
    await writeFile(docxPath, "existing file");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", scriptFile, docxPath],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /DOCX path.*second argument/i);
    assert.equal(await readFile(docxPath, "utf8"), "existing file");
    assert.deepEqual(await readdir(outputDir), ["custom-report.docx"]);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("rejects a DOCX output path without a .docx extension", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));
  const scriptFile = fileURLToPath(new URL("./build-report.ts", import.meta.url));

  try {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        scriptFile,
        join(outputDir, "images"),
        join(outputDir, "custom-report.txt"),
      ],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /second argument must be a DOCX.*\.docx/i);
    assert.deepEqual(await readdir(outputDir), []);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("rejects a file passed as the report image directory", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));
  const outputDir = join(projectDir, "images");
  const docxPath = join(projectDir, "report.docx");
  const scriptFile = fileURLToPath(new URL("./build-report.ts", import.meta.url));

  try {
    await writeFile(outputDir, "existing file");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", scriptFile, outputDir, docxPath],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /first argument must be a directory/i);
    assert.equal(await readFile(outputDir, "utf8"), "existing file");
    assert.deepEqual(await readdir(projectDir), ["images"]);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

