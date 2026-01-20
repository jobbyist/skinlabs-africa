const podcastData = [
    { 
        episode: 1, 
        title: "Beef Tallow Skincare: Miracle or Major Risk?", 
        description: "Unpacking the TikTok Trend.", 
        image: "/public/IMG_3749.png",
        audio: "/public/Ep 1 - Beef_Tallow_Skincare_Miracle_or_Major_Risk_Unpacking_the_TikTok_Trend.mp3",
    },
    // other episodes...
];

const PodcastSection = () => {
    return (
        <section>
            {podcastData.map(episode => (
                <div key={episode.episode}>
                    <h3>{episode.title}</h3>
                    <p>{episode.description}</p>
                    {episode.episode === 1 && (
                        <audio controls>
                            <source src={episode.audio} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    )}
                    {episode.episode !== 1 && <img src={episode.image} alt={episode.title}/>}  
                </div>
            ))}
        </section>
    );
};

export default PodcastSection;