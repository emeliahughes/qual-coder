import React from 'react';

export default function TikTokEmbed({ video }) {
  if (!video || !video.id || !video.metadata?.author) {
    return <div className="text-muted">Video unavailable or missing required metadata.</div>;
  }

  const videoId = video.id.toString();
  const author = video.metadata.author;

  return (
    <div key={videoId}>
      <blockquote
        className="tiktok-embed w-100"
        cite={`https://www.tiktok.com/@${author}/video/${videoId}`}
        data-video-id={videoId}
        style={{ maxWidth: '100%', margin: 0 }}
      >
        <section>Loading…</section>
      </blockquote>
    </div>
  );
}
