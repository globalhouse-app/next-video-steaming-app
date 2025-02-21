const fs = require('fs').promises;
import { NextResponse } from 'next/server';
import { join } from 'path';
import * as MediaInfo from 'node-mediainfo';

async function detectVideoFormat(filePath) {
  try {
    // สร้าง MediaInfo instance
    const mediaInfo = new MediaInfo();
    
    // วิเคราะห์ไฟล์
    const result = await mediaInfo.analyzeFile(filePath);
    
    // ดึงข้อมูลจาก track แรก (General track)
    const generalTrack = result.media.track[0];
    // หา video track
    const videoTrack = result.media.track.find(track => track['@type'] === 'Video');
    // หา audio track
    const audioTrack = result.media.track.find(track => track['@type'] === 'Audio');
    
    return {
      format: generalTrack.Format,
      formatProfile: generalTrack.Format_Profile || '',
      codecId: generalTrack.CodecID || '',
      fileSize: generalTrack.FileSize || '',
      duration: generalTrack.Duration || '',
      // ข้อมูล video
      videoCodec: videoTrack?.Format || '',
      resolution: videoTrack ? `${videoTrack.Width}x${videoTrack.Height}` : '',
      frameRate: videoTrack?.FrameRate || '',
      // ข้อมูล audio
      audioCodec: audioTrack?.Format || '',
      channels: audioTrack?.Channels || '',
      sampleRate: audioTrack?.SamplingRate || ''
    };

  } catch (error) {
    console.error('Error analyzing file:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const videoPath = join(process.cwd(), 'public', 'videos', 'video_173812599601.mp4');
    const formatInfo = await detectVideoFormat(videoPath);
    
    return NextResponse.json({ 
      ...formatInfo,
      message: `Real video format: ${formatInfo.format}`
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to check video format: ' + error.message },
      { status: 500 }
    );
  }
}
