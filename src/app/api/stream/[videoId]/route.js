import { streamManagerInstance } from '../../../lib/streamManager';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request, {params }) {
  try {

    if (!params?.videoId) {
      return new Response('Video ID is required', { status: 400 });
    }
    
    const videoId =  params.videoId;
    const videoPath = join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);
    
    if (!existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      return new Response('Video not found', { status: 404 });
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // Common headers for all responses
    const commonHeaders = {
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    };

    // สำหรับ Safari ที่ไม่ส่ง range header
    if (!range) {
      const start = 0;
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
      const end = Math.min(CHUNK_SIZE - 1, fileSize - 1);
      
      const headers = {
        ...commonHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': end - start + 1,
      };

      const stream = createReadStream(videoPath, { start, end });
      return new Response(stream, { status: 206, headers });
    }

    // สำหรับ range requests
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
    let end = parts[1] 
      ? parseInt(parts[1], 10) 
      : Math.min(start + CHUNK_SIZE, fileSize - 1);
    
    // ป้องกันไม่ให้ end เกินขนาดไฟล์
    end = Math.min(end, fileSize - 1);
    
    // ตรวจสอบ range ที่ถูกต้อง
    if (start >= fileSize) {
      return new Response('Requested range not satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`,
          ...commonHeaders
        }
      });
    }

    const contentLength = end - start + 1;
    const stream = createReadStream(videoPath, { start, end });
    
    const headers = {
      ...commonHeaders,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': contentLength,
    };

    return new Response(stream, { status: 206, headers });

  } catch (error) {
    console.error('Error streaming video:', error);
    return new Response(`Error streaming video: ${error.message}`, { status: 500 });
  }
}