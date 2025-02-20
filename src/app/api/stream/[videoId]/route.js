import { streamManagerInstance } from '../../../lib/streamManager';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request, context) {
  try {
    const videoId = await context?.params?.videoId;
    const videoPath = join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);
    
    if (!existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      return new Response('Video not found', { status: 404 });
    }

    const stream = streamManagerInstance.startStream(videoId);
    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // Safari มักจะไม่ส่ง range header มาในครั้งแรก
    if (!range) {
      // ส่ง response แบบเต็มไฟล์พร้อม headers สำหรับ Safari
      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
        'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      };

      const fileStream = createReadStream(videoPath);
      return new Response(fileStream, { status: 200, headers });
    }

    // จัดการ range request (สำหรับ Chrome และ Safari เมื่อ seek)
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    // Safari มักส่ง range แบบไม่มี end
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1); // ส่งครั้งละ 1MB
    const chunkSize = end - start + 1;

    // ตรวจสอบ range ที่ขอมา
    if (start >= fileSize || end >= fileSize) {
      return new Response('Requested range not satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`
        }
      });
    }

    const fileStream = createReadStream(videoPath, { start, end });
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-cache',
    };

    return new Response(fileStream, { status: 206, headers });

  } catch (error) {
    console.error('Error streaming video:', error);
    return new Response(`Error streaming video: ${error.message}`, { status: 500 });
  }
}