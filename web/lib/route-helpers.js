import { NextResponse } from 'next/server'
import { DatabaseNotConfiguredError } from '@/lib/db'

/** Route handlers must never be cached — every read hits the database. */
export const ROUTE_CONFIG = {
  runtime: 'nodejs',
  dynamic: 'force-dynamic',
}

export function ok(data, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Wraps a handler so database faults become the same `{ error }` shape the
 * old Express API returned, which is what the UI already renders.
 */
export function handler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context)
    } catch (error) {
      if (error instanceof DatabaseNotConfiguredError) {
        return fail(
          'The database is not configured. Set DATABASE_URL in the environment.',
          503
        )
      }

      // 23505 unique_violation — surfaced per-route with a friendlier message.
      if (error?.code === '23505') {
        return fail(uniqueViolationMessage(error), 400)
      }

      // 23503 foreign_key_violation
      if (error?.code === '23503') {
        return fail(
          'This record is referenced by existing transactions and cannot be removed.',
          409
        )
      }

      console.error('API error:', error)
      return fail(error?.message || 'Unexpected server error', 500)
    }
  }
}

function uniqueViolationMessage(error) {
  const constraint = String(error.constraint || '')
  if (constraint.includes('student')) return 'Student ID already exists'
  if (constraint.includes('isbn') || constraint.includes('book'))
    return 'ISBN already exists'
  return 'That value is already taken'
}

/** Parses an `[id]` route segment, rejecting anything non-numeric. */
export function parseId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** Trims a string field, collapsing blanks to null for optional columns. */
export function text(value) {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}
