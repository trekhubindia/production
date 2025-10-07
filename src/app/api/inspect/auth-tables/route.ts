import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Inspecting auth-related tables in cloud database...');

    const authTables = [
      'auth_user',
      'user_profiles',
      'user_roles', 
      'user_session',
      'user_key',
      'user_activation'
    ];

    const results: any = {};

    for (const tableName of authTables) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        // Try to select from the table to see if it exists
        const { data, error, count } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(2);

        if (error) {
          results[tableName] = {
            exists: false,
            error: error.message,
            code: error.code,
            hint: error.hint || null
          };
        } else {
          // Table exists, get sample data and structure info
          const sampleRecord = data && data.length > 0 ? data[0] : null;
          const columns = sampleRecord ? Object.keys(sampleRecord) : [];

          results[tableName] = {
            exists: true,
            totalRows: count || 0,
            columns: columns,
            sampleData: data?.slice(0, 1) || [],
            columnTypes: sampleRecord ? Object.entries(sampleRecord).map(([key, value]) => ({
              name: key,
              sampleValue: value,
              type: typeof value,
              isNull: value === null
            })) : []
          };
        }
      } catch (err) {
        results[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          exception: true
        };
      }
    }

    // Summary
    const existingTables = Object.keys(results).filter(t => results[t].exists);
    const missingTables = Object.keys(results).filter(t => !results[t].exists);

    // Check specific columns we need for OAuth
    const requiredColumns = {
      auth_user: ['id', 'email', 'name', 'provider', 'avatar_url'],
      user_activation: ['id', 'user_id', 'is_activated', 'activation_method'],
      user_session: ['id', 'user_id', 'expires_at', 'activity_log']
    };

    const columnCheck: any = {};
    for (const [table, cols] of Object.entries(requiredColumns)) {
      if (results[table]?.exists) {
        const existingCols = results[table].columns || [];
        columnCheck[table] = {
          required: cols,
          existing: existingCols,
          missing: cols.filter(col => !existingCols.includes(col)),
          extra: existingCols.filter(col => !cols.includes(col))
        };
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalChecked: authTables.length,
        existing: existingTables.length,
        missing: missingTables.length,
        existingTables,
        missingTables
      },
      tables: results,
      columnAnalysis: columnCheck,
      recommendations: [
        ...missingTables.map(table => ({
          issue: `Missing table: ${table}`,
          solution: `Create the ${table} table with proper schema`,
          priority: table === 'auth_user' ? 'HIGH' : 'MEDIUM'
        })),
        ...Object.entries(columnCheck).flatMap(([table, info]: [string, any]) => 
          info.missing.length > 0 ? [{
            issue: `Missing columns in ${table}: ${info.missing.join(', ')}`,
            solution: `Add missing columns to ${table} table`,
            priority: 'HIGH'
          }] : []
        )
      ]
    });

  } catch (error) {
    console.error('❌ Auth tables inspection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
