// app/components/VideoPlayer.js
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

      // Safari ต้องการการจัดการ metadata
      const handleLoadedMetadata = () => {
        // บางครั้ง Safari ต้องการ play() หลังจาก metadata โหลดเสร็จ
        if (video.paused) {
          video.play().catch(e => console.log('Auto-play prevented'));
        }
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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
        preload="metadata"
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