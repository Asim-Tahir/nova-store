import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { describe } from "node:test";

import {
  validateDirectory,
  validateExtension,
  validateFile,
  validateNotExtension,
} from "./validation.ts";

async function setupValidationDirectory() {
  const path = await mkdtemp(join(tmpdir(), "nova-store-validation-"));

  return {
    path,
    cleanup: () => rm(path, { recursive: true, force: true }),
  };
}

describe("path validation", () => {
  test("accepts existing directories and optionally missing paths", async () => {
    const { path: root, cleanup } = await setupValidationDirectory();

    try {
      await validateDirectory(root);
      await validateDirectory(join(root, "new-directory"));
      await assert.rejects(
        validateDirectory(join(root, "new-directory"), "Source directory is required.", false),
        { message: "Source directory is required." },
      );
    } finally {
      await cleanup();
    }
  });

  test("rejects files and paths below files as directories", async () => {
    const { path: root, cleanup } = await setupValidationDirectory();
    const file = join(root, "file");

    try {
      await writeFile(file, "");
      await assert.rejects(validateDirectory(file), {
        message: "Must be a directory.",
      });
      await assert.rejects(validateDirectory(join(file, "nested")), {
        message: "Must be a directory.",
      });
    } finally {
      await cleanup();
    }
  });

  test("uses a custom error message when provided", async () => {
    const { path: root, cleanup } = await setupValidationDirectory();
    const file = join(root, "file");

    try {
      await writeFile(file, "");
      await assert.rejects(validateDirectory(file, "Images output must be a directory."), {
        message: "Images output must be a directory.",
      });
    } finally {
      await cleanup();
    }
  });

  test("validates extensions with configurable case sensitivity", () => {
    assert.doesNotThrow(() =>
      validateExtension("report.DOCX", ".docx", "Expected a DOCX file.", false),
    );
    assert.throws(
      () => validateExtension("report.txt", ".docx", "Expected a DOCX file."),
      { message: "Expected a DOCX file." },
    );
    assert.throws(
      () => validateExtension("report.DOCX", ".docx", "Expected a DOCX file."),
      { message: "Expected a DOCX file." },
    );
    assert.throws(
      () => validateNotExtension("report.DOCX", ".docx", "Use a separate image directory.", false),
      { message: "Use a separate image directory." },
    );
    assert.doesNotThrow(() =>
      validateNotExtension("images", ".docx", "Use a separate image directory.", false),
    );
  });

  test("accepts output files that do not exist and rejects directory paths", async () => {
    const { path: root, cleanup } = await setupValidationDirectory();
    const file = join(root, "file.txt");
    const directory = join(root, "directory");

    try {
      await writeFile(file, "");
      await mkdir(directory);

      await validateFile(file);
      await validateFile(join(root, "new-file.txt"));
      await assert.rejects(validateFile(directory, "Output path must be a file."), {
        message: "Output path must be a file.",
      });
    } finally {
      await cleanup();
    }
  });
});
