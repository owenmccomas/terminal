"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null); // Create a ref for the input

  useEffect(() => {
    // Focus on the input element after the component mounts
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
      processCommand(input);
      setInput("");
    }
  };

  const processCommand = (command: string) => {
    const args = command.split(' ');
    const cmd = (args[0]?.toLowerCase()) ?? "";
    const cmdArgs = args.slice(1).join(' ');
  
    switch (cmd) {
      case "help":
        setOutput(prevOutput => [...prevOutput, "Available commands: help, clear, about, date, time, echo, ..."]);
        break;
      case "clear":
        setOutput([]);
        break;
      case "about":
        setOutput(prevOutput => [...prevOutput, "This is a terminal-like interface built by Owen McComas. ..."]);
        break;
      case "date":
        setOutput(prevOutput => [...prevOutput, `Current Date: ${new Date().toLocaleDateString()}`]);
        break;
      case "time":
        setOutput(prevOutput => [...prevOutput, `Current Time: ${new Date().toLocaleTimeString()}`]);
        break;
      case "echo":
        setOutput(prevOutput => [...prevOutput, cmdArgs]);
        break;
      // Add more cases for other commands
      default:
        setOutput(prevOutput => [...prevOutput, `Unknown command: ${cmd}`]);
    }
  };
  

  return (
    <main className="crt crt-scanlines crt-flicker flex min-h-screen bg-neutral-950 p-8" onClick={handleFocusInput}>
      <div className="glow">
        <h1>
          Welcome to Terminal Version 0.1.0 |
          This is a virtual terminal interface. You can interact with the app by
          typing commands. For a list of available commands, type 'help' and
          press Enter.
        </h1>
        <div className="output">
          {output.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <div className="flex row">
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
