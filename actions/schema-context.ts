"use server"

import { createClient } from "@/lib/supabase/server"
import { cache } from "react"

/**
 * Server Action: getSchemaContext
 * 
 * Introspects the database schema and returns a simplified string representation
 * of all tables and their columns. This is used to provide AI context about
 * the current database structure.
 * 
 * CACHE: Uses React cache() for request-level memoization.
 * Results are cached per-request to avoid duplicate DB queries.
 * 
 * NOTE: This code is designed to be copied into client applications (boilerplate).
 */

interface SchemaColumn {
  table_name: string
  column_name: string
  data_type: string
}

async function fetchSchemaFromDatabase(): Promise<string> {
  const supabase = await createClient()

  // Query information_schema to get all public tables and columns
  const { data, error } = await supabase
    .rpc('get_schema_context')
    .returns<SchemaColumn[]>()

  if (error) {
    console.error("Error fetching schema context:", error)
    
    // Fallback: Try direct query if RPC function doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .eq('table_schema', 'public')
      .order('table_name')
      .order('ordinal_position')

    if (fallbackError) {
      console.error("Fallback schema query failed:", fallbackError)
      return "Schema introspection unavailable"
    }

    return formatSchemaData(fallbackData as SchemaColumn[])
  }

  return formatSchemaData(data)
}

function formatSchemaData(columns: SchemaColumn[]): string {
  if (!columns || columns.length === 0) {
    return "No tables found"
  }

  // Group columns by table
  const tableMap = new Map<string, Array<{ name: string; type: string }>>()

  for (const col of columns) {
    if (!tableMap.has(col.table_name)) {
      tableMap.set(col.table_name, [])
    }
    tableMap.get(col.table_name)!.push({
      name: col.column_name,
      type: col.data_type,
    })
  }

  // Format as readable string
  const lines: string[] = []
  
  for (const [tableName, cols] of tableMap.entries()) {
    const columnList = cols.map(c => `${c.name}: ${c.type}`).join(", ")
    lines.push(`Table: ${tableName} (${columnList})`)
  }

  return lines.join("\n")
}

/**
 * Cached version of schema fetching using React cache()
 * This provides request-level memoization - the same request
 * will reuse the result, but each new request will fetch fresh data.
 * 
 * This is better than unstable_cache for this use case because:
 * 1. It works with cookies() without issues
 * 2. Schema changes are reflected immediately in new requests
 * 3. Still prevents duplicate queries within the same request
 */
const getCachedSchema = cache(async (): Promise<string> => {
  return await fetchSchemaFromDatabase()
})

/**
 * Public API: Get schema context for AI
 * Returns a formatted string describing all database tables and columns
 * 
 * Cached per-request using React cache() to avoid duplicate DB queries
 * within the same request (e.g., if called multiple times in one render)
 */
export async function getSchemaContext(): Promise<string> {
  try {
    return await getCachedSchema()
  } catch (error) {
    console.error("Error in getSchemaContext:", error)
    return "Schema context unavailable"
  }
}

/**
 * Helper: Create the RPC function in Supabase (run this SQL once)
 * 
 * This function should be created in the Supabase SQL Editor:
 * 
 * CREATE OR REPLACE FUNCTION get_schema_context()
 * RETURNS TABLE (
 *   table_name text,
 *   column_name text,
 *   data_type text
 * )
 * LANGUAGE sql
 * SECURITY DEFINER
 * AS $$
 *   SELECT 
 *     c.table_name::text,
 *     c.column_name::text,
 *     c.data_type::text
 *   FROM information_schema.columns c
 *   WHERE c.table_schema = 'public'
 *   ORDER BY c.table_name, c.ordinal_position;
 * $$;
 */

