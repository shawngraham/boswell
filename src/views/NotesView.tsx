import React, { useState } from 'react';
import { FolderOpen, Plus, Eye, Edit, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Btn } from '../components/UI';
import { cn } from '../lib/utils';

interface Note {
  name: string;
  content: string;
}

interface Props {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  notesFolderHandle: FileSystemDirectoryHandle | null;
  setNotesFolderHandle: React.Dispatch<React.SetStateAction<FileSystemDirectoryHandle | null>>;
}

export const NotesView = ({ notes, setNotes, notesFolderHandle, setNotesFolderHandle }: Props) => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const pickNotesFolder = async () => {
    if (!('showDirectoryPicker' in window)) return;
    try {
      const handle = await (window as any).showDirectoryPicker();
      setNotesFolderHandle(handle);
      const noteFiles: Note[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          const content = await file.text();
          noteFiles.push({ name: entry.name, content });
        }
      }
      setNotes(noteFiles);
      setSelectedNote(null);
    } catch (err) {
      console.error('Failed to pick notes folder', err);
    }
  };

  const createNewNote = async () => {
    if (!notesFolderHandle) return;
    const name = `Note_${new Date().toISOString().split('T')[0]}_${Date.now()}.md`;
    const content = `# New Note\n\n`;
    try {
      const fileHandle = await (notesFolderHandle as any).getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      const newNote = { name, content };
      setNotes((prev) => [...prev, newNote]);
      setSelectedNote(newNote);
      setEditContent(content);
      setEditing(true);
    } catch (err) {
      console.error('Failed to create note', err);
    }
  };

  const saveNote = async () => {
    if (!notesFolderHandle || !selectedNote) return;
    setSaving(true);
    try {
      const fileHandle = await (notesFolderHandle as any).getFileHandle(selectedNote.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(editContent);
      await writable.close();
      const updated = { ...selectedNote, content: editContent };
      setNotes((prev) => prev.map((n) => (n.name === selectedNote.name ? updated : n)));
      setSelectedNote(updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save note', err);
    }
    setSaving(false);
  };

  const startEditing = (note: Note) => {
    setSelectedNote(note);
    setEditContent(note.content);
    setEditing(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-serif italic">Research Notes</h1>
          <p className="text-zinc-500">
            {notesFolderHandle
              ? `${notesFolderHandle.name} — ${notes.length} notes`
              : 'Point to a folder of markdown files'}
          </p>
        </div>
        <div className="flex gap-2">
          {notesFolderHandle && (
            <Btn variant="secondary" onClick={createNewNote}>
              <Plus size={14} /> New Note
            </Btn>
          )}
          <Btn variant="secondary" onClick={pickNotesFolder}>
            <FolderOpen size={14} /> {notesFolderHandle ? 'Change Folder' : 'Pick Folder'}
          </Btn>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6 flex-1 min-h-0">
        {/* File list */}
        <div className="col-span-1 border-r border-zinc-100 pr-4 overflow-y-auto space-y-1">
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-300 mb-3 px-2">
            Files ({notes.length})
          </p>
          {notes.map((note, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedNote(note);
                setEditing(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                selectedNote?.name === note.name
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
              )}
            >
              <span className="block truncate">{note.name.replace('.md', '')}</span>
            </button>
          ))}
          {notes.length === 0 && (
            <p className="text-xs text-zinc-400 italic px-2">No markdown files found.</p>
          )}
        </div>

        {/* Content pane */}
        <div className="col-span-3 flex flex-col min-h-0">
          {selectedNote ? (
            <>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-serif italic text-zinc-700">
                  {selectedNote.name.replace('.md', '')}
                </h2>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Btn variant="secondary" onClick={() => setEditing(false)}>
                        <Eye size={14} /> Preview
                      </Btn>
                      <Btn onClick={saveNote} disabled={saving}>
                        <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                      </Btn>
                    </>
                  ) : (
                    notesFolderHandle && (
                      <Btn variant="secondary" onClick={() => startEditing(selectedNote)}>
                        <Edit size={14} /> Edit
                      </Btn>
                    )
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {editing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[400px] bg-zinc-50 rounded-xl p-4 text-sm font-mono text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-200 border border-zinc-100 resize-none"
                    placeholder="Write markdown here…"
                  />
                ) : (
                  <div className="prose prose-zinc max-w-none">
                    <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-300 font-serif italic text-xl">
              {notes.length > 0 ? 'Select a note to read' : 'No notes yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
