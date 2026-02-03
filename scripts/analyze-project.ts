import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

interface Issue {
  file: string;
  line: number;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

const issues: Issue[] = [];

function analyzeFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    // Detectar console.log en producción
    if (line.includes('console.log') && !filePath.includes('test')) {
      issues.push({
        file: filePath,
        line: idx + 1,
        type: 'console.log',
        message: 'Console.log en código de producción',
        severity: 'low'
      });
    }
    
    // Detectar fetch sin error handling
    if (line.includes('fetch(') && !line.includes('try') && !line.includes('catch')) {
      const nextLines = lines.slice(idx, idx + 5).join('\n');
      if (!nextLines.includes('catch')) {
        issues.push({
          file: filePath,
          line: idx + 1,
          type: 'no-error-handling',
          message: 'Fetch sin manejo de errores',
          severity: 'medium'
        });
      }
    }
    
    // Detectar useState sin tipo
    if (line.includes('useState(') && !line.includes('useState<')) {
      issues.push({
        file: filePath,
        line: idx + 1,
        type: 'no-type',
        message: 'useState sin tipo explícito',
        severity: 'low'
      });
    }
    
    // Detectar imports no usados (básico)
    if (line.startsWith('import') && line.includes('from')) {
      const imported = line.match(/import\s+{([^}]+)}/)?.[1];
      if (imported) {
        const items = imported.split(',').map(i => i.trim());
        items.forEach(item => {
          const count = content.split(item).length - 1;
          if (count === 1) {
            issues.push({
              file: filePath,
              line: idx + 1,
              type: 'unused-import',
              message: `Import no usado: ${item}`,
              severity: 'low'
            });
          }
        });
      }
    }
  });
}

function scanDirectory(dir: string) {
  const entries = readdirSync(dir);
  
  entries.forEach(entry => {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      scanDirectory(fullPath);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      analyzeFile(fullPath);
    }
  });
}

console.log('🔍 Analizando proyecto...\n');

scanDirectory('app');
scanDirectory('components');
scanDirectory('lib');

const byType = issues.reduce((acc, issue) => {
  acc[issue.type] = (acc[issue.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const bySeverity = issues.reduce((acc, issue) => {
  acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('📊 Resumen de Issues:\n');
console.log('Por tipo:');
Object.entries(byType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

console.log('\nPor severidad:');
Object.entries(bySeverity).forEach(([severity, count]) => {
  console.log(`  ${severity}: ${count}`);
});

console.log(`\n✅ Total: ${issues.length} issues encontrados`);

// Mostrar top 10 issues más críticos
const topIssues = issues
  .filter(i => i.severity === 'high' || i.severity === 'medium')
  .slice(0, 10);

if (topIssues.length > 0) {
  console.log('\n🔴 Top Issues Críticos:\n');
  topIssues.forEach(issue => {
    console.log(`[${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}`);
    console.log(`  ${issue.message}\n`);
  });
}
