import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface PerfIssue {
  file: string;
  issue: string;
  impact: 'high' | 'medium' | 'low';
}

const issues: PerfIssue[] = [];

function checkAPI(file: string, content: string) {
  // N+1 queries
  if (content.includes('for') && content.includes('await') && content.includes('execute')) {
    issues.push({
      file,
      issue: 'Posible N+1 query (loop con await)',
      impact: 'high'
    });
  }
  
  // Sin índices
  if (content.includes('SELECT') && content.includes('WHERE') && !content.includes('INDEX')) {
    issues.push({
      file,
      issue: 'Query sin índice explícito',
      impact: 'medium'
    });
  }
  
  // Sin cache
  if (content.includes('fetch') && !content.includes('cache') && !content.includes('revalidate')) {
    issues.push({
      file,
      issue: 'Endpoint sin estrategia de cache',
      impact: 'medium'
    });
  }
  
  // Sin rate limiting
  if (content.includes('export async function') && !content.includes('rateLimit')) {
    issues.push({
      file,
      issue: 'Endpoint sin rate limiting',
      impact: 'high'
    });
  }
  
  // SELECT *
  if (content.includes('SELECT *')) {
    issues.push({
      file,
      issue: 'SELECT * (ineficiente)',
      impact: 'medium'
    });
  }
}

const apiDir = 'app/api';
function scanAPIs(dir: string) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanAPIs(fullPath);
    } else if (entry.name === 'route.ts') {
      const content = readFileSync(fullPath, 'utf-8');
      checkAPI(fullPath, content);
    }
  });
}

console.log('⚡ Analizando rendimiento...\n');
scanAPIs(apiDir);

const byImpact = issues.reduce((acc, issue) => {
  acc[issue.impact] = (acc[issue.impact] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('📊 Issues de Rendimiento:\n');
Object.entries(byImpact).forEach(([impact, count]) => {
  console.log(`  ${impact}: ${count}`);
});

console.log(`\n✅ Total: ${issues.length} issues\n`);

// Agrupar por tipo
const byType = issues.reduce((acc, issue) => {
  acc[issue.issue] = (acc[issue.issue] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('Por tipo:');
Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
