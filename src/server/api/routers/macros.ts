import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const macrosRouter = createTRPCRouter({
  // Add a new macro
  add: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string(),
        macros: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      await db.macro.create({
        data: {
          name: input.name,
          userId: input.userId,
          macros: input.macros,
        },
      });
    }),

  // Remove a macro
  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.macro.delete({
        where: {
          id: input.id,
        },
      });
    }),

  // List all macros for a user
  list: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.userId) {
        return [];
      }
      const macros = await db.macro.findMany({
        where: {
          userId: input.userId,
        },
      });

      return macros;
    }),
});
