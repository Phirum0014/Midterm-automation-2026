import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Req() request: any, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(request.user.id, createNoteDto);
  }

  @Get()
  findAll(
    @Req() request: any,
    @Query('search') search?: string,
    @Query('folder') folder?: string,
  ) {
    return this.notesService.findAll(request.user.id, search, folder);
  }

  @Get(':id')
  findOne(@Req() request: any, @Param('id') id: string) {
    return this.notesService.findOne(request.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(request.user.id, id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Req() request: any, @Param('id') id: string) {
    return this.notesService.remove(request.user.id, id);
  }
}