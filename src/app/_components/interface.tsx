import { useState, useEffect, useRef } from "react";

import { signOut, useSession } from "next-auth/react";

import { signIn } from "next-auth/react";

import { api } from "~/trpc/react";

export default function Interface() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [selectedNoteTitle, setSelectedNoteTitle] = useState("");
  const [isLoadingNote, setIsLoadingNote] = useState(false);
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

  const handleInputSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isCreatingNote) {
        processNewNote(input);
      } else {
        processCommand(input);
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
    return allNotes?.map((note) => note.title) || [];
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
          selectedNote.content || "No content available",
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

  const processCommand = (command: string) => {
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
          signIn();
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
          signOut();
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
      className="crt crt-scanlines crt-flicker flex min-h-screen bg-neutral-950 p-8"
      onClick={handleFocusInput}
    >
      <div className="glow">
        <h1>
          Welcome to Terminal Version 0.1.0 | This is a virtual terminal
          interface. You can interact with the app by typing commands. For a
          list of available commands, type 'help' and press Enter.
        </h1>
        <div className="output">
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
            className="command-input glow max-w-full
            "
          />
        </div>
      </div>
    </main>
  );
}
