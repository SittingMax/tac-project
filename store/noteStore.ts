import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, NoteEntityType, NoteFilters } from '@/types';

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  getNotes: (filters?: NoteFilters) => Note[];
  getNotesByEntity: (entityType: NoteEntityType, entityId: string) => Note[];
  getNoteById: (id: string) => Note | undefined;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (
    id: string,
    updates: Partial<Pick<Note, 'content' | 'plainText' | 'isPinned' | 'isInternal'>>
  ) => Note | null;
  deleteNote: (id: string) => boolean;
  togglePinNote: (id: string) => Note | null;

  // Bulk operations
  deleteNotesByEntity: (entityType: NoteEntityType, entityId: string) => number;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const generateId = () => `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const stripHtml = (html: string): string => {
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent ?? '';
};

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      error: null,

      getNotes: (filters?: NoteFilters) => {
        let result = [...get().notes];

        if (filters?.entityType) {
          result = result.filter((n) => n.entityType === filters.entityType);
        }
        if (filters?.entityId) {
          result = result.filter((n) => n.entityId === filters.entityId);
        }
        if (filters?.createdBy) {
          result = result.filter((n) => n.createdBy === filters.createdBy);
        }
        if (filters?.isPinned !== undefined) {
          result = result.filter((n) => n.isPinned === filters.isPinned);
        }
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          result = result.filter(
            (n) =>
              n.plainText.toLowerCase().includes(searchLower) ||
              n.content.toLowerCase().includes(searchLower)
          );
        }

        // Sort by pinned first, then by createdAt descending
        result.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (filters?.limit) {
          result = result.slice(0, filters.limit);
        }

        return result;
      },

      getNotesByEntity: (entityType: NoteEntityType, entityId: string) => {
        return get().getNotes({ entityType, entityId });
      },

      getNoteById: (id: string) => {
        return get().notes.find((n) => n.id === id);
      },

      createNote: (noteData) => {
        const now = new Date().toISOString();
        const newNote: Note = {
          id: generateId(),
          ...noteData,
          plainText: noteData.plainText || stripHtml(noteData.content),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          notes: [newNote, ...state.notes],
        }));

        return newNote;
      },

      updateNote: (id: string, updates) => {
        const note = get().getNoteById(id);
        if (!note) return null;

        const updatedNote: Note = {
          ...note,
          ...updates,
          plainText: updates.content ? stripHtml(updates.content) : note.plainText,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        }));

        return updatedNote;
      },

      deleteNote: (id: string) => {
        const note = get().getNoteById(id);
        if (!note) return false;

        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));

        return true;
      },

      togglePinNote: (id: string) => {
        const note = get().getNoteById(id);
        if (!note) return null;

        return get().updateNote(id, { isPinned: !note.isPinned });
      },

      deleteNotesByEntity: (entityType: NoteEntityType, entityId: string) => {
        const toDelete = get().notes.filter(
          (n) => n.entityType === entityType && n.entityId === entityId
        );
        const count = toDelete.length;

        set((state) => ({
          notes: state.notes.filter(
            (n) => !(n.entityType === entityType && n.entityId === entityId)
          ),
        }));

        return count;
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'tac-notes-storage',
      version: 1,
    }
  )
);

export default useNoteStore;
