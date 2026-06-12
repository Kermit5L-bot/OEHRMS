import crypto from "crypto";

type AppointmentApprovedSms = {
  phone: string;
  appointmentNo: string;
  showroomName: string;
  visitDate: Date | string;
  timeSlot: string;
};

type AppointmentSubmittedSms = AppointmentApprovedSms;

type AliyunSmsResponse = {
  Code?: string;
  Message?: string;
  RequestId?: string;
  BizId?: string;
};

function getRequiredAliyunSmsConfig() {
  return getAliyunSmsConfig(process.env.ALIYUN_SMS_TEMPLATE_APPOINTMENT_APPROVED?.trim());
}

function getRequiredAliyunSubmittedSmsConfig() {
  return getAliyunSmsConfig(process.env.ALIYUN_SMS_TEMPLATE_APPOINTMENT_SUBMITTED?.trim());
}

function getAliyunSmsConfig(templateCode?: string) {
  const accessKeyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET?.trim();
  const signName = process.env.ALIYUN_SMS_SIGN_NAME?.trim();

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    return null;
  }

  return {
    accessKeyId,
    accessKeySecret,
    signName,
    templateCode,
    endpoint: process.env.ALIYUN_SMS_ENDPOINT?.trim() || "dysmsapi.aliyuncs.com",
    regionId: process.env.ALIYUN_SMS_REGION_ID?.trim() || "cn-hangzhou",
  };
}

function formatAliyunTimestamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatVisitDate(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getVisitTimeSlotLabel(value: string) {
  if (value === "morning") return "上午";
  if (value === "afternoon") return "下午";

  return value;
}

function percentEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/\+/g, "%20")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function buildSignedBody(params: Record<string, string>, accessKeySecret: string) {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
  const stringToSign = `POST&%2F&${percentEncode(canonicalizedQueryString)}`;
  const signature = crypto
    .createHmac("sha1", `${accessKeySecret}&`)
    .update(stringToSign)
    .digest("base64");

  return new URLSearchParams({
    ...params,
    Signature: signature,
  }).toString();
}

async function sendAppointmentSms(params: AppointmentApprovedSms, config: ReturnType<typeof getAliyunSmsConfig>, skippedMessage: string) {
  if (!config) {
    console.info(skippedMessage);
    return;
  }

  const templateParam = JSON.stringify({
    appointmentNo: params.appointmentNo,
    showroomName: params.showroomName,
    visitDate: formatVisitDate(params.visitDate),
    timeSlot: getVisitTimeSlotLabel(params.timeSlot),
  });
  const requestParams = {
    AccessKeyId: config.accessKeyId,
    Action: "SendSms",
    Format: "JSON",
    PhoneNumbers: params.phone,
    RegionId: config.regionId,
    SignName: config.signName,
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: "1.0",
    TemplateCode: config.templateCode,
    TemplateParam: templateParam,
    Timestamp: formatAliyunTimestamp(new Date()),
    Version: "2017-05-25",
  };

  const response = await fetch(`https://${config.endpoint}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildSignedBody(requestParams, config.accessKeySecret),
  });

  if (!response.ok) {
    throw new Error(`Aliyun SMS request failed with status ${response.status}`);
  }

  const result = (await response.json().catch(() => ({}))) as AliyunSmsResponse;
  if (result.Code !== "OK") {
    throw new Error(`Aliyun SMS rejected message: ${result.Code || "UNKNOWN"} ${result.Message || ""}`.trim());
  }
}

export async function sendAppointmentApprovedSms(params: AppointmentApprovedSms) {
  return sendAppointmentSms(params, getRequiredAliyunSmsConfig(), "SMS_SEND_SKIPPED: Aliyun approved SMS config is not complete");
}

export async function sendAppointmentSubmittedSms(params: AppointmentSubmittedSms) {
  return sendAppointmentSms(params, getRequiredAliyunSubmittedSmsConfig(), "SMS_SEND_SKIPPED: Aliyun submitted SMS config is not complete");
}
