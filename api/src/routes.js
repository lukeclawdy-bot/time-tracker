import express from 'express';
import Joi from 'joi';
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getStatsByProject
} from './db.js';

const router = express.Router();

// Validation schemas
const entrySchema = Joi.object({
  start_time: Joi.date().iso().required().messages({
    'date.base': 'start_time must be a valid ISO 8601 date',
    'any.required': 'start_time is required'
  }),
  end_time: Joi.date().iso().required().messages({
    'date.base': 'end_time must be a valid ISO 8601 date',
    'any.required': 'end_time is required'
  }),
  project: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'project cannot be empty',
    'any.required': 'project is required'
  }),
  notes: Joi.string().trim().max(1000).allow('').optional().messages({
    'string.max': 'notes cannot exceed 1000 characters'
  })
}).external(async (value) => {
  // Validate end_time > start_time
  const startTime = new Date(value.start_time);
  const endTime = new Date(value.end_time);
  
  if (endTime <= startTime) {
    throw new Error('end_time must be after start_time');
  }
});

const updateEntrySchema = Joi.object({
  start_time: Joi.date().iso().optional().messages({
    'date.base': 'start_time must be a valid ISO 8601 date'
  }),
  end_time: Joi.date().iso().optional().messages({
    'date.base': 'end_time must be a valid ISO 8601 date'
  }),
  project: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'project cannot be empty'
  }),
  notes: Joi.string().trim().max(1000).allow('').optional().messages({
    'string.max': 'notes cannot exceed 1000 characters'
  })
}).external(async (value) => {
  // Only validate time relationship if both are provided
  if (value.start_time && value.end_time) {
    const startTime = new Date(value.start_time);
    const endTime = new Date(value.end_time);
    
    if (endTime <= startTime) {
      throw new Error('end_time must be after start_time');
    }
  }
});

const querySchema = Joi.object({
  project: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
  offset: Joi.number().integer().min(0).optional()
});

/**
 * POST /api/entries - Create a new time entry
 */
router.post('/entries', async (req, res, next) => {
  try {
    const value = await entrySchema.validateAsync(req.body, { abortEarly: false });
    // Convert Date objects back to ISO strings for database
    const entryData = {
      ...value,
      start_time: value.start_time instanceof Date ? value.start_time.toISOString() : value.start_time,
      end_time: value.end_time instanceof Date ? value.end_time.toISOString() : value.end_time
    };
    const entry = await createEntry(entryData);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    if (err.isJoi || err instanceof Joi.ValidationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: (err.details || []).map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }
    if (err.message && err.message.includes('end_time must be after start_time')) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'end_time', message: 'end_time must be after start_time' }]
      });
    }
    // Handle SQLITE_CONSTRAINT errors from database CHECK constraint
    if (err.code === 'SQLITE_CONSTRAINT' && err.message && err.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'end_time', message: 'end_time must be after start_time' }]
      });
    }
    next(err);
  }
});

/**
 * GET /api/entries - List all entries with optional filters
 */
router.get('/entries', async (req, res, next) => {
  try {
    const { error, value } = querySchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    const entries = await getEntries({
      project: value.project,
      limit: value.limit || 100,
      offset: value.offset || 0
    });

    res.status(200).json({
      success: true,
      data: entries,
      count: entries.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/entries/:id - Get a specific entry
 */
router.get('/entries/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'id', message: 'id must be a valid integer' }]
      });
    }

    const entry = await getEntryById(id);

    if (!entry) {
      return res.status(404).json({
        error: 'Entry not found',
        id
      });
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/entries/:id - Update an entry
 */
router.patch('/entries/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'id', message: 'id must be a valid integer' }]
      });
    }

    // Check if entry exists
    const entry = await getEntryById(id);
    if (!entry) {
      return res.status(404).json({
        error: 'Entry not found',
        id
      });
    }

    // Merge with existing data for validation
    const mergedData = {
      start_time: req.body.start_time || entry.start_time,
      end_time: req.body.end_time || entry.end_time,
      project: req.body.project || entry.project,
      notes: req.body.notes !== undefined ? req.body.notes : entry.notes
    };

    const value = await updateEntrySchema.validateAsync(mergedData, { abortEarly: false });
    
    // Convert Date objects back to ISO strings for database
    const updateData = {};
    if (req.body.start_time !== undefined) {
      updateData.start_time = value.start_time instanceof Date ? value.start_time.toISOString() : value.start_time;
    }
    if (req.body.end_time !== undefined) {
      updateData.end_time = value.end_time instanceof Date ? value.end_time.toISOString() : value.end_time;
    }
    if (req.body.project !== undefined) {
      updateData.project = value.project;
    }
    if (req.body.notes !== undefined) {
      updateData.notes = value.notes;
    }
    
    const updatedEntry = await updateEntry(id, updateData);
    res.status(200).json({
      success: true,
      data: updatedEntry
    });
  } catch (err) {
    if (err.isJoi || err instanceof Joi.ValidationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: (err.details || []).map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }
    if (err.message && err.message.includes('end_time must be after start_time')) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'end_time', message: 'end_time must be after start_time' }]
      });
    }
    // Handle SQLITE_CONSTRAINT errors from database CHECK constraint
    if (err.code === 'SQLITE_CONSTRAINT' && err.message && err.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'end_time', message: 'end_time must be after start_time' }]
      });
    }
    next(err);
  }
});

/**
 * DELETE /api/entries/:id - Delete an entry
 */
router.delete('/entries/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        details: [{ field: 'id', message: 'id must be a valid integer' }]
      });
    }

    const entry = await getEntryById(id);
    if (!entry) {
      return res.status(404).json({
        error: 'Entry not found',
        id
      });
    }

    const deleted = await deleteEntry(id);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Entry deleted successfully',
        id
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete entry'
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/entries/stats - Get statistics (total hours by project)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getStatsByProject();

    res.status(200).json({
      success: true,
      data: stats.map(s => ({
        project: s.project,
        total_entries: s.total_entries,
        total_hours: s.total_hours ? parseFloat(s.total_hours.toFixed(2)) : 0,
        first_entry: s.first_entry,
        last_entry: s.last_entry
      })),
      count: stats.length
    });
  } catch (err) {
    next(err);
  }
});

export default router;
