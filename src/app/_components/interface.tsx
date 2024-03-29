import { useState, useEffect, useRef } from "react";

import { signOut, useSession } from "next-auth/react";

import { signIn } from "next-auth/react";
import { UploadButton } from "./uploadthing";
import { api } from "~/trpc/react";

import BootSequence from "./boot-sequence";

import { getStockPrice } from "utils/stocks";

import { useUploadThing } from "../hooks/uploadthing";
import { File } from "@prisma/client";
import { create } from "domain";
import { set } from "zod";
import { get } from "http";


export default function Interface() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [noteContent, setNoteContent] = useState("");
  const [selectedNoteTitle, setSelectedNoteTitle] = useState("");
  const [textColor, setTextColor] = useState("#f59e0b");
  const [newFileName, setNewFileName] = useState<string | null>(null);
  const [fileToGrab, setFileToGrab] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const session = useSession();
  const context = api.useUtils();

  const deleteMacroHandler = api.macro.remove.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });

  const macroAddHandler = api.macro.add.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });

  const grabbedFile = api.file.grab.useQuery({ fileId: fileToGrab });

  const { data: files } =
    api.file.getAll.useQuery({ userId: session.data?.user.id! }) || [];

  const newUploadHandler = api.file.upload.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });

  useEffect(() => {}, [grabbedFile.data]);

  const { startUpload, permittedFileInfo } = useUploadThing("imageUploader", {
    onClientUploadComplete: () => {
      setOutput((prevOutput) => [
        ...prevOutput,
        `> File uploaded successfully`,
      ]);
    },
    onUploadError: () => {
      setOutput((prevOutput) => [...prevOutput, `> Error uploading file`]);
    },
    onUploadBegin: () => {
      setOutput((prevOutput) => [...prevOutput, `> Uploading file...`]);
    },
  });

  const userMacros = api.macro.list.useQuery({
    userId: session.data?.user.id,
  }).data;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInputClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const loadingDuration = 60000; // 60 seconds
    const ticksPerSecond = 60;
    const totalTicks = (loadingDuration / 1000) * ticksPerSecond;
    const incrementPerTick = 100 / totalTicks;

    const interval: number = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsContentLoaded(true);
          return 100;
        }
        return prev + incrementPerTick;
      });
    }, 1000 / ticksPerSecond) as unknown as number;

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const bookmarks = api.bookmark.list?.useQuery({
    userId: session.data?.user.id,
  }).data;

  const handleFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const createNoteMutation = api.note.createNote.useMutation({
    onSuccess: () => {
      // Actions to perform on successful note creation
      setOutput((prevOutput) => [
        ...prevOutput,
        `> Note titled '${noteTitle}' saved.`,
      ]);
      setNoteTitle("");
      setNoteContent("");
      setIsCreatingNote(false);
    },
    onError: (error: any) => {
      // Actions to perform on error
      console.error(error);
      setOutput((prevOutput) => [...prevOutput, `> Error saving note`]);
    },
  });

  const { data: allNotes, error: notesError } =
    api.note.getAllNoteTitles.useQuery();

  const fetchAllNotes = () => {
    if (notesError) {
      console.error("Error fetching notes", notesError);
      return ["Error fetching notes"];
    }
    return allNotes?.map((note: { title: any }) => note.title) ?? [];
  };

  const { data: selectedNote, isLoading: isLoadingSelectedNote } =
    api.note.getNoteByTitle.useQuery(selectedNoteTitle, {
      enabled: !!selectedNoteTitle,
    });

  useEffect(() => {
    if (!isLoadingSelectedNote) {
      if (selectedNoteTitle && selectedNote) {
        // Note is found
        setOutput((prevOutput) => [
          ...prevOutput,
          `> view ${selectedNote.title}`,
          selectedNote.content ?? "No content available",
        ]);
      } else if (selectedNoteTitle && !selectedNote) {
        // Note is not found
        setOutput((prevOutput) => [
          ...prevOutput,
          `> view ${selectedNoteTitle}`,
          "Note not found",
        ]);
      }
    }
  }, [selectedNote, selectedNoteTitle, isLoadingSelectedNote]);

  const addBookmarkHandler = api.bookmark.add.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });
  const deleteBookmarkHandler = api.bookmark.remove.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });

  const addBookmark = (name: string, url: string) => {
    if (!session.data) throw new Error("User not signed in");
    addBookmarkHandler.mutate({
      name,
      url: "https://" + url,
      userId: session.data?.user.id,
    });
    return `Bookmark '${name}' added.`;
  };

  const deleteBookmark = (name: string) => {
    if (!session.data) throw new Error("User not signed in");
    if (!bookmarks) throw new Error("Bookmarks not loaded");
    const bookmarkId = bookmarks?.find(
      (bookmark: { name: string }) => bookmark.name === name,
    )?.id;
    if (!bookmarkId) throw new Error("Bookmark not found");
    deleteBookmarkHandler.mutate({ id: bookmarkId });
    return `Bookmark '${name}' deleted.`;
  };

  function processNewNote(input: string) {
    if (!noteTitle) {
      // User is entering the title of the note
      setNoteTitle(input);
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${input}`,
        `> Note titled '${input}' created. Enter the content:`,
      ]);
    } else {
      // User is entering the content of the note
      setNoteContent(input);
      createNoteMutation.mutate({ title: noteTitle, content: input });
      if (!createNoteMutation.isLoading) {
        setOutput((prevOutput) => [...prevOutput, `Saving...`]);
      }
    }
  }

  const getTextStyle = (color: string) => {
    return {
      color: color,
      textShadow: `0 0 8px ${color}, 0 0 10px ${color}`,
    };
  };

  const changeTextColor = (color: string) => {
    setTextColor(color);
    localStorage.setItem("textColor", color);
  };

  useEffect(() => {
    const savedColor = localStorage.getItem("textColor");
    if (savedColor) {
      setTextColor(savedColor);
    }
    // Rest of your useEffect code
  }, []);

  useEffect(() => {
    if (fileToGrab) {
      grabbedFile.refetch();
    }
  }, [fileToGrab]);

  useEffect(() => {
    const totalTime = 1200; // Total time for loading in milliseconds (1.2 seconds)
    const intervalTime = 10; // Interval time in milliseconds
    const increment = (100 * intervalTime) / totalTime; // Increment per interval

    const interval = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        const nextProgress = prevProgress + increment;
        if (nextProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return nextProgress;
      });
    }, intervalTime);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const uploadFile = async () => {
    if (fileInputRef.current?.files?.length) {
      if (!session.data?.user) {
        setOutput((prevOutput) => [
          ...prevOutput,
          `> file upload`,
          `You are not signed in`,
        ]);
        return;
      }
      const file = await startUpload([fileInputRef.current?.files[0]!]);
      if (!file || !file[0]) {
        setOutput((prevOutput) => [
          ...prevOutput,
          `> file upload`,
          `Error uploading file`,
        ]);
        return;
      }
      newUploadHandler.mutate({
        file: {
          name: newFileName!,
          url: file[0].url,
        },
        userId: session.data?.user.id!,
      });
      setNewFileName(null);
    }
  };

  const handleUploadCommand = async (cmd: string, args: string[]) => {
    // we need upload, list, and delete commands.

    switch (args[1]) {
      case "upload":
        if (!session.data?.user) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} upload`,
            `You are not signed in`,
          ]);
          break;
        }
        if (!args[2]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} upload`,
            `Missing file name. Usage: file upload [file name]`,
          ]);
          break;
        }
        setNewFileName(args[2]);
        triggerFileInputClick();
        break;

      case "list":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd} list`,
          `Listing files...`,
        ]);

        if (files?.length) {
          files.forEach((file: { name: string; url: string; id: string }) => {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${file.name} | filetype: ${file.url.split(".").pop()} | fileId: ${file.id} |`,
            ]);
          });
        } else {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} list`,
            `No files found`,
          ]);
        }
        break;

      case "grab":
        if (!args[2]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} grab`,
            `Missing file id. Usage: file grab [file id]`,
          ]);
          break;
        }
        setFileToGrab(args[2]);
        const file = await grabbedFile.refetch();
        if (file.data.url) {
          window.open(file.data.url, "_blank");
        }
        break;

      case "getid":
        if (!args[2]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} getid`,
            `Missing file name. Usage: file getid [file name]`,
          ]);
          break;
        }
        const fileToGetId = files?.find((file: File) => file.name === args[2]);
        if (fileToGetId) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} getid`,
            `${fileToGetId.id}`,
          ]);
        } else {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} getid`,
            `File not found`,
          ]);
        }
        break;

      default:
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Unknown command: ${cmd}`,
        ]);
    }
  };

  const createUsernameHander = api.username.createUsername.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
    onError: (error) => {
      setOutput((prevOutput) => [...prevOutput, `Error: ${error.message}`]);
    },
  });

  const updateUsernameHandler = api.username.updateUsername.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
    onError: (error) => {
      setOutput((prevOutput) => [...prevOutput, `Error: ${error.message}`]);
    },
  });

  const createUsername = (userId: string, username: string) => {
    createUsernameHander.mutate({ userId: session.data?.user.id!, username });
    setOutput((prevOutput) => [...prevOutput, `Username created: ${username}`]);
  };

  const updateUsername = (userId: string, newUsername: string) => {
    updateUsernameHandler.mutate({
      userId: session.data?.user.id!,
      newUsername: newUsername,
    });

    setOutput((prevOutput) => [
      ...prevOutput,
      `Username updated to: ${newUsername}`,
    ]);
  };

  const sendMessage = api.message.sendMessage.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });
  const usernameQuery = api.username.getUsername.useQuery({
    userId: session.data?.user.id!,
  }).data?.username;

  const getMessages = api.message.getUserMessages.useQuery(
    session.data?.user.id!,
  ).data;

  const messageDeleteHandler = api.message.deleteMessage.useMutation({
    onSuccess: async () => {
      await context.invalidate();
    },
  });

  const processCommand = async (command: string) => {
    const args = command.split(" ");
    const cmd = args[0]?.toLowerCase() ?? "";
    const cmdArgs = args.slice(1).join(" ");

    switch (cmd) {
      case "help":
        const helpCommands = [
          "Commands:",
          "about       - Shows information about this terminal-like interface.",
          "bm          - Bookmark management. Subcommands: -add, -ls, -rm. Usage: bm [subcommand] [args]",
          "bot         - Interacts with an AI bot. Usage: bot ask [your question]",
          "clear       - Clears the terminal output.",
          "color       - Changes the text color of the terminal. Usage: color [hex color code] Note: This is stored in localStorage, so it will persist between sessions, but not devices.",
          "copylast    - Copies the specified number of last lines from the terminal output to the clipboard. Usage: copylast [number of lines]",
          "date        - Displays the current date.",
          "draw        - Generates ASCII art based on a prompt. Usage: draw [prompt]",
          "echo        - Repeats back the text you enter. Usage: echo [text]",
          "file        - File management. Subcommands: upload, list, grab. Usage: file [subcommand] [args]",
          "help        - Displays this help message.",
          "macro       - Macro management. Subcommands: -create, -ls, -rm. Usage: macro [subcommand] [args]",
          "messages    - View messages sent to you.",
          "newnote     - Starts the process to create a new note. Requires being signed in. Usage: newnote [follow prompts]",
          "open        - Opens a URL in a new tab. Usage: open [URL]",
          "search      - Searches the web for a query and opens the results in a new tab. Usage: search [query]",
          "signin      - Signs in a user. If already signed in, displays a welcome back message.",
          "signout     - Signs out the current user and displays a goodbye message.",
          "time        - Displays the current time.",
          "togglelines - Toggles the display of line numbers in the terminal.",
          "username    - Manage your username. Subcommands: -create, -edit. Usage: username [subcommand] [args]",
          "view        - Selects a note for viewing based on the title. Usage: view [note title]",
          "viewnotes   - Lists titles of all available notes.",
          "whisper     - Send a direct message to another user. Usage: whisper <username> '<message>'",
          "whoami      - Shows the name and username of the currently signed in user, or a message if not signed in.",
        ];

        helpCommands.forEach((command, index) => {
          setTimeout(() => {
            setOutput((prevOutput) => [...prevOutput, `${command}`]);
          }, index * 37);
        });
        break;

      case "clear":
        setOutput([]);
        break;
      case "about":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          "This is a terminal-like interface for your life. It is a work in progress. Visit the GitHub repository for more information",
          "Use command 'copylast' to grab the URL",
          "https://github.com/owenmccomas/terminal",
        ]);
        break;
      case "date":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Current Date: ${new Date().toLocaleDateString()}`,
        ]);
        break;
      case "time":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Current Time: ${new Date().toLocaleTimeString()}`,
        ]);
        break;
      case "echo":
        const normalizedCmdArgs = cmdArgs.toLowerCase().replace(/[?]/g, "");
        if (
          normalizedCmdArgs ===
          "what's it like to hold the hand of someone you love"
        ) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd} What's it like to hold the hand of someone you love?`,
            "Interlinked",
          ]);
        } else {
          setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, cmdArgs]);
        }
        break;
      case "signin":
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, "Checking..."]);
        if (!session.data) {
          await signIn();
        } else
          setOutput((prevOutput) => [
            ...prevOutput,
            `Welcome back, ${session.data?.user.name}`,
          ]);
        break;
      case "signout":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          "Signing Out...",
          "Goodbye",
        ]);
        if (session.data) {
          await signOut();
        } else
          setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, "Goodbye"]);
        break;
      case "whoami":
        if (session.data) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `You are ${session.data?.user.name}`,
            `Username: ${usernameQuery}`,
          ]);
        } else
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `You are not signed in`,
          ]);
        break;
      case "newnote":
        if (!session.data) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `You are not signed in`,
          ]);
        } else {
          setIsCreatingNote(true);
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Title your new note:`,
          ]);
        }
        break;

      // Inside processCommand function in Interface.tsx
      case "stock":
        const stockData = await getStockPrice(cmdArgs.toUpperCase());
        if (stockData) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> Stock: ${cmdArgs.toUpperCase()}`,
            `Date: ${stockData.date}`,
            `Open: ${stockData.open}`,
            `High: ${stockData.high}`,
            `Low: ${stockData.low}`,
            `Close: ${stockData.close}`,
            `Volume: ${stockData.volume}`,
          ]);
        } else {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> Error fetching data for ${cmdArgs}`,
          ]);
        }
        break;


      case "username":
        if (args[1] === "-create") {
          if (!args[2]) {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error: Missing username for creation",
            ]);
            return;
          }
          // Check if user id is defined before passing it to createUsername
          if (session.data?.user?.id) {
            createUsername(session.data.user.id, args[2]);
          } else {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error: Missing user id for creation",
            ]);
          }
        } else if (args[1] === "-edit") {
          if (!args[2]) {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error: Missing username for creation",
            ]);
            return;
          }
          // Check if user id is defined before passing it to updateUsername
          if (session.data?.user?.id) {
            updateUsername(session.data.user.id, args[2]);
          } else {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error: Missing user id for editing",
            ]);
          }
        } else {
          // Handle the case where the subcommand is not recognized
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            "Error: Invalid subcommand for 'username'",
          ]);
        }
        break;

      case "whisper": {
        const [_, username, message] = input
          .split(/(^\w+\s+)(\w+)\s+(.*)$/)
          .filter(Boolean);
        if (!username || !message) {
          setOutput([...output, 'Usage: whisper <username> "<message>"']);
          break;
        }

        // Add "sending..." message before initiating the send operation
        setOutput([...output, `Sending message to ${username}...`]);

        sendMessage.mutate(
          { recipientUsername: username, content: message },
          {
            onSuccess: () => {
              // Update to include a success message, replacing "sending..." message
              setOutput([...output, `Message whispered to ${username}`]);
            },
            onError: (error) => {
              // Keep "sending..." and add an error message if there's an issue
              setOutput([
                ...output,
                `Error whispering to ${username}: ${error.message}`,
              ]);
            },
          },
        );

        break;
      }

      case "messages":
        if (getMessages && getMessages.length > 0) {
          getMessages.forEach((message) => {
            const senderInfo = message.senderUsername || "Unknown sender";
            setOutput((prevOutput) => [
              ...prevOutput,
              `From: ${senderInfo} | ${message.content} | Id: ${message.id}`,
            ]);
          });
        } else {
          setOutput([...output, "No messages found"]);
        }
        break;
      case "message":
        if (args[1] === "rm") {
          if (!args[2]) {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              `Missing message id. Usage: message delete [message id]`,
            ]);
            break;
          }
          messageDeleteHandler.mutate(args[2]);
          if (messageDeleteHandler.isSuccess) {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Message deleted",
            ]);
          } else if (!messageDeleteHandler.isError) {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error deleting message, check the id",
            ]);
          }
          break;
        } else {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Unknown command: ${cmd} ${args[1]}`,
          ]);
        }
        break;

      case "viewnotes":
        const noteTitles = fetchAllNotes();
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, ...noteTitles]);
        break;
      case "view":
        setSelectedNoteTitle(cmdArgs);
        break;
      case "bot":
        await handleBotCommand(cmd, args);
        break;
      case "draw":
        await handleDrawCommand(cmd, args);
        break;
      case "open":
        handleOpenCommand(cmd, args);
        break;
      case "search":
        handleSearchCommand(cmd, args);
        break;
      case "copylast":
        await handleCopyLastCommand(cmd, args);
        break;
      // case "togglelines":
      //   handleToggleLinesCommand();
      //   break;
      case "bm":
        handleBookmarkCommand(cmd, args);
        break;
      case "color":
        handleColorCommand(cmd, args);
        break;
      case "macro":
        handleMacroCommand(cmd, args);
        break;
      case "file":
        handleUploadCommand(cmd, args);
        break;
      default:
        handleUnknownCommand(cmd);
    }
  };

  const handleMacroCommand = async (cmd: string, args: string[]) => {
    const macroArg = args[1] || "default";

    switch (macroArg) {
      case "-create":
        const macros = args.slice(3).join(" ").split("-");
        if (!args[2]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Missing macro name`,
          ]);
          break;
        }

        if (!args[3]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Missing macro command`,
          ]);
          break;
        }

        macroAddHandler.mutate({
          name: args[2]?.replace(/^"|"$/g, ""), // Remove quotes
          macros: macros,
          userId: session.data?.user.id!,
        });

        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, "macro added"]);
        break;

      case "-ls":
        if (userMacros?.length === 0) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `No macros found`,
          ]);
        } else {
          userMacros?.forEach((macro: { name: any }, index: number) => {
            setTimeout(() => {
              setOutput((prevOutput) => [...prevOutput, `> ${macro.name}`]);
            }, index * 100); // 100 milliseconds delay for each item
          });
        }
        break;

      case "-rm":
        if (!args[2]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Missing macro name`,
          ]);
          break;
        }
        const macroToRemove = args[2]?.replace(/^"|"$/g, "");
        const macroId = userMacros?.find(
          (b: { name: string }) => b.name === macroToRemove,
        )?.id;
        if (!macroId) {
          setOutput((prevOutput) => [...prevOutput, `> macro not found`]);
          break;
        }
        deleteMacroHandler.mutate({ id: macroId });
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, "removed"]);
        break;

      // You can add more subcommands here if needed

      default:
        // Treat as a macro name to open
        const macroNameToUse = macroArg.replace(/^"|"$/g, ""); // Remove quotes
        const macro = userMacros?.find(
          (b: { name: string }) => b.name === macroNameToUse,
        );
        console.log(macro?.macros);

        if (macro) {
          macro.macros.forEach((command: string, index: number) => {
            setTimeout(() => {
              processCommand(command.trim());
            }, index * 100); // 100 milliseconds delay for each item
          });
        } else {
          console.log("macro not found");
        }
    }
  };

  const handleBotCommand = async (cmd: string, args: string[]) => {
    if (args[1] === "ask") {
      const question = args.slice(2).join(" ");
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${cmd} ask ${question}`,
        `bot ${args[1]} thinking...`,
      ]);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: question }),
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const responseData = await response.json();
        setOutput((prevOutput) => [...prevOutput, `> ${responseData}`]);
      } catch (error) {
        console.error("Request failed:", error);
        setOutput((prevOutput) => [
          ...prevOutput,
          `> Error: ${error as string}`,
        ]);
      }
    } else {
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${cmd}`,
        `Unknown command: ${cmd}`,
      ]);
    }
  };

  const handleDrawCommand = async (cmd: string, args: string[]) => {
    const drawPrompt = args.slice(1).join(" ");
    setOutput((prevOutput) => [
      ...prevOutput,
      `> ${cmd} ${drawPrompt}`,
      `Drawing: ${drawPrompt}`,
    ]);
    try {
      const response = await fetch("/api/ascii", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: drawPrompt }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const asciiArt = await response.text();
      const asciiLines = asciiArt.split("\n");

      // Add each line of ASCII art directly without adding borders
      asciiLines.forEach((line) => {
        setOutput((prevOutput) => [...prevOutput, line]);
      });
      setOutput((prevOutput) => [
        ...prevOutput,
        `> End of drawing, maybe I need to work on my art skills`,
      ]);
    } catch (error) {
      console.error("Request failed:", error);
      setOutput((prevOutput) => [...prevOutput, `> Error: ${error as string}`]);
    }
  };

  const handleSearchCommand = (cmd: string, args: string[]) => {
    const searchQuery = args.slice(1).join(" ");
    window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
    setOutput((prevOutput) => [
      ...prevOutput,
      `> ${cmd}`,
      `Searching: ${searchQuery}`,
    ]);
  };

  const handleInputSubmit = async (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      if (isCreatingNote) {
        processNewNote(input);
      } else {
        await processCommand(input);
      }
      setInput("");
    }
  };

  const handleOpenCommand = (cmd: string, args: string[]) => {
    // check if https is included, and if not, automatically add it then open it in a new window
    if (!args[1]) {
      setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, `Missing URL`]);
      return;
    }

    const urlArg =
      args[1].includes("https://") || !args[1].includes(".")
        ? args[1]
        : `https://${args[1]}`;
    window.open(urlArg, "_blank");

    setOutput((prevOutput) => [
      ...prevOutput,
      `> ${cmd}`,
      `Opening: ${args[1]}`,
    ]);
  };

  const handleCopyLastCommand = async (cmd: string, args: string[]) => {
    const cmdArgs = args.slice(1).join(" ");

    const numLines = parseInt(cmdArgs, 10) || 1;
    const startIndex = Math.max(output.length - numLines, 0);
    const textToCopy = output.slice(startIndex).join("\n");
    if (navigator.clipboard && window.isSecureContext) {
      // Use clipboard API when available
      try {
        await navigator.clipboard.writeText(textToCopy);
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Copied ${numLines} line(s) to clipboard.`,
        ]);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Error: Unable to copy text to clipboard.`,
        ]);
      }
    } else {
      // Fallback method for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Copied ${numLines} line(s) to clipboard.`,
        ]);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Error: Unable to copy text to clipboard.`,
        ]);
      }
      document.body.removeChild(textArea);
    }
  };

  // Currently puts the formatting all out of whack

  // const handleToggleLinesCommand = () => {
  //   localStorage.setItem(
  //     "lineNumber",
  //     localStorage.getItem("lineNumber") === "showLines"
  //       ? "hideLines"
  //       : "showLines" || "showLines",
  //   );
  // };

  const handleBookmarkCommand = (cmd: string, args: string[]) => {
    if (args.length === 0) {
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${cmd}`,
        `Missing subcommand. Available subcommands: -add, -ls, -rm`,
      ]);
      return;
    }
    const bmSubCmd = args[1];

    const bmArgs = args.slice(1); // Get arguments after "bm"

    switch (bmSubCmd) {
      case "-add":
        console.log(bmArgs);
        if (!bmArgs[1]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Missing bookmark name`,
          ]);
          break;
        }
        if (!bmArgs[2]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Missing bookmark URL`,
          ]);
          break;
        }
        const bookmarkName = bmArgs[1]?.replace(/^"|"$/g, ""); // Remove quotes
        const bookmarkUrl = bmArgs[2];
        const addResult = addBookmark(bookmarkName, bookmarkUrl);
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, addResult]);
        break;

      case "-ls":
        if (bookmarks?.length === 0) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `No bookmarks found`,
          ]);
        } else {
          // Find the length of the longest bookmark name
          const maxLength = bookmarks?.reduce(
            (max: number, bookmark: { name: string | any[] }) =>
              Math.max(max, bookmark.name.length),
            0,
          );

          // Add a slight delay between each bookmark
          bookmarks?.forEach(
            (bookmark: { name: string; url: any }, index: number) => {
              setTimeout(() => {
                const paddedName = bookmark.name.padEnd(maxLength!, " "); // Pad the name
                setOutput((prevOutput) => [
                  ...prevOutput,
                  `> ${paddedName} | ${bookmark.url}`,
                ]);
              }, index * 100); // 100 milliseconds delay for each item
            },
          );
        }
        break;

      case "-rm":
        if (!bmArgs[1]) {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Missing bookmark name`,
          ]);
          break;
        }
        const bookmarkToRemove = bmArgs[1]?.replace(/^"|"$/g, ""); // Remove quotes
        const removeResult = deleteBookmark(bookmarkToRemove);
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, removeResult]);
        break;

      // You can add more subcommands here if needed

      default:
        // Treat as a bookmark name to open
        const bookmarkNameToUse = args.slice(1).join(" ").replace(/^"|"$/g, ""); // Join arguments and remove quotes
        const bookmark = bookmarks?.find(
          (b: { name: string }) => b.name === bookmarkNameToUse,
        );

        if (bookmark) {
          window.open(bookmark.url, "_blank");
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Opening bookmark: ${bookmark.name}`,
          ]);
        } else {
          setOutput((prevOutput) => [
            ...prevOutput,
            `> ${cmd}`,
            `Bookmark '${bookmarkNameToUse}' not found`,
          ]);
        }
        break;
    }
  };

  const handleColorCommand = (cmd: string, args: string[]) => {
    const colorArg = args[1] || "default";

    // Check if the command is 'color default'
    if (colorArg === "default") {
      changeTextColor("#f59e0b");
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${cmd} ${colorArg}`,
        `Color changed to default (#f59e0b)`,
      ]);
    } else if (/^#[0-9A-F]{6}$/i.test(colorArg)) {
      // If it's not 'default', then process as normal hex color code
      changeTextColor(colorArg);
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${cmd} ${colorArg}`,
        `Color changed to ${colorArg}`,
      ]);
    } else {
      // Handle invalid color code
      setOutput((prevOutput) => [
        ...prevOutput,
        `> ${cmd} ${colorArg}`,
        `Invalid color code. Try 'color default' for default color or 'color #xxxxxx' for a custom hex code. If you want to know a hexcode try 'bot ask, what is the hex code for [color]'`,
      ]);
    }
  };

  const handleUnknownCommand = (cmd: string) => {
    setOutput((prevOutput) => [
      ...prevOutput,
      `> ${cmd}`,
      `Unknown command: ${cmd}`,
    ]);
  };

  if (!isContentLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <BootSequence />
      </div>
    );
  }

  return (
    <main
      style={getTextStyle(textColor)}
      className={`crt crt-scanlines crt-flicker flex min-h-screen bg-neutral-950 p-8 ${textColor} `}
      onClick={handleFocusInput}
    >
      <div>
        <h1>
          <code className="pre">
            Welcome to Terminal Version 0.1.0 | This is a virtual terminal
            interface. You can interact with the app by typing commands. For a
            list of available commands, type `help` and press Enter.
          </code>
        </h1>
        <div className={`output mr-4 w-[90vw] overflow-x-scroll`}>
          {output.map((line, index) => (
            <pre className="pre w- text-wrap" key={index}>
              {typeof window !== "undefined" &&
                localStorage.getItem("lineNumber") === "showLines" && (
                  <span className="mr-3">{index}</span>
                )}
              <span className="w-[90vw]">{line}</span>
            </pre>
          ))}
        </div>
        <div className="row flex">
          {typeof window !== "undefined" &&
            localStorage.getItem("lineNumber") === "showLines" && (
              <span className="mr-3 w-[90vw]">{output.length}</span>
            )}
          <code className="pre">&gt;&nbsp;</code>
          <pre className="pre">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              ref={inputRef}
              onKeyDown={handleInputSubmit}
              style={getTextStyle(textColor)}
              className={`crt crt-scanlines crt-flicker w-[90vw] bg-neutral-950 outline-none`}
              autoFocus
            />
          </pre>
        </div>
      </div>
      <input
        type="file"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={uploadFile}
      />
    </main>
  );
}
