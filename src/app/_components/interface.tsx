import { useState, useEffect, useRef } from "react";

import { signOut, useSession } from "next-auth/react";

import { signIn } from "next-auth/react";

import { api } from "~/trpc/react";

// import { processNewNote } from "./create-note";

export default function Interface() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
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
          "Available commands: help, clear, about, date, time, echo, signin, signout, whoami",
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
            className="command-input glow"
          />
        </div>
      </div>
    </main>
  );
}
