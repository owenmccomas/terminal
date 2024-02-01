import { z } from "zod";
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const usernameRouter = createTRPCRouter({
  createUsername: publicProcedure
    .input(z.object({ userId: z.string(), username: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const existingUser = await db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Username is already taken' });
      }

      await db.user.update({
        where: { id: input.userId },
        data: { username: input.username },
      });
    }),

  updateUsername: publicProcedure
    .input(z.object({ userId: z.string(), newUsername: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const existingUser = await db.user.findUnique({
        where: { username: input.newUsername },
      });

      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Username is already taken' });
      }

      await db.user.update({
        where: { id: input.userId },
        data: { username: input.newUsername },
      });
    }),
});
