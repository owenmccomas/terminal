import { url } from "inspector";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const fileRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const files = await db.file.findMany({
        where: {
          author: input.userId,
        },
      });
      if (!files) {
        throw new Error("No files found");
      }
      return files;
    }),

  grab: publicProcedure
    .input(
      z.object({
        fileId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const file = await db.file.findUnique({
        where: {
          id: input.fileId,
        },
      });
      if (!file) {
        throw new Error("No file found");
      }
      return file;
    }),

  upload: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        file: z.object({
          name: z.string(),
          url: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const file = await db.file.create({
        data: {
          name: input.file.name,
          url: input.file.url,
          author: input.userId,
        },
      });
      return file;
    }),
});
