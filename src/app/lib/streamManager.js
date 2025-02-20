// src/lib/streamManager.js

import { VideoStreamManager } from './VideoStreamManager';

// สร้าง singleton instance
const streamManagerInstance = new VideoStreamManager();

// เพิ่ม event listeners สำหรับ logging
streamManagerInstance.on('streamStart', (stream) => {
  console.log(`Stream started: ${stream.id}`);
});

streamManagerInstance.on('streamEnd', (stats) => {
  console.log(`Stream ended: ${stats.id}, Duration: ${stats.duration}ms`);
});

streamManagerInstance.on('streamInactive', (data) => {
  console.warn(`Stream inactive: ${data.streamId}, Inactive time: ${data.inactiveTime}ms`);
});

streamManagerInstance.on('progress', (data) => {
  console.debug(`Stream progress: ${data.streamId}, Bytes: ${data.bytesTransferred}`);
});

// Export singleton instance
export { streamManagerInstance };