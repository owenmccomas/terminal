import { useState, useEffect, useRef } from "react";

import { signOut, useSession } from "next-auth/react";

import { signIn } from "next-auth/react";
import { UploadButton } from "./uploadthing";
import { api } from "~/trpc/react";

import BootSequence from "./boot-sequence";
import { useUploadThing } from "../hooks/uploadthing";
import { File } from "@prisma/client";

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

  function getTextStyle(color: string) {
    return {
      color: color,
      textShadow: `0 0 8px ${color}, 0 0 10px ${color}`,
    };
  }

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

  const createUsername = (username: string) => {
    // Call the tRPC mutation for creating a username
  };

  const updateUsername = (newUsername: string) => {
    // Call the tRPC mutation for updating a username
  };

  const processCommand = async (command: string) => {
    const args = command.split(" ");
    const cmd = args[0]?.toLowerCase() ?? "";
    const cmdArgs = args.slice(1).join(" ");

    switch (cmd) {
      case "help":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          "Available commands:",
          "  help        - Displays this help message.",
          "  clear       - Clears the terminal output.",
          "  about       - Shows information about this terminal-like interface.",
          "  date        - Displays the current date.",
          "  time        - Displays the current time.",
          "  echo        - Repeats back the text you enter. Usage: echo [text]",
          "  signin      - Signs in a user. If already signed in, displays a welcome back message.",
          "  signout     - Signs out the current user and displays a goodbye message.",
          "  whoami      - Shows the name of the currently signed in user, or a message if not signed in.",
          "  newnote     - Starts the process to create a new note. Requires being signed in. Usage: newnote [follow prompts]",
          "  viewnotes   - Lists titles of all available notes.",
          "  view        - Selects a note for viewing based on the title. Usage: view [note title]",
          "  bot         - Interacts with an AI bot. Usage: bot ask [your question]",
          "  draw        - Generates ASCII art based on a prompt. Usage: draw [prompt]",
          "  search      - Searches the web for a query and opens the results in a new tab. Usage: search [query]",
          "  copylast    - Copies the specified number of last lines from the terminal output to the clipboard. Usage: copylast [number of lines]",
          "  togglelines - Toggles the display of line numbers in the terminal.",
          "  bm          - Bookmark management. Subcommands: -add, -ls, -rm. Usage: bm [subcommand] [args]",
          "  color       - Changes the text color of the terminal. Usage: color [hex color code]",
          "",
          "Note: Some commands require user authentication (signin). Ensure you are signed in to use all features.",
        ]);
        break;

      case "clear":
        setOutput([]);
        break;
      case "about":
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          "This is a terminal-like interface built by Owen McComas.",
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
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, cmdArgs]);
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
      case "username":
        if (args[1] === "-create") {
          // Check if args[2] is defined before passing it to createUsername
          if (args[2]) {
            createUsername(args[2]);
          } else {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error: Missing username for creation",
            ]);
          }
        } else if (args[1] === "-edit") {
          // Check if args[2] is defined before passing it to updateUsername
          if (args[2]) {
            updateUsername(args[2]);
          } else {
            setOutput((prevOutput) => [
              ...prevOutput,
              `> ${cmd}`,
              "Error: Missing username for editing",
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
      case "togglelines":
        handleToggleLinesCommand();
        break;
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

  const handleToggleLinesCommand = () => {
    localStorage.setItem(
      "lineNumber",
      localStorage.getItem("lineNumber") === "showLines"
        ? "hideLines"
        : "showLines" || "showLines",
    );
  };

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
