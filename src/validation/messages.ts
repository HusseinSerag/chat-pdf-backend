import * as z from "zod";

export const getMessages = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});

export type GetMessages = z.infer<typeof getMessages>;
