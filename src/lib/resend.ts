import { Resend } from "resend";

const KEY = process.env.RESEND_API_KEY;
export const resend = KEY ? new Resend(KEY) : null;

export const DIGEST_FROM = process.env.DIGEST_FROM_EMAIL ?? "hooks@pixii.ai";
export const DIGEST_TO = process.env.DIGEST_TO_EMAIL ?? "";
