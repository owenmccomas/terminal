import { useState } from "react";

import { api } from "~/trpc/react";



export const processNewNote = (input: string) => {
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [output, setOutput] = useState<string[]>([]);
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const createNoteMutation = api.note.createNote.useMutation({
      onSuccess: () => {
        // Actions to perform on successful note creation
        setOutput((prevOutput) => [...prevOutput, `> Note titled '${noteTitle}' saved successfully.`]);
        setNoteTitle("");
        setNoteContent("");
        setIsCreatingNote(false);
      },
      onError: (error) => {
        // Actions to perform on error
        console.error(error);
        setOutput((prevOutput) => [...prevOutput, `> Error saving note`]);
      }
    });
  
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
    }
  };