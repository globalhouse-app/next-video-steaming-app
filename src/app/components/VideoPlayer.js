'use client';

import React, { useRef, useEffect, useState } from 'react';

const VideoPlayer = ({ videoId }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleCanPlay = () => {
        setIsLoading(false);
        setError(null);
      };

      const handleError = (e) => {
        console.error('Video error:', e);
        setError('Error loading video');
        setIsLoading(false);
      };

      const handleWaiting = () => {
        setIsLoading(true);
      };

      const handlePlaying = () => {
        setIsLoading(false);
      };

      const handleLoadedMetadata = () => {
        video.play().catch(() => {
          // Safari อาจต้องการ user interaction ก่อน play
          console.log('Auto-play prevented');
        });
      };

      // Safari specific: ลองโหลดวิดีโอใหม่ถ้าเกิด error
      const handleStalled = () => {
        if (video.error) {
          console.log('Video stalled, attempting reload');
          video.load();
        }
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('stalled', handleStalled);

      // Safari specific: ตั้งค่า preload
      video.preload = 'auto';

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('stalled', handleStalled);
      };
    }
  }, []);

  return (
    <div className="relative w-full aspect-video bg-gray-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        preload="auto"
        controlsList="nodownload"
      >
        <source 
          src={`/api/stream/${encodeURIComponent(videoId)}`} 
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;