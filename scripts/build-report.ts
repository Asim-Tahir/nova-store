import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import sharp from "sharp";

import { renderReportResultTablePNG } from "./report-result-table.tsx";
import {
  logger,
  validateDirectory,
  validateExtension,
  validateFile,
  validateNotExtension,
} from "#scripts/utils";

export interface ResultTable {
  headers: string[];
  rows: string[][];
}

export interface ResultSet {
  id: string;
  title: string;
  table: ResultTable;
  caption: string;
  sqlFile: string;
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_DIR = resolve(projectRoot, ".output/report");
const DEFAULT_DOCX_PATH = resolve(projectRoot, ".output/NovaStore_Proje.docx");

export const RESULTS: ResultSet[] = [
  {
    id: "stock",
    title: "3.1 — Stok miktarı 20'nin altında olan ürünler",
    table: {
      headers: ["Ürün Adı", "Stok"],
      rows: [
        ["Bluetooth Hoparlör", "18"],
        ["Seramik Kupa Seti", "16"],
        ["Veri Yapıları Kitabı", "15"],
        ["Spor Ceket", "12"],
        ["Masa Lambası", "10"],
      ],
    },
    caption: "Stok eşiğinin altındaki 5 ürün, stok miktarı azalan sırada listelenmiştir.",
    sqlFile: "01-basic-listing.sql",
  },
  {
    id: "orders",
    title: "3.2 — Müşteri siparişleri",
    table: {
      headers: ["Müşteri", "Şehir", "Sipariş Tarihi", "Toplam Tutar (TL)"],
      rows: [
        ["Mehmet Demir", "Ankara", "25.08.2026 10:30", "1.798,00"],
        ["Ayşe Yılmaz", "İstanbul", "19.07.2026 13:30", "914,00"],
        ["Deniz Çelik", "Eskişehir", "08.06.2026 12:00", "1.149,40"],
        ["Zeynep Şahin", "Antalya", "22.05.2026 16:45", "419,80"],
        ["Can Arslan", "Bursa", "12.04.2026 09:15", "1.518,50"],
        ["Elif Kaya", "İzmir", "05.03.2026 14:00", "974,80"],
        ["Mehmet Demir", "Ankara", "20.02.2026 11:30", "1.498,50"],
        ["Ayşe Yılmaz", "İstanbul", "15.01.2026 10:00", "1.799,70"],
      ],
    },
    caption: "INNER JOIN ile müşteri ve sipariş kayıtları eşleştirilmiş, tarihe göre sıralanmıştır.",
    sqlFile: "02-data-join.sql",
  },
  {
    id: "purchases",
    title: "3.3 — Ayşe Yılmaz'ın satın aldığı ürünler",
    table: {
      headers: ["Müşteri", "Ürün", "Fiyat (TL)", "Kategori", "Adet"],
      rows: [
        ["Ayşe Yılmaz", "Kablosuz Kulaklık", "1.299,90", "Elektronik", "1"],
        ["Ayşe Yılmaz", "Seramik Kupa Seti", "249,90", "Ev ve Yaşam", "2"],
        ["Ayşe Yılmaz", "Güneş Kremi SPF 50", "319,50", "Kozmetik", "2"],
        ["Ayşe Yılmaz", "Veri Yapıları Kitabı", "275,00", "Kitap", "1"],
      ],
    },
    caption: "Beş tablo zincirleme JOIN edilerek müşterinin sipariş detayları ürün ve kategori adlarıyla gösterilmiştir.",
    sqlFile: "03-multiple-join-and-detail-reports.sql",
  },
  {
    id: "categories",
    title: "3.4 — Kategori başına ürün sayısı",
    table: {
      headers: ["Kategori", "Ürün Sayısı"],
      rows: [
        ["Elektronik", "2"],
        ["Ev ve Yaşam", "2"],
        ["Giyim", "2"],
        ["Kitap", "2"],
        ["Kozmetik", "2"],
      ],
    },
    caption: "LEFT JOIN sayesinde ürünü olmayan kategoriler de sonuçta yer alır; mevcut her kategoride 2 ürün vardır.",
    sqlFile: "04-group-and-aggregate.sql",
  },
  {
    id: "revenue",
    title: "3.5 — Müşteri bazında toplam ciro",
    table: {
      headers: ["Müşteri", "Toplam Ciro (TL)"],
      rows: [
        ["Mehmet Demir", "3.296,50"],
        ["Ayşe Yılmaz", "2.713,70"],
        ["Can Arslan", "1.518,50"],
        ["Deniz Çelik", "1.149,40"],
        ["Elif Kaya", "974,80"],
        ["Zeynep Şahin", "419,80"],
      ],
    },
    caption: "SUM ile sipariş tutarları müşteri bazında toplanmış ve en yüksek cirodan en düşüğe sıralanmıştır.",
    sqlFile: "05-turnover-analysis.sql",
  },
  {
    id: "order-age",
    title: "3.6 — Siparişlerin üzerinden geçen gün",
    table: {
      headers: ["Sipariş No", "Sipariş Tarihi", "Geçen Gün"],
      rows: [
        ["9", "15.01.2026", "304"],
        ["11", "20.02.2026", "268"],
        ["13", "05.03.2026", "255"],
        ["14", "12.04.2026", "217"],
        ["15", "22.05.2026", "177"],
        ["16", "08.06.2026", "160"],
        ["10", "19.07.2026", "119"],
        ["12", "25.08.2026", "82"],
      ],
    },
    caption: "DATEDIFF(day, OrderDate, GETDATE()) gün farkını hesaplar. Sonuçlar 15.11.2026 tarihli çalıştırmaya aittir.",
    sqlFile: "06-time-analysis.sql",
  },
];

export async function prepareResultImages(
  outputDir = DEFAULT_OUTPUT_DIR,
): Promise<string[]> {
  await mkdir(outputDir, { recursive: true });

  return Promise.all(
    RESULTS.map(async (result) => {
      const filePath = resolve(outputDir, `result-${result.id}.png`);
      await writeFile(filePath, await renderReportResultTablePNG(result));
      return filePath;
    }),
  );
}

async function createReportDocx(files: string[], outputPath: string): Promise<void> {
  const paragraphs = [
    new Paragraph({
      children: [new TextRun({ text: "NovaStoreDB — SQL Sorguları ve Sonuçları", size: 64, bold: true })],
      heading: HeadingLevel.TITLE,
      spacing: { before: 300, after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "3. Sorgulama ve Analiz", size: 40, bold: true })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 120 },
    }),
  ];

  for (const [index, result] of RESULTS.entries()) {
    const file = files[index];
    const queryPath = resolve(projectRoot, "src/sql/chapter-3", result.sqlFile);
    const querySource = await readFile(queryPath, "utf8");
    const queryStart = querySource.search(/^\s*SELECT\b/im);
    if (queryStart < 0) {
      throw new Error(`Could not find a SELECT statement in ${queryPath}`);
    }
    const query = querySource.slice(queryStart).trim();
    const semicolon = query.indexOf(";");
    const statement = semicolon < 0 ? query : query.slice(0, semicolon + 1);
    const codeLines = statement.split(/\r?\n/);
    const image = await readFile(file);
    const { width, height } = await sharp(image).metadata();
    if (!width || !height) {
      throw new Error(`Could not read dimensions for report image: ${file}`);
    }

    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: result.title, size: 36, bold: true })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SQL Kodu", size: 30, bold: true })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 120 },
      }),
      ...codeLines.map(
        (line, lineIndex) =>
          new Paragraph({
            shading: { type: "solid", fill: "F3F4F6" },
            indent: { left: 180, right: 180 },
            spacing: {
              before: lineIndex === 0 ? 100 : 0,
              after: lineIndex === codeLines.length - 1 ? 100 : 0,
              line: 260,
            },
            children: [new TextRun({ text: line || " ", font: "Consolas", size: 22 })],
          }),
      ),
      new Paragraph({
        children: [new TextRun({ text: "", size: 24 })],
        spacing: { before: 100, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Tablo Sonuçları", size: 30, bold: true })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 120 },
      }),
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new ImageRun({
            type: "png",
            data: image,
            transformation: {
              width: 600,
              height: Math.round((600 * height) / width),
            },
          }),
        ],
      }),
      new Paragraph({
        children: [new TextRun({ text: result.caption, size: 24 })],
        spacing: { before: 100, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "", size: 24 })],
        spacing: { before: 100, after: 120 },
      }),
    );
  }

  const document = new Document({ sections: [{ children: paragraphs }] });
  await writeFile(outputPath, await Packer.toBuffer(document));
}

export async function buildReport(
  outputDir = DEFAULT_OUTPUT_DIR,
  docxPath = DEFAULT_DOCX_PATH,
): Promise<string[]> {
  const resolvedOutputDir = resolve(projectRoot, outputDir);
  const resolvedDocxPath = resolve(projectRoot, docxPath);
  const files = await prepareResultImages(resolvedOutputDir);
  await mkdir(dirname(resolvedDocxPath), { recursive: true });
  await createReportDocx(files, resolvedDocxPath);
  return files;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const outputDir = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT_DIR;
  const docxPath = process.argv[3] ? resolve(process.argv[3]) : DEFAULT_DOCX_PATH;

  validateNotExtension(
    outputDir,
    ".docx",
    "The first argument must be the image output directory; pass the DOCX path as the second argument.",
    false,
  );
  validateExtension(
    docxPath,
    ".docx",
    "The second argument must be a DOCX output path ending in .docx.",
    false,
  );
  await validateDirectory(
    outputDir,
    "The first argument must be a directory for report images.",
  );
  await validateFile(docxPath, "The second argument must be a DOCX file path.");

  const files = await buildReport(outputDir, docxPath);

  logger.info(`Rendered ${files.length} PNG images in ${outputDir}`);
  logger.info(`DOCX: ${docxPath}`);
  logger.info(`Summary: ${JSON.stringify(files, null, 2)}`);
}
