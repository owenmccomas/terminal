import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { db } from '~/server/db';

export const messageRouter = createTRPCRouter({
  // Endpoint to send a message
  sendMessage: publicProcedure
    .input(
      z.object({
        recipientUsername: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure the user is authenticated
      if (!ctx.session?.user) {
        throw new Error('You must be logged in to send messages.');
      }

      // Retrieve the recipient by username
      const recipient = await db.user.findUnique({
        where: { username: input.recipientUsername },
      });

      if (!recipient) {
        throw new Error('Recipient not found.');
      }

      // Create the message
      await db.message.create({
        data: {
          content: input.content,
          senderId: ctx.session.user.id, // Assuming ctx.session.user.id is the sender's user ID
          recipientId: recipient.id,
        },
      });

      return {
        success: true,
        message: 'Message sent successfully.',
      };
    }),
});
