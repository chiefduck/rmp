import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') });

console.log('🔧 Environment check:');
console.log('   Project directory:', process.cwd());
console.log('   .env file exists:', fs.existsSync(path.resolve(process.cwd(), '.env')));

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing environment variables in .env file');
  console.error('💡 Make sure your .env file contains:');
  console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping of CSV files to loan types
const csvMappings = [
  {
    filename: 'MORTGAGE30US.csv',
    loan_type: 'conventional',
    description: '30yr Conventional (Freddie Mac)'
  },
  {
    filename: 'OBMMIVA30YF.csv', 
    loan_type: 'va',
    description: '30yr VA (Optimal Blue)'
  },
  {
    filename: 'OBMMIFHA30YF.csv',
    loan_type: 'fha', 
    description: '30yr FHA (Optimal Blue)'
  },
  {
    filename: 'OBMMIJUMBO30YF.csv',
    loan_type: 'jumbo',
    description: '30yr Jumbo (Optimal Blue)'
  },
  {
    filename: 'MORTGAGE15US.csv',
    loan_type: '15yr_conventional',
    description: '15yr Conventional (Freddie Mac)'
  }
];

interface RateRecord {
  date: string;
  rate: number;
  loan_type: string;
}

// Simple CSV parser (since we can't use Papa Parse in Node.js environment)
function parseCSV(csvContent: string): { DATE?: string; [key: string]: string | undefined }[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: { [key: string]: string } = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    return row;
  });
}

function formatRateData(csvData: { [key: string]: string }[], loanType: string): RateRecord[] {
  const records: RateRecord[] = [];
  
  csvData.forEach(row => {
    // Handle different possible column names from FRED CSVs
    const dateValue = row.DATE || row.date || Object.values(row)[0];
    const rateValue = row.MORTGAGE30US || row.OBMMIVA30YF || row.OBMMIFHA30YF || 
                     row.OBMMIJUMBO30YF || row.MORTGAGE15US || Object.values(row)[1];
    
    if (dateValue && rateValue && rateValue !== '.' && rateValue !== '') {
      const rate = parseFloat(rateValue);
      if (!isNaN(rate)) {
        records.push({
          date: dateValue,
          rate: rate,
          loan_type: loanType
        });
      }
    }
  });
  
  return records;
}

async function importHistoricalRates() {
  console.log('🚀 Starting historical rate import...');
  
  const allRecords: RateRecord[] = [];
  
  // Process each CSV file
  for (const mapping of csvMappings) {
    const csvPath = path.join(process.cwd(), 'data', mapping.filename);
    
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  File not found: ${mapping.filename} - skipping`);
      continue;
    }
    
    console.log(`📊 Processing ${mapping.description}...`);
    
    try {
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const csvData = parseCSV(csvContent);
      const rateRecords = formatRateData(csvData, mapping.loan_type);
      
      console.log(`   ✅ Parsed ${rateRecords.length} records`);
      allRecords.push(...rateRecords);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${mapping.filename}:`, error);
    }
  }
  
  console.log(`\n📈 Total records to import: ${allRecords.length}`);
  
  if (allRecords.length === 0) {
    console.log('❌ No records to import. Check file paths and data.');
    return;
  }
  
  // Clear existing historical data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing historical data...');
  const { error: deleteError } = await supabase
    .from('rate_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all existing records
  
  if (deleteError) {
    console.error('Error clearing existing data:', deleteError);
  }
  
  // Bulk insert new data in chunks to avoid timeout
  const chunkSize = 1000;
  let insertedCount = 0;
  
  for (let i = 0; i < allRecords.length; i += chunkSize) {
    const chunk = allRecords.slice(i, i + chunkSize);
    
    // Format for database insertion
    const dbRecords = chunk.map(record => ({
      rate_value: record.rate,           // rate -> rate_value
      loan_type: record.loan_type,       // loan_type -> loan_type
      rate_date: record.date,            // date -> rate_date  
      rate_type: 'market',               // default rate_type
      term_years: record.loan_type === '15yr_conventional' ? 15 : 30, // set term_years
      created_at: new Date().toISOString(), // current timestamp
    }));
    
    const { error } = await supabase
      .from('rate_history')
      .insert(dbRecords);
    
    if (error) {
      console.error(`❌ Error inserting chunk ${i / chunkSize + 1}:`, error);
    } else {
      insertedCount += chunk.length;
      console.log(`✅ Inserted chunk ${i / chunkSize + 1}/${Math.ceil(allRecords.length / chunkSize)} (${insertedCount} total)`);
    }
  }
  
  console.log(`\n🎉 Import complete! Inserted ${insertedCount} rate records.`);
  
  // Summary by loan type
  console.log('\n📊 Summary by loan type:');
  const summary = allRecords.reduce((acc, record) => {
    acc[record.loan_type] = (acc[record.loan_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(summary).forEach(([loanType, count]) => {
    console.log(`   ${loanType}: ${count} records`);
  });
}

// Run the import
importHistoricalRates()
  .then(() => {
    console.log('✅ Import script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import script failed:', error);
    process.exit(1);
  });