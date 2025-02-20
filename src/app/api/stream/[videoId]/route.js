import { streamManagerInstance } from '../../../lib/streamManager';
import { createReadStream, statSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request, context) {
  try {
    // รอให้ params พร้อมใช้งานก่อน
    const videoId = await context.params.videoId;
    
    // สร้าง path ที่ถูกต้องโดยใช้ join
    const videoPath = join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);
    
    // ตรวจสอบว่าไฟล์มีอยู่จริงไหม
    if (!existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      return new Response('Video not found', { status: 404 });
    }

    // เริ่มใช้ StreamManager
    const stream = streamManagerInstance.startStream(videoId);
    console.log(`Starting stream for video: ${videoId}`);
    
    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = createReadStream(videoPath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };

      return new Response(fileStream, {
        status: 206,
        headers: headers,
      });
    }

    const fileStream = createReadStream(videoPath);
    return new Response(fileStream, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize,
      },
    });

  } catch (error) {
    console.error('Error streaming video:', error);
    return new Response(`Error streaming video: ${error.message}`, { 
      status: 500 
    });
  }
}