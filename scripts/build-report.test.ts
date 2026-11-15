import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
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

  try {
    const files = await buildReport(outputDir);
    const docx = await readFile(join(outputDir, "NovaStore_Proje.docx"));
    const documentXml = execFileSync(
      "unzip",
      ["-p", join(outputDir, "NovaStore_Proje.docx"), "word/document.xml"],
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
      [...files.map((file) => basename(file)), "NovaStore_Proje.docx"].sort(),
    );
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("uses the DOCX filename passed to the CLI", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "nova-store-build-report-"));
  const scriptFile = fileURLToPath(new URL("./build-report.ts", import.meta.url));

  try {
    execFileSync(process.execPath, ["--import", "tsx", scriptFile, outputDir, "custom-report.docx"]);

    const docx = await readFile(join(outputDir, "custom-report.docx"));
    assert.deepEqual([...docx.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    assert.equal((await readdir(outputDir)).includes("NovaStore_Proje.docx"), false);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

