import VideoPlayer from './components/VideoPlayer';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Streaming Demo</h1>
      <VideoPlayer videoId="sample_3840x2160" />
    </main>
  );
}