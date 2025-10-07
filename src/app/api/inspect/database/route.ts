import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Inspecting database for all auth-related tables...');

    // Get all tables in the database
    const { data: allTables, error: tablesError } = await supabaseAdmin
      .rpc('get_all_tables');

    if (tablesError) {
      console.log('⚠️ Could not fetch tables via RPC, trying direct query...');
    }

    // Alternative method to get tables
    const { data: tablesList, error: tablesListError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    // Get all auth-related tables by trying common names
    const authTableNames = [
      'auth_user',
      'user_activation', 
      'user_session',
      'users',
      'profiles',
      'accounts',
      'sessions'
    ];

    const tableResults: any = {};

    for (const tableName of authTableNames) {
      console.log(`🔍 Checking table: ${tableName}`);
      
      try {
        // Check if table exists by trying to select from it
        const { data: tableData, error: tableError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(3);

        if (!tableError) {
          // Get table structure
          const { data: columns, error: columnsError } = await supabaseAdmin
            .rpc('get_table_columns', { table_name: tableName });

          // Alternative method to get columns
          let columnInfo = null;
          if (columnsError) {
            const { data: altColumns } = await supabaseAdmin
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable, column_default')
              .eq('table_name', tableName)
              .eq('table_schema', 'public')
              .order('ordinal_position');
            
            columnInfo = altColumns;
          } else {
            columnInfo = columns;
          }

          tableResults[tableName] = {
            exists: true,
            rowCount: tableData?.length || 0,
            sampleData: tableData?.slice(0, 2) || [],
            columns: columnInfo || 'Could not fetch columns',
            structure: columnInfo ? columnInfo.map((col: any) => ({
              name: col.column_name,
              type: col.data_type,
              nullable: col.is_nullable,
              default: col.column_default
            })) : 'Could not fetch structure'
          };
        } else {
          tableResults[tableName] = {
            exists: false,
            error: tableError.message,
            errorCode: tableError.code
          };
        }
      } catch (err) {
        tableResults[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          exception: true
        };
      }
    }

    // Also try to get any table that might contain 'auth' or 'user' in the name
    let discoveredTables: string[] = [];
    if (tablesList && !tablesListError) {
      discoveredTables = tablesList
        .map(t => t.table_name)
        .filter(name => 
          name.toLowerCase().includes('auth') || 
          name.toLowerCase().includes('user') ||
          name.toLowerCase().includes('session') ||
          name.toLowerCase().includes('activation')
        );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalAuthTables: Object.keys(tableResults).filter(t => tableResults[t].exists).length,
        existingTables: Object.keys(tableResults).filter(t => tableResults[t].exists),
        missingTables: Object.keys(tableResults).filter(t => !tableResults[t].exists),
        discoveredTables: discoveredTables
      },
      tables: tableResults,
      allTables: tablesList?.map(t => t.table_name) || 'Could not fetch',
      environment: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    });

  } catch (error) {
    console.error('❌ Database inspection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
