import fs from 'fs';
import path from 'path';

// ================= READ JSON =================
export function readJson(relativePath: string) {
  const fullPath = path.resolve(__dirname, '../test-data', relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`JSON file not found: ${fullPath}`);
  }

  const file = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(file);
}

// ================= WRITE JSON =================
export function writeJson(relativePath: string, data: any) {
  const fullPath = path.resolve(__dirname, '../test-data', relativePath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}
