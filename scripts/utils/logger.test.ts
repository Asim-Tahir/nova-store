import assert from "node:assert/strict";
import { styleText } from "node:util";
import test from "node:test";

import logger from "./logger.ts";

const cases = [
  { method: "log", consoleMethod: "log", label: " LOG ", format: ["gray"] },
  { method: "info", consoleMethod: "info", label: " INFO ", format: ["bgBlue", "white"] },
  { method: "warn", consoleMethod: "warn", label: " WARN ", format: ["bgYellow", "black"] },
  { method: "error", consoleMethod: "error", label: " ERROR ", format: ["bgRed", "white"] },
  { method: "debug", consoleMethod: "debug", label: " DEBUG ", format: ["bgGray", "white"] },
  { method: "trace", consoleMethod: "trace", label: " TRACE ", format: ["bgGray", "white"] },
] as const;

for (const { method, consoleMethod, label, format } of cases) {
  test(`logger.${method} emits a styled label and forwards messages`, () => {
    const calls: unknown[][] = [];
    const original = Object.getOwnPropertyDescriptor(console, consoleMethod);

    Object.defineProperty(console, consoleMethod, {
      configurable: true,
      value: (...args: unknown[]) => calls.push(args),
    });

    try {
      logger[method]("message", { detail: true });

      assert.deepEqual(calls, [[styleText(format, label), "message", { detail: true }]]);
    } finally {
      if (original) {
        Object.defineProperty(console, consoleMethod, original);
      } else {
        Reflect.deleteProperty(console, consoleMethod);
      }
    }
  });
}