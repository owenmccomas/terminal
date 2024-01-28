import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const noteRouter = createTRPCRouter({
  createNote: protectedProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.note.create({
        data: {
          title: input.title,
          content: input.content,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  // Fetch all note titles
  getAllNoteTitles: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.note.findMany({
        where: {
          createdBy: { id: ctx.session.user.id },
        },
        select: {
          title: true,
        },
      });
    }),

  // Fetch a specific note by title
  getNoteByTitle: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return await ctx.db.note.findFirst({
        where: {
          title: input,
          createdBy: { id: ctx.session.user.id },
        },
      });
    }),

  // Additional note-related procedures can be added here
});
