import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { isFileExists } from "./fs.ts";

test("checks file existence and rethrows errors other than ENOENT", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nova-store-file-"));
  const file = join(directory, "file");

  try {
    await writeFile(file, "");

    assert.equal(await isFileExists(file), true);
    assert.equal(await isFileExists(join(directory, "missing")), false);
    await assert.rejects(isFileExists(join(file, "nested")), { code: "ENOTDIR" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
