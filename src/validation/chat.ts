import * as z from "zod";
export const getSingleZodChat = z.object({
  param: z.object({
    id: z.coerce.number(),
  }),
});
export type GetSingleChatType = z.infer<typeof getSingleZodChat>;
export const getChatZod = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .min(0, {
        message: "Page cannot be less than 0",
      })
      .optional(),
    offset: z.coerce
      .number()
      .min(0, {
        message: "offset cannot be less than 0",
      })
      .optional(),
    direction: z.union([z.literal("asc"), z.literal("desc")]).optional(),
    sort: z
      .union([
        z.literal("createdAt"),
        z.literal("pdfURL"),
        z.literal("pdfName"),
      ])
      .optional(),
  }),
});

export type GetChatType = z.infer<typeof getChatZod>;