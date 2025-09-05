export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { roomId, filename, base64, duration, startedBy, participants } = await req.json();
    if (!roomId || !filename || !base64) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd();
    const recordingsDir = path.join(baseDir, 'recordings');
    await fs.promises.mkdir(recordingsDir, { recursive: true });
    const filePath = path.join(recordingsDir, filename);

    const buffer = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const relPath = process.env.NODE_ENV === 'production' ? `/api/recordings?file=${encodeURIComponent(filename)}` : `/recordings/${filename}`;

    try {
      await db.query(
        'INSERT INTO call_recordings (room_id, filename, path, duration_sec, started_by, participants) VALUES (?, ?, ?, ?, ?, ?)',
        [roomId, filename, relPath, duration || 0, startedBy || null, Array.isArray(participants) ? participants.join(',') : participants || null]
      );
    } catch (e) {
      // If DB write fails, still return success for file save
      console.warn('Recording DB insert failed:', e.message);
    }

    return NextResponse.json({ ok: true, path: relPath });
  } catch (e) {
    console.error('Recording save failed:', e);
    return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const directFile = searchParams.get('file');

    // Direct file streaming (used in production links)
    if (directFile) {
      const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd();
      const filePath = path.join(baseDir, 'recordings', directFile);
      try {
        const stat = await fs.promises.stat(filePath);
        const stream = fs.createReadStream(filePath);
        const ext = path.extname(directFile).toLowerCase();
        const contentType = ext === '.webm' ? 'video/webm' : ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream';
        return new NextResponse(stream, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(stat.size),
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        });
      } catch (e) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    const roomId = searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }
    const [rows] = await db.query(
      'SELECT id, room_id, filename, path, duration_sec, participants, created_at FROM call_recordings WHERE room_id = ? ORDER BY id DESC LIMIT 50',
      [roomId]
    );
    return NextResponse.json({ recordings: rows || [] });
  } catch (e) {
    console.error('Recording fetch failed:', e);
    return NextResponse.json({ error: 'Failed to load recordings' }, { status: 500 });
  }
}


