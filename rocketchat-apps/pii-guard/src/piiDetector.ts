export type PiiType = "PHONE" | "EMAIL" | "SOCIAL_LINK" | "SOCIAL_HANDLE";

export interface PiiDetection {
  blocked: boolean;
  types: PiiType[];
}

const PHONE_PATTERN = /(?:^|[^\d])(?:\+?84|0)[\s.()\-]*(?:3|5|7|8|9)(?:[\s.()\-]*[\dxX*]){8,9}(?=$|[^\d])/iu;
const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/iu;
const SOCIAL_LINK_PATTERN = /(?:https?:\/\/|www\.)?(?:zalo\.me|(?:m\.)?(?:facebook|fb)\.com|t\.me|telegram\.me|wa\.me|(?:www\.)?instagram\.com|linktr\.ee)\/[^\s]+/iu;
const SOCIAL_HANDLE_PATTERN = /\b(?:zalo|facebook|fb|messenger|telegram|whatsapp|instagram)\s*(?:id|nick|user(?:name)?|tài\s*khoản)?\s*[:=\-]\s*@?[a-z0-9][a-z0-9._-]{2,}\b/iu;

export function detectPii(text: string | undefined | null): PiiDetection {
  const value = text ?? "";
  const types: PiiType[] = [];

  if (PHONE_PATTERN.test(value)) types.push("PHONE");
  if (EMAIL_PATTERN.test(value)) types.push("EMAIL");
  if (SOCIAL_LINK_PATTERN.test(value)) types.push("SOCIAL_LINK");
  if (SOCIAL_HANDLE_PATTERN.test(value)) types.push("SOCIAL_HANDLE");

  return { blocked: types.length > 0, types };
}
