// api/[code].js
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code || code.length !== 7) {
    return res.status(404).send('Geçersiz kod.');
  }

  const data = readData();

  if (!data[code]) {
    return res.status(404).send('Kod bulunamadı.');
  }

  const rawUrl = data[code];

  // Raw içeriği getir ve göster
  try {
    const response = await fetch(rawUrl);
    const content = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(content);
  } catch (error) {
    return res.status(500).send('İçerik alınamadı.');
  }
}
