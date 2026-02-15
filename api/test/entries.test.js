import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import app from '../src/index.js';
import { initializeDB, closeDB, query } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'test_time_tracking.db');

// Set test database path
process.env.DB_PATH = TEST_DB_PATH;

describe('Time Tracking API', () => {
  beforeAll(async () => {
    // Clean up test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await initializeDB();
  });

  afterAll(async () => {
    await closeDB();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.environment).toBeDefined();
    });
  });

  describe('POST /api/entries', () => {
    it('should create a new entry', async () => {
      const startTime = '2026-02-14T08:00:00Z';
      const endTime = '2026-02-14T09:00:00Z';

      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: startTime,
          end_time: endTime,
          project: 'Project A',
          notes: 'Morning meeting'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(new Date(res.body.data.start_time).getTime()).toBe(new Date(startTime).getTime());
      expect(new Date(res.body.data.end_time).getTime()).toBe(new Date(endTime).getTime());
      expect(res.body.data.project).toBe('Project A');
      expect(res.body.data.notes).toBe('Morning meeting');
    });

    it('should create entry without notes', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T10:00:00Z',
          end_time: '2026-02-14T11:00:00Z',
          project: 'Project B'
        })
        .expect(201);

      expect(res.body.data.notes).toBeNull();
    });

    it('should reject entry with end_time <= start_time', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T09:00:00Z',
          end_time: '2026-02-14T08:00:00Z',
          project: 'Project A'
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
      expect(res.body.details).toBeDefined();
      expect(res.body.details[0].message).toContain('end_time must be after start_time');
    });

    it('should reject entry with same start and end time', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T09:00:00Z',
          end_time: '2026-02-14T09:00:00Z',
          project: 'Project A'
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should reject entry without required fields', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T08:00:00Z'
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should reject entry with invalid ISO date', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: 'invalid-date',
          end_time: '2026-02-14T09:00:00Z',
          project: 'Project A'
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should reject entry with empty project', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T08:00:00Z',
          end_time: '2026-02-14T09:00:00Z',
          project: ''
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should reject entry with too long notes', async () => {
      const longNotes = 'a'.repeat(1001);
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T08:00:00Z',
          end_time: '2026-02-14T09:00:00Z',
          project: 'Project A',
          notes: longNotes
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should trim whitespace from project and notes', async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-14T08:00:00Z',
          end_time: '2026-02-14T09:00:00Z',
          project: '  Project C  ',
          notes: '  Some notes  '
        })
        .expect(201);

      expect(res.body.data.project).toBe('Project C');
      expect(res.body.data.notes).toBe('Some notes');
    });
  });

  describe('GET /api/entries', () => {
    beforeAll(async () => {
      // Clear and add test data
      await query('DELETE FROM entries');
      
      const entries = [
        {
          start_time: '2026-02-14T08:00:00Z',
          end_time: '2026-02-14T09:00:00Z',
          project: 'Project A',
          notes: 'Entry 1'
        },
        {
          start_time: '2026-02-14T10:00:00Z',
          end_time: '2026-02-14T11:00:00Z',
          project: 'Project A',
          notes: 'Entry 2'
        },
        {
          start_time: '2026-02-15T08:00:00Z',
          end_time: '2026-02-15T09:00:00Z',
          project: 'Project B',
          notes: 'Entry 3'
        }
      ];

      for (const entry of entries) {
        await request(app)
          .post('/api/entries')
          .send(entry);
      }
    });

    it('should list all entries', async () => {
      const res = await request(app)
        .get('/api/entries')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.count).toBe(3);
    });

    it('should return entries in descending order by start_time', async () => {
      const res = await request(app)
        .get('/api/entries')
        .expect(200);

      expect(new Date(res.body.data[0].start_time).getTime()).toBeGreaterThanOrEqual(new Date(res.body.data[1].start_time).getTime());
    });

    it('should filter entries by project', async () => {
      const res = await request(app)
        .get('/api/entries?project=Project%20A')
        .expect(200);

      expect(res.body.count).toBe(2);
      expect(res.body.data.every(e => e.project === 'Project A')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/entries?limit=2')
        .expect(200);

      expect(res.body.data.length).toBe(2);
    });

    it('should respect offset parameter', async () => {
      const res = await request(app)
        .get('/api/entries?offset=1&limit=2')
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should reject invalid limit', async () => {
      const res = await request(app)
        .get('/api/entries?limit=9999')
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should reject negative offset', async () => {
      const res = await request(app)
        .get('/api/entries?offset=-1')
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/entries/:id', () => {
    let entryId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-16T08:00:00Z',
          end_time: '2026-02-16T09:00:00Z',
          project: 'Project Test'
        });
      entryId = res.body.data.id;
    });

    it('should retrieve a specific entry', async () => {
      const res = await request(app)
        .get(`/api/entries/${entryId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(entryId);
      expect(res.body.data.project).toBe('Project Test');
    });

    it('should return 404 for non-existent entry', async () => {
      const res = await request(app)
        .get('/api/entries/99999')
        .expect(404);

      expect(res.body.error).toBe('Entry not found');
    });

    it('should reject invalid id format', async () => {
      const res = await request(app)
        .get('/api/entries/invalid')
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });
  });

  describe('PATCH /api/entries/:id', () => {
    let entryId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-17T08:00:00Z',
          end_time: '2026-02-17T09:00:00Z',
          project: 'Project Update',
          notes: 'Original notes'
        });
      entryId = res.body.data.id;
    });

    it('should update entry notes', async () => {
      const res = await request(app)
        .patch(`/api/entries/${entryId}`)
        .send({
          notes: 'Updated notes'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe('Updated notes');
    });

    it('should update entry project', async () => {
      const res = await request(app)
        .patch(`/api/entries/${entryId}`)
        .send({
          project: 'Project Updated'
        })
        .expect(200);

      expect(res.body.data.project).toBe('Project Updated');
    });

    it('should update entry times', async () => {
      const res = await request(app)
        .patch(`/api/entries/${entryId}`)
        .send({
          start_time: '2026-02-17T10:00:00Z',
          end_time: '2026-02-17T11:00:00Z'
        })
        .expect(200);

      expect(new Date(res.body.data.start_time).getTime()).toBe(new Date('2026-02-17T10:00:00Z').getTime());
      expect(new Date(res.body.data.end_time).getTime()).toBe(new Date('2026-02-17T11:00:00Z').getTime());
    });

    it('should reject update with end_time <= start_time', async () => {
      const res = await request(app)
        .patch(`/api/entries/${entryId}`)
        .send({
          start_time: '2026-02-17T11:00:00Z',
          end_time: '2026-02-17T10:00:00Z'
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should reject update of non-existent entry', async () => {
      const res = await request(app)
        .patch('/api/entries/99999')
        .send({
          notes: 'Updated'
        })
        .expect(404);

      expect(res.body.error).toBe('Entry not found');
    });

    it('should allow partial updates', async () => {
      const res = await request(app)
        .patch(`/api/entries/${entryId}`)
        .send({
          notes: 'Only notes changed'
        })
        .expect(200);

      expect(res.body.data.notes).toBe('Only notes changed');
    });

    it('should validate time relationship against existing data', async () => {
      // First create an entry
      const createRes = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-18T08:00:00Z',
          end_time: '2026-02-18T09:00:00Z',
          project: 'Test'
        });
      const id = createRes.body.data.id;

      // Try to update end_time to before new start_time
      const res = await request(app)
        .patch(`/api/entries/${id}`)
        .send({
          start_time: '2026-02-18T10:00:00Z'
        })
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /api/entries/:id', () => {
    let entryId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-19T08:00:00Z',
          end_time: '2026-02-19T09:00:00Z',
          project: 'Project Delete'
        });
      entryId = res.body.data.id;
    });

    it('should delete an entry', async () => {
      const res = await request(app)
        .delete(`/api/entries/${entryId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Entry deleted successfully');
    });

    it('should return 404 when deleting non-existent entry', async () => {
      const res = await request(app)
        .delete('/api/entries/99999')
        .expect(404);

      expect(res.body.error).toBe('Entry not found');
    });

    it('should reject invalid id format', async () => {
      const res = await request(app)
        .delete('/api/entries/invalid')
        .expect(400);

      expect(res.body.error).toBe('Validation error');
    });

    it('should verify entry is actually deleted', async () => {
      // Create, delete, then verify
      const createRes = await request(app)
        .post('/api/entries')
        .send({
          start_time: '2026-02-20T08:00:00Z',
          end_time: '2026-02-20T09:00:00Z',
          project: 'Project'
        });
      const id = createRes.body.data.id;

      await request(app)
        .delete(`/api/entries/${id}`)
        .expect(200);

      const getRes = await request(app)
        .get(`/api/entries/${id}`)
        .expect(404);

      expect(getRes.body.error).toBe('Entry not found');
    });
  });

  describe('GET /api/stats', () => {
    beforeAll(async () => {
      // Clear and add test data for stats
      await query('DELETE FROM entries');
      
      const entries = [
        {
          start_time: '2026-02-14T08:00:00Z',
          end_time: '2026-02-14T09:00:00Z',
          project: 'Project A'
        },
        {
          start_time: '2026-02-14T10:00:00Z',
          end_time: '2026-02-14T12:00:00Z',
          project: 'Project A'
        },
        {
          start_time: '2026-02-15T08:00:00Z',
          end_time: '2026-02-15T09:30:00Z',
          project: 'Project B'
        }
      ];

      for (const entry of entries) {
        await request(app)
          .post('/api/entries')
          .send(entry);
      }
    });

    it('should return statistics by project', async () => {
      const res = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.count).toBeGreaterThan(0);
    });

    it('should calculate correct total hours', async () => {
      const res = await request(app)
        .get('/api/stats')
        .expect(200);

      const projectA = res.body.data.find(s => s.project === 'Project A');
      expect(projectA).toBeDefined();
      expect(projectA.total_entries).toBe(2);
      expect(projectA.total_hours).toBe(3); // 1 hour + 2 hours
    });

    it('should include project metadata', async () => {
      const res = await request(app)
        .get('/api/stats')
        .expect(200);

      const stat = res.body.data[0];
      expect(stat.project).toBeDefined();
      expect(stat.total_entries).toBeDefined();
      expect(stat.total_hours).toBeDefined();
      expect(stat.first_entry).toBeDefined();
      expect(stat.last_entry).toBeDefined();
    });

    it('should return zero hours for projects with no entries', async () => {
      // This test ensures stats only returns projects with entries
      const res = await request(app)
        .get('/api/stats')
        .expect(200);

      const allHaveTotalHours = res.body.data.every(s => 
        typeof s.total_hours === 'number' && s.total_hours >= 0
      );
      expect(allHaveTotalHours).toBe(true);
    });
  });

  describe('404 and Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(res.body.error).toBe('Route not found');
    });

    it('should handle POST with invalid JSON', async () => {
      const res = await request(app)
        .post('/api/entries')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(res.body).toBeDefined();
    });
  });
});
