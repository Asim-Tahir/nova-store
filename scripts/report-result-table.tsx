/** @jsxRuntime automatic */
/** @jsxImportSource satori/jsx */

import { readFile } from "node:fs/promises";

import sharp from "sharp";
import satori from "satori";
import type { FC } from "satori/jsx";

import type { ResultSet } from "./build-report.ts";

const fontFiles = [
  ["Roboto", "roboto-latin-400-normal.woff", 400],
  ["RobotoExt", "roboto-latin-ext-400-normal.woff", 400],
  ["Roboto", "roboto-latin-700-normal.woff", 700],
  ["RobotoExt", "roboto-latin-ext-700-normal.woff", 700],
] as const;
const fonts = await Promise.all(
  fontFiles.map(async ([name, file, weight]) => ({
    name,
    data: await readFile(new URL(`../node_modules/@fontsource/roboto/files/${file}`, import.meta.url)),
    weight,
  })),
);

const ResultTable: FC<{ result: ResultSet; height: number }> = ({ result, height }) => (
  <table
    style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height,
      boxSizing: "border-box",
      backgroundColor: "#ffffff",
      color: "#17212f",
      fontFamily: "Roboto, RobotoExt",
    }}
  >
    <thead style={{ display: "flex", width: "100%" }}>
      <tr
        style={{
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          height: 55,
          backgroundColor: "#d6ebff",
          color: "#333333",
        }}
      >
        {result.table.headers.map((header) => (
          <th
            style={{
              flex: 1,
              boxSizing: "border-box",
              border: "1px solid #222222",
              padding: "13px 15px",
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {result.table.rows.map((row, rowIndex) => (
        <tr
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "100%",
            height: 55,
            backgroundColor: rowIndex % 2 ? "#f8fafc" : "#ffffff",
          }}
        >
          {row.map((cell) => (
            <td
              style={{
                flex: 1,
                boxSizing: "border-box",
                border: "1px solid #222222",
                padding: "13px 15px",
                fontSize: 17,
              }}
            >
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export async function renderReportResultTablePNG(result: ResultSet): Promise<Buffer> {
  const height = (result.table.rows.length + 1) * 55;
  const svg = await satori(<ResultTable result={result} height={height} />, {
    width: 1280,
    height,
    fonts,
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}