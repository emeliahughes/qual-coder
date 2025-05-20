import React from 'react';

export default function TikTokEmbed({ video }) {
    return (
        <div key={video.id}>
            <blockquote
                className="tiktok-embed w-100"
                cite={`https://www.tiktok.com/@${video.metadata.author}/video/${video.id.toString()}`}
                data-video-id={video.id.toString()}
                style={{ maxWidth: '100%', margin: 0 }}
            >
                <section>Loading…</section>
            </blockquote>
        </div>
    );
}
