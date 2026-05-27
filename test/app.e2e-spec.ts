import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Note-Taking Application API', () => {
  let app: INestApplication;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Exam User',
      email: 'exam@example.com',
      password: '123456',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'exam@example.com',
        password: '123456',
      })
      .expect(201);

    token = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Second User',
          email: 'second@example.com',
          password: '123456',
        })
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe('second@example.com');
    });

    it('should not register duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'exam@example.com',
          password: '123456',
        })
        .expect(400);
    });

    it('should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'exam@example.com',
          password: '123456',
        })
        .expect(201);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject invalid login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'exam@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  describe('Notes CRUD', () => {
    it('should reject note creation without token', async () => {
      await request(app.getHttpServer())
        .post('/notes')
        .send({
          title: 'Unauthorized Note',
        })
        .expect(401);
    });

    it('should create a note', async () => {
      const response = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'My First Note',
          content: 'This is my note content',
          folder: 'School',
          isShared: false,
        })
        .expect(201);

      expect(response.body.message).toBe('Note created successfully');
      expect(response.body.data.title).toBe('My First Note');
      expect(response.body.data.content).toBe('This is my note content');
      expect(response.body.data.folder).toBe('School');
      expect(response.body.data.isShared).toBe(false);
      expect(response.body.data.id).toBeDefined();
    });

    it('should reject creating note without title', async () => {
      await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Missing title',
        })
        .expect(400);
    });

    it('should get all notes', async () => {
      await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Searchable Note',
          content: 'NestJS testing content',
          folder: 'Backend',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/notes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Notes fetched successfully');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should search notes by title or content', async () => {
      await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Important Exam Note',
          content: 'This note is about API testing',
          folder: 'Exam',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/notes?search=exam')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Notes fetched successfully');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter notes by folder', async () => {
      await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Folder Note',
          content: 'Folder testing',
          folder: 'Assignment',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/notes?folder=Assignment')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Notes fetched successfully');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should get one note by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Single Note',
          content: 'Read one note',
          folder: 'General',
        })
        .expect(201);

      const noteId = created.body.data.id;

      const response = await request(app.getHttpServer())
        .get(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Note fetched successfully');
      expect(response.body.data.title).toBe('Single Note');
      expect(response.body.data.id).toBe(noteId);
    });

    it('should return 404 when note does not exist', async () => {
      await request(app.getHttpServer())
        .get('/notes/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should update a note', async () => {
      const created = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Old Title',
          content: 'Old content',
          folder: 'General',
        })
        .expect(201);

      const noteId = created.body.data.id;

      const response = await request(app.getHttpServer())
        .patch(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
          isShared: true,
        })
        .expect(200);

      expect(response.body.message).toBe('Note updated successfully');
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.content).toBe('Updated content');
      expect(response.body.data.isShared).toBe(true);
      expect(response.body.data.id).toBe(noteId);
    });

    it('should delete a note', async () => {
      const created = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Delete Me',
          content: 'This note will be deleted',
        })
        .expect(201);

      const noteId = created.body.data.id;

      const response = await request(app.getHttpServer())
        .delete(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Note deleted successfully');
      expect(response.body.data.id).toBe(noteId);

      await request(app.getHttpServer())
        .get(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});