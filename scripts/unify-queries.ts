import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { styleText } from "node:util";
import { fileURLToPath } from "node:url";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function compareAlphanumeric(left: string, right: string): number {
  return collator.compare(left, right) || left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

async function findSqlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => findSqlFiles(resolve(directory, entry.name))),
  );

  return [
    ...entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sql"))
      .map((entry) => resolve(directory, entry.name)),
    ...nestedFiles.flat(),
  ];
}

export async function unifyQueries(sourceDir: string, outputFile: string): Promise<number> {
  const files = await findSqlFiles(sourceDir);
  files.sort((left, right) => {
    const leftPath = relative(sourceDir, left).split(sep).join("/");
    const rightPath = relative(sourceDir, right).split(sep).join("/");
    return compareAlphanumeric(leftPath, rightPath);
  });
  const queries = await Promise.all(files.map((file) => readFile(file, "utf8")));

  const output = queries.map((query) => query.trimEnd()).join("\n\n");
  await writeFile(outputFile, output ? `${output}\n` : "");
  return files.length;
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const outputFile = process.argv[2] ? resolve(process.argv[2]) : resolve(projectRoot, "NovaStore_Proje.sql");
  const count = await unifyQueries(resolve(projectRoot, "src/sql"), outputFile);

  console.log(`${styleText(["bgBlue", "white"], " INFO ")} Joined ${count} SQL files into ${outputFile}`);
}