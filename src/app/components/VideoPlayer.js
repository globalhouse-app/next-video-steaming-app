'use client';

import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoId }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Add error handling
      video.addEventListener('error', (e) => {
        console.error('Error during video playback:', e);
      });

      // Add loading indicator
      video.addEventListener('waiting', () => {
        // Show loading spinner
        console.log('Video is buffering...');
      });

      video.addEventListener('playing', () => {
        // Hide loading spinner
        console.log('Video is playing');
      });

      // Add quality control if supported
      if (video.getVideoPlaybackQuality) {
        setInterval(() => {
          const quality = video.getVideoPlaybackQuality();
          if (quality.droppedVideoFrames > 0) {
            console.warn('Dropped frames detected:', quality.droppedVideoFrames);
          }
        }, 5000);
      }
    }
  }, []);

  return (
    <div className="relative w-full aspect-video">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload"
        playsInline
        preload="metadata"
      >
        <source src={`/api/stream/${videoId}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;