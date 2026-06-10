type ExcelCellValue = string | number | boolean | Date | null | undefined;

export type ExcelSheet = {
  name: string;
  columns: string[];
  rows: ExcelCellValue[][];
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeCell(value: ExcelCellValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleString("zh-CN");
  const text = String(value);

  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function renderCell(value: ExcelCellValue) {
  return `<Cell><Data ss:Type="String">${escapeXml(normalizeCell(value))}</Data></Cell>`;
}

function renderSheet(sheet: ExcelSheet) {
  const header = sheet.columns.map(renderCell).join("");
  const rows = sheet.rows
    .map((row) => `<Row>${row.map(renderCell).join("")}</Row>`)
    .join("");

  return `<Worksheet ss:Name="${escapeXml(sheet.name)}"><Table><Row>${header}</Row>${rows}</Table></Worksheet>`;
}

export function createExcelWorkbook(sheet: ExcelSheet) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${renderSheet(sheet)}
</Workbook>`;
}

export function createExcelResponse(sheet: ExcelSheet, filename: string) {
  const workbook = createExcelWorkbook(sheet);
  const encodedFilename = encodeURIComponent(filename);

  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
