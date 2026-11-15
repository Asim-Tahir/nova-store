import { stat } from "node:fs/promises";
import { extname } from "node:path";

async function getPathStats(
  path: string,
  message: string,
  allowMissing: boolean,
) {
  return stat(path).catch((error: unknown) => {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "ENOENT" && allowMissing) {
        return undefined;
      }
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        throw new Error(message);
      }
    }
    throw error;
  });
}

export async function validateDirectory(
  path: string,
  message = "Must be a directory.",
  allowMissing = true,
): Promise<void> {
  const pathStats = await getPathStats(path, message, allowMissing);
  if (pathStats && !pathStats.isDirectory()) {
    throw new Error(message);
  }
}

export async function validateFile(
  path: string,
  message = "Must be a file.",
  allowMissing = true,
): Promise<void> {
  const pathStats = await getPathStats(path, message, allowMissing);
  if (pathStats?.isDirectory()) {
    throw new Error(message);
  }
}

export function validateExtension(
  path: string,
  extension: `.${string}`,
  message: string = `Path must use the ${extension} extension.`,
  caseSensitive = true,
): void {
  const pathExtension = extname(path);
  const matches = caseSensitive
    ? pathExtension === extension
    : pathExtension.toLowerCase() === extension.toLowerCase();
  if (!matches) {
    throw new Error(message);
  }
}

export function validateNotExtension(
  path: string,
  extension: `.${string}`,
  message: string = `Path must not use the ${extension} extension.`,
  caseSensitive = true,
): void {
  const pathExtension = extname(path);
  const matches = caseSensitive
    ? pathExtension === extension
    : pathExtension.toLowerCase() === extension.toLowerCase();
  if (matches) {
    throw new Error(message);
  }
}
