// src/lib/VideoStreamManager.js

import { EventEmitter } from 'events';

export class VideoStreamManager extends EventEmitter {
  constructor() {
    super();
    this.activeStreams = new Map();
    this.streamStats = new Map();
  }

  // เริ่มสตรีมใหม่
  startStream(videoId, options = {}) {
    const streamId = `${videoId}-${Date.now()}`;
    
    const streamData = {
      id: streamId,
      videoId,
      startTime: Date.now(),
      options,
      status: 'initializing',
      bytesTransferred: 0,
      lastActivity: Date.now(),
      quality: options.quality || 'auto',
      bufferSize: options.bufferSize || 1024 * 1024, // 1MB default buffer
    };

    this.activeStreams.set(streamId, streamData);
    this.emit('streamStart', streamData);

    // เริ่มการติดตามสถิติ
    this._startStatsTracking(streamId);

    return streamData;
  }

  // อัพเดทสถานะของสตรีม
  updateStreamStatus(streamId, status, data = {}) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return false;

    const updatedStream = {
      ...stream,
      ...data,
      status,
      lastActivity: Date.now()
    };

    this.activeStreams.set(streamId, updatedStream);
    this.emit('streamUpdate', updatedStream);
    return true;
  }

  // อัพเดทคุณภาพของสตรีม
  updateStreamQuality(streamId, quality) {
    return this.updateStreamStatus(streamId, 'quality_change', { quality });
  }

  // บันทึกความก้าวหน้าของการส่งข้อมูล
  updateProgress(streamId, bytesTransferred) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return false;

    stream.bytesTransferred += bytesTransferred;
    stream.lastActivity = Date.now();
    
    this.emit('progress', {
      streamId,
      bytesTransferred: stream.bytesTransferred,
      timestamp: Date.now()
    });

    return true;
  }

  // จบการสตรีม
  endStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return false;

    const finalStats = {
      ...stream,
      endTime: Date.now(),
      duration: Date.now() - stream.startTime,
      finalStatus: stream.status
    };

    // บันทึกสถิติสุดท้าย
    this.streamStats.set(streamId, finalStats);
    
    // ลบออกจาก active streams
    this.activeStreams.delete(streamId);
    
    this.emit('streamEnd', finalStats);
    return true;
  }

  // ดึงข้อมูลสถิติของสตรีม
  getStreamStats(streamId) {
    // ดูว่ายังเป็น active stream อยู่ไหม
    const activeStream = this.activeStreams.get(streamId);
    if (activeStream) {
      return {
        ...activeStream,
        duration: Date.now() - activeStream.startTime,
        isActive: true
      };
    }

    // ถ้าไม่ active แล้ว ดูจากสถิติที่บันทึกไว้
    const historicalStats = this.streamStats.get(streamId);
    if (historicalStats) {
      return {
        ...historicalStats,
        isActive: false
      };
    }

    return null;
  }

  // ดึงข้อมูลสถิติทั้งหมด
  getAllStreamStats() {
    const stats = {
      active: Array.from(this.activeStreams.values()),
      historical: Array.from(this.streamStats.values()),
      totalStreams: this.activeStreams.size + this.streamStats.size
    };

    return stats;
  }

  // เริ่มการติดตามสถิติ (private method)
  _startStatsTracking(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    // ตรวจสอบ inactivity ทุก 30 วินาที
    const inactivityCheck = setInterval(() => {
      const currentStream = this.activeStreams.get(streamId);
      if (!currentStream) {
        clearInterval(inactivityCheck);
        return;
      }

      const inactiveTime = Date.now() - currentStream.lastActivity;
      if (inactiveTime > 30000) { // 30 วินาที
        this.emit('streamInactive', {
          streamId,
          inactiveTime,
          stream: currentStream
        });
      }
    }, 30000);

    // ทำความสะอาด interval เมื่อสตรีมจบ
    this.once(`streamEnd-${streamId}`, () => {
      clearInterval(inactivityCheck);
    });
  }
}