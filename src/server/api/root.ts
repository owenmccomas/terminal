import { postRouter } from "~/server/api/routers/post";
import { noteRouter } from "~/server/api/routers/saveNote";
import { createTRPCRouter } from "~/server/api/trpc";
import { bookmarkRouter } from "./routers/bookmarks";
import { macrosRouter } from "./routers/macros";
import { usernameRouter } from "./routers/username";
import { fileRouter } from "./routers/file";
import { messageRouter } from "./routers/message";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  note: noteRouter,
  bookmark: bookmarkRouter,
  macro: macrosRouter,
  username: usernameRouter,
  file: fileRouter,
  message: messageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
