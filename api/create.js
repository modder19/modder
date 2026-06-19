// api/create.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// JSON dosyasındaki verileri oku
const DATA_FILE = path.join(process.cwd(), 'data.json');

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function generateCode(length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST metodu kullanılabilir.' });
  }

  const { rawUrl } = req.body;

  if (!rawUrl || !rawUrl.startsWith('https://raw.githubusercontent.com/')) {
    return res.status(400).json({ error: 'Geçerli bir GitHub Raw linki girin.' });
  }

  const data = readData();

  // Aynı URL varsa mevcut kodu döndür
  const existingEntry = Object.entries(data).find(([_, url]) => url === rawUrl);
  if (existingEntry) {
    const existingCode = existingEntry[0];
    return res.status(200).json({
      code: existingCode,
      url: `https://${req.headers.host}/${existingCode}`,
      rawUrl,
    });
  }

  // Yeni kod oluştur (benzersiz olana kadar dene)
  let code;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (data[code] && attempts < 10);

  if (data[code]) {
    return res.status(500).json({ error: 'Kod üretilemedi, tekrar deneyin.' });
  }

  data[code] = rawUrl;
  writeData(data);

  return res.status(201).json({
    code,
    url: `https://${req.headers.host}/${code}`,
    rawUrl,
  });
}
