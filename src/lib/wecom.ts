type AppointmentNotification = {
  appointmentId: number;
  appointmentNo: string;
  showroomName: string;
  visitDate: string;
  visitTimeSlot: string;
  visitorCount: number;
  contactName: string;
  companyName: string;
  maskedPhone: string;
  internalContactInfo?: string | null;
  customerLevel?: string | null;
  needVehicle?: string | null;
  needAccommodation?: string | null;
  needDining?: string | null;
  giftPreparation?: string | null;
};

type WecomWebhookResponse = {
  errcode?: number;
  errmsg?: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getVisitTimeSlotLabel(value: string) {
  if (value === "morning") return "上午";
  if (value === "afternoon") return "下午";

  return value;
}

function getRequestLabel(value?: string | null) {
  if (value === "yes") return "需要";
  if (value === "no") return "不需要";
  if (value === "pending") return "待确认";

  return value || "待确认";
}

function getOptionalLine(label: string, value?: string | null) {
  return value ? `>${label}：${value}` : null;
}

function getReceptionNeedSummary(params: AppointmentNotification) {
  const items = [
    `车辆${getRequestLabel(params.needVehicle)}`,
    `住宿${getRequestLabel(params.needAccommodation)}`,
    `宴请${getRequestLabel(params.needDining)}`,
  ];

  if (params.giftPreparation) {
    items.push(`礼品${getRequestLabel(params.giftPreparation)}`);
  }

  return items.join(" / ");
}

function getAppointmentDetailUrl(appointmentId: number) {
  const baseUrl = process.env.APP_BASE_URL?.trim();
  if (!baseUrl) return null;

  return `${trimTrailingSlash(baseUrl)}/admin/appointments/${appointmentId}`;
}

function buildAppointmentMarkdown(params: AppointmentNotification) {
  const detailUrl = getAppointmentDetailUrl(params.appointmentId);
  const lines = [
    "## 新的展厅预约",
    `>预约编号：${params.appointmentNo}`,
    `>展厅：${params.showroomName}`,
    `>参观时间：${params.visitDate} ${getVisitTimeSlotLabel(params.visitTimeSlot)}`,
    `>参观人数：${params.visitorCount} 人`,
    `>客户：${params.contactName}`,
    `>公司：${params.companyName}`,
    `>手机号：${params.maskedPhone}`,
    getOptionalLine("内部对接人", params.internalContactInfo),
    getOptionalLine("来访客户级别", params.customerLevel),
    `>接待需求：${getReceptionNeedSummary(params)}`,
    "",
    detailUrl ? `[查看预约详情](${detailUrl})` : "请进入后台预约管理查看详情。",
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

export async function sendWecomAppointmentNotification(params: AppointmentNotification) {
  const webhookUrl = process.env.WECOM_APPOINTMENT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    console.info("WECOM_NOTIFY_SKIPPED: WECOM_APPOINTMENT_WEBHOOK_URL is not configured");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        content: buildAppointmentMarkdown(params),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`WeCom webhook request failed with status ${response.status}`);
  }

  const result = (await response.json().catch(() => ({}))) as WecomWebhookResponse;
  if (result.errcode && result.errcode !== 0) {
    throw new Error(`WeCom webhook rejected message: ${result.errcode} ${result.errmsg || ""}`.trim());
  }
}
