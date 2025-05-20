import React from 'react';

export default function TikTokMetadata({ metadata }) {
  return (
    <div className="bg-light p-3 rounded border">
      <p><strong>Author:</strong> {metadata.author}</p>
      <p><strong>Description:</strong> {metadata.description}</p>
      <p><strong>Created:</strong> {metadata.create_time}</p>
      <p><strong>Views:</strong> {metadata.view_count}</p>
      <p><strong>Likes:</strong> {metadata.like_count}</p>
      <p><strong>Shares:</strong> {metadata.share_count}</p>
      <p><strong>Comments:</strong> {metadata.comment_count}</p>
      <p><strong>Saves:</strong> {metadata.save_count}</p>
    </div>
  );
}
