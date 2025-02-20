import { streamManagerInstance } from '../../../lib/streamManager';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request, context) {
  try {
    const videoId = await context.params.videoId;
    const videoPath = join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);
    
    if (!existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      return new Response('Video not found', { status: 404 });
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // สำหรับ Safari ที่ไม่ส่ง range header
    if (!range) {
      // แทนที่จะส่งไฟล์ทั้งหมด เราจะส่งเฉพาะส่วนแรก
      const CHUNK_SIZE = 1024 * 1024; // 1MB
      const end = Math.min(CHUNK_SIZE - 1, fileSize - 1);
      
      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes 0-${end}/${fileSize}`,
        'Content-Length': end + 1,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      const stream = createReadStream(videoPath, { start: 0, end });
      return new Response(stream, { status: 206, headers });
    }

    // สำหรับ range requests
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : start + 1024 * 1024; // 1MB chunks
    
    // ป้องกันไม่ให้ end เกินขนาดไฟล์
    end = Math.min(end, fileSize - 1);
    
    // ตรวจสอบ range ที่ถูกต้อง
    if (start >= fileSize) {
      return new Response('Requested range not satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`
        }
      });
    }

    const contentLength = end - start + 1;
    const stream = createReadStream(videoPath, { start, end });
    
    const headers = {
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    return new Response(stream, { status: 206, headers });

  } catch (error) {
    console.error('Error streaming video:', error);
    return new Response(`Error streaming video: ${error.message}`, { status: 500 });
  }
}