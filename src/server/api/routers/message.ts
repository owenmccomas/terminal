import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const messageRouter = createTRPCRouter({
  // Endpoint to send a message
  sendMessage: publicProcedure
    .input(
      z.object({
        recipientUsername: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure the user is authenticated
      if (!ctx.session?.user) {
        throw new Error("You must be logged in to send messages.");
      }

      // Retrieve the recipient by username
      const recipient = await db.user.findUnique({
        where: { username: input.recipientUsername },
      });

      if (!recipient) {
        throw new Error("Recipient not found.");
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
        message: "Message sent successfully.",
      };
    }),

  // Procedure to get user messages including sender's username
  getUserMessages: publicProcedure.input(z.string()).query(async ({ ctx }) => {
    // Ensure the user is authenticated
    if (!ctx.session?.user) {
      throw new Error("You must be logged in to retrieve messages.");
    }
    // Retrieve all messages for the current user, including the sender's details
    const messages = await db.message.findMany({
      where: { recipientId: ctx.session.user.id },
      include: {
        sender: true, // Include the sender's information
      },
      orderBy: {
        createdAt: "desc", // Optionally, order messages by creation time
      },
    });

    // Optionally, transform the messages to include the sender's username directly
    // This step is not strictly necessary but can simplify the data structure for the frontend
    const transformedMessages = messages.map((message) => ({
      ...message,
      senderUsername: message.sender.username,
    }));

    // Return the transformed messages
    return transformedMessages;
  }),

  // Procedure to find the username of the user based on their senderId
  findUsernameBySenderId: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // Retrieve the user by senderId
      const user = await db.user.findUnique({
        where: { id: input },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      return user.username;
    }),

    // Procedure to delete a message by its id
    deleteMessage: publicProcedure
      .input(z.string())
      .mutation(async ({ input, ctx }) => {
        // Ensure the user is authenticated
        if (!ctx.session?.user) {
          throw new Error("You must be logged in to delete messages.");
        }

        // Retrieve the message by its id
        const message = await db.message.findUnique({
          where: { id: parseInt(input) }, // Convert input to a number
        });

        if (!message) {
          throw new Error("Message not found.");
        }

        // Check if the user's id matches the recipient's id
        if (ctx.session.user.id !== message.recipientId) {
          throw new Error("You can only delete your own messages.");
        }

        // Delete the message
        await db.message.delete({
          where: { id: parseInt(input) },
        });

        return {
          success: true,
          message: "Message deleted successfully.",
        };
      }),
});
