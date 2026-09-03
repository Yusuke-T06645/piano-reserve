import { z } from "zod";
import { config, timeToMinutes } from "./config";

/** 個人情報は最小限のみ取得する(要件: 個人情報管理の仕組み) */
export const reservationFormSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
    slotStart: z.string().regex(/^\d{2}:\d{2}$/, "利用時間の形式が正しくありません"),
    slotEnd: z.string().regex(/^\d{2}:\d{2}$/, "利用時間の形式が正しくありません"),
    name: z.string().trim().min(1, "お名前を入力してください").max(60),
    email: z.string().trim().email("メールアドレスの形式が正しくありません"),
    phone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
    ageCategory: z.enum(["adult", "minor"], { message: "年齢区分を選択してください" }),
    guardianName: z.string().trim().max(60).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
    notes: z.string().trim().max(300).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
    agreedToTerms: z.literal(true, { message: "利用規約への同意が必要です" }),
    agreedToNoise: z.literal(true, { message: "近隣への配慮事項への同意が必要です" }),
    joinWaitlistIfFull: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.ageCategory === "minor" && !data.guardianName) {
      ctx.addIssue({
        code: "custom",
        path: ["guardianName"],
        message: "未成年の方は保護者のお名前が必要です",
      });
    }

    const start = timeToMinutes(data.slotStart);
    const end = timeToMinutes(data.slotEnd);
    const duration = end - start;
    const openMinutes = timeToMinutes(config.openTime);
    const closeMinutes = timeToMinutes(config.closeTime);

    if (
      duration <= 0 ||
      duration > config.maxUsageMinutes ||
      duration % config.granularityMinutes !== 0 ||
      start < openMinutes ||
      end > closeMinutes ||
      start % config.granularityMinutes !== 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["slotEnd"],
        message: `ご利用時間は${config.openTime}〜${config.closeTime}の間で、${config.granularityMinutes}分単位・最大${config.maxUsageMinutes}分で選択してください`,
      });
    }
  });

export type ReservationFormInput = z.infer<typeof reservationFormSchema>;

export const blackoutDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(1, "理由を入力してください").max(100),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
