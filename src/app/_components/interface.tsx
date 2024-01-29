import { useState, useEffect, useRef } from "react";

import { signOut, useSession } from "next-auth/react";

import { signIn } from "next-auth/react";

import { api } from "~/trpc/react";

export default function Interface() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [noteContent, setNoteContent] = useState("");
  const [selectedNoteTitle, setSelectedNoteTitle] = useState("");
  const [glowColor, setGlowColor] = useState("glow-amber");
  const [inputColor, setInputColor] = useState("command-input-amber");
  const inputRef = useRef<HTMLInputElement>(null);
  const session = useSession();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
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
    onError: (error) => {
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
    return allNotes?.map((note) => note.title) ?? [];
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

  const toggleGlow = () => {
    if (glowColor === "glow-amber") {
      setGlowColor("glow-green");
      setInputColor("command-input-green");
    } else {
      setGlowColor("glow-amber");
      setInputColor("command-input-amber");
    }
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
          "  help       - Displays this help message.",
          "  clear      - Clears the terminal output.",
          "  about      - Shows information about this terminal-like interface.",
          "  date       - Displays the current date.",
          "  time       - Displays the current time.",
          "  echo       - Repeats back the text you enter. Usage: echo [text]",
          "  signin     - Signs in a user. If already signed in, displays a welcome back message.",
          "  signout    - Signs out the current user and displays a goodbye message.",
          "  whoami     - Shows the name of the currently signed in user, or a message if not signed in.",
          "  newnote    - Starts the process to create a new note. Requires being signed in. Usage: newnote [follow prompts]",
          "  viewnotes  - Lists titles of all available notes.",
          "  view       - Selects a note for viewing based on the title. Usage: view [note title]",
          "  bot        - Interacts with an AI bot. Usage: bot ask [your question]",
          "  draw       - Generates ASCII art based on a prompt. Usage: draw [prompt]",
          "  search     - Searches the web for a query and opens the results in a new tab. Usage: search [query]",
          "  copylast   - Copies the specified number of last lines from the terminal output to the clipboard. Usage: copylast [number of lines]",
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
      case "viewnotes":
        const noteTitles = fetchAllNotes();
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, ...noteTitles]);
        break;
      case "view":
        setSelectedNoteTitle(cmdArgs);
        break;
      case "togglecolor":
        setOutput((prevOutput) => [...prevOutput, `> ${cmd}`, `Toggled`]);
        toggleGlow();
        break;

      case "bot":
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
        break;
      case "draw":
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
          setOutput((prevOutput) => [
            ...prevOutput,
            `> Error: ${error as string}`,
          ]);
        }
        break;

      case "search":
        // we will simply open a new tab with the search query on google
        const searchQuery = args.slice(1).join(" ");
        window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Searching: ${searchQuery}`,
        ]);
        break;

      case "copylast":
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
        break;

      // Add more cases for other commands
      default:
        setOutput((prevOutput) => [
          ...prevOutput,
          `> ${cmd}`,
          `Unknown command: ${cmd}`,
        ]);
    }
  };

  return (
    <main
      className={`crt crt-scanlines crt-flicker flex min-h-screen bg-neutral-950 p-8 ${glowColor}`}
      onClick={handleFocusInput}
    >
      <div>
        <h1>
          Welcome to Terminal Version 0.1.0 | This is a virtual terminal
          interface. You can interact with the app by typing commands. For a
          list of available commands, type `help` and press Enter.
        </h1>
        <div className={`output`}>
          {output.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <div className="row flex">
          <p>&gt;&nbsp;</p>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            ref={inputRef}
            onKeyDown={handleInputSubmit}
            className={`${glowColor} ${inputColor} max-w-full`}
          />
        </div>
      </div>
    </main>
  );
}
