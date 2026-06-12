import { getCurrentAdminUser } from "@/lib/auth";
import { appointmentImportExampleRow, appointmentImportHeaders } from "@/lib/appointment-import";
import { createXlsxWorkbook } from "@/lib/simple-xlsx";

export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return Response.json({ error: "未授权" }, { status: 401 });
  }

  const data = createXlsxWorkbook([
    [...appointmentImportHeaders],
    [...appointmentImportExampleRow],
  ]);
  const filename = encodeURIComponent("预约导入模板.xlsx");

  return new Response(data, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${filename}`,
      "Cache-Control": "no-store",
    },
  });
}
