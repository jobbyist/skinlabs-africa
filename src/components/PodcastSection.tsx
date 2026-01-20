import React from 'react';

const PodcastSection = ({ episode }) => {
    return (
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            {episode.audioUrl ? (
                <audio controls>
                    <source src={episode.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            ) : (
                <p>No audio available for this episode.</p>
            )}
        </div>
    );
};

export default PodcastSection;
