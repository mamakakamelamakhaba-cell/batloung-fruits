// Reads the .sql files in /database and turns them into executable statements.
// A simple state machine is used (NOT a greedy regex) so that semicolons inside
// quoted strings and comments never split a statement by mistake.
const fs = require('fs');
const path = require('path');

const STATEMENT_BREAKERS = /^(USE|CREATE\s+DATABASE|DROP\s+DATABASE)$/i;

function splitStatements(sql) {
  const out = [];
  let buf = '';
  let quote = null;      // ' | " | `
  let inLineComment = false;
  let inBlockComment = false;
  let inTrigger = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      buf += ch;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; buf += ch + next; i += 1; continue; }
      buf += ch;
      continue;
    }
    if (quote) {
      buf += ch;
      if (ch === '\\' && quote !== '`') { buf += next || ''; i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '-' && next === '-') { inLineComment = true; buf += ch + next; i += 1; continue; }
    if (ch === '#') { inLineComment = true; buf += ch; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; buf += ch + next; i += 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; buf += ch; continue; }

    if (ch === ';') {
      // triggers / procedures keep semicolons inside BEGIN..END
      const head = buf.trim().slice(0, 40).toUpperCase();
      if (/CREATE\s+(DEFINER=\S+\s+)?(TRIGGER|PROCEDURE|FUNCTION)/.test(head)) {
        inTrigger = true;
      }
      if (inTrigger && !/\bEND$/i.test(buf.trim())) {
        buf += ch;
        continue;
      }
      inTrigger = false;
      out.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// Map the project's SQL files onto the app. This is what fixes the
// "everything works locally" problem: instead of the user hand-running
// schema.sql + seed.sql + seed_extra.sql, the server does it in order.
const FILES = [
  { file: 'schema.sql', label: 'Tables' },
  { file: 'seed.sql', label: 'Core data' },
  { file: 'seed_extra.sql', label: 'Extra records' },
];

function readProjectSql(file) {
  const candidates = [
    path.join(__dirname, '..', '..', 'database', file),
    path.join(process.cwd(), 'database', file),
    path.join(process.cwd(), '..', 'database', file),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error(`SQL file not found: ${file} (looked in database/)`);
}

// Remove statements that would destroy / re-create the whole database.
// Hosted MySQL (Aiven) gives you one database and no CREATE/DROP DATABASE rights.
// Strip leading comments/whitespace so the first real keyword is visible.
function stripLeadingComments(stmt) {
  let s = stmt;
  for (;;) {
    const before = s;
    s = s.replace(/^\s+/, '');
    if (s.startsWith('--') || s.startsWith('#')) { s = s.replace(/^[^\n]*\n?/, ''); }
    else if (s.startsWith('/*')) { s = s.replace(/^\/\*[\s\S]*?\*\//, ''); }
    if (s === before) break;
  }
  return s.trim();
}

function isDestructive(stmt) {
  const bare = stripLeadingComments(stmt);
  if (!bare) return true; // comment-only chunk: nothing to run
  return /^(USE|CREATE\s+(DATABASE|SCHEMA)|DROP\s+(DATABASE|SCHEMA))\b/i.test(bare);
}

function statementsFor(file) {
  return splitStatements(readProjectSql(file))
    .filter((s) => s && !isDestructive(s))
    .map(stripLeadingComments)
    .filter(Boolean);
}

module.exports = { splitStatements, statementsFor, stripLeadingComments, FILES };
