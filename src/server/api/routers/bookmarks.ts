import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const bookmarkRouter = createTRPCRouter({
  add: publicProcedure
    .input(z.object({ name: z.string(), url: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await db.bookmark.create({
        data: {
          name: input.name,
          url: input.url,
          userId: input.userId,
        },
      });
    }),
  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.bookmark.delete({
        where: {
          id: input.id,
        },
      });
    }),
  list: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.userId) {
        return [];
      }
      const bookmarks = await db.bookmark.findMany({
        where: {
          userId: input.userId,
        },
      });

      return bookmarks;
    }),
});
