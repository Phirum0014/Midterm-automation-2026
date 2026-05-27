import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

type Note = {
  id: string;
  title: string;
  content: string;
  folder: string;
  isShared: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class NotesService {
  private notes: Note[] = [];

  create(ownerId: string, createNoteDto: CreateNoteDto) {
    const note: Note = {
      id: Date.now().toString() + Math.random().toString(),
      title: createNoteDto.title,
      content: createNoteDto.content ?? '',
      folder: createNoteDto.folder ?? 'General',
      isShared: createNoteDto.isShared ?? false,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.push(note);

    return {
      message: 'Note created successfully',
      data: note,
    };
  }

  findAll(ownerId: string, search?: string, folder?: string) {
    let result = this.notes.filter((note) => note.ownerId === ownerId);

    if (search) {
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.content.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (folder) {
      result = result.filter(
        (note) => note.folder.toLowerCase() === folder.toLowerCase(),
      );
    }

    return {
      message: 'Notes fetched successfully',
      total: result.length,
      data: result,
    };
  }

  findOne(ownerId: string, id: string) {
    const note = this.notes.find((item) => item.id === id);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.ownerId !== ownerId && !note.isShared) {
      throw new ForbiddenException(
        'You do not have permission to access this note',
      );
    }

    return {
      message: 'Note fetched successfully',
      data: note,
    };
  }

  update(ownerId: string, id: string, updateNoteDto: UpdateNoteDto) {
    const note = this.notes.find((item) => item.id === id);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to update this note',
      );
    }

    if (updateNoteDto.title !== undefined) {
      note.title = updateNoteDto.title;
    }

    if (updateNoteDto.content !== undefined) {
      note.content = updateNoteDto.content;
    }

    if (updateNoteDto.folder !== undefined) {
      note.folder = updateNoteDto.folder;
    }

    if (updateNoteDto.isShared !== undefined) {
      note.isShared = updateNoteDto.isShared;
    }

    note.updatedAt = new Date();

    return {
      message: 'Note updated successfully',
      data: note,
    };
  }

  remove(ownerId: string, id: string) {
    const noteIndex = this.notes.findIndex((item) => item.id === id);

    if (noteIndex === -1) {
      throw new NotFoundException('Note not found');
    }

    const note = this.notes[noteIndex];

    if (note.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to delete this note',
      );
    }

    const deletedNote = this.notes.splice(noteIndex, 1)[0];

    return {
      message: 'Note deleted successfully',
      data: deletedNote,
    };
  }
}