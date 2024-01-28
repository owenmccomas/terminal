import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const noteRouter = createTRPCRouter({
  createNote: protectedProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Add logic to save the note to the database
      return await ctx.db.note.create({
        data: {
          title: input.title,
          content: input.content,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),
  // Additional note-related procedures can be added here
});

