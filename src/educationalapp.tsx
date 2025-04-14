import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen, Monitor, Mouse, Keyboard, HelpCircle } from 'lucide-react';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const categories = [
    { id: 'basics', name: 'Computer Basics', icon: Monitor, description: 'Learn about parts of a computer and how they work' },
    { id: 'mouse', name: 'Using a Mouse', icon: Mouse, description: 'How to use a mouse and practice clicking' },
    { id: 'keyboard', name: 'Typing Skills', icon: Keyboard, description: 'Learn typing and keyboard shortcuts' },
    { id: 'internet', name: 'Internet Basics', icon: BookOpen, description: 'How to use web browsers and search online' },
    { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Troubleshooting common computer problems' },
];

export default function EducationalApp() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('basics');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [playingVideo, setPlayingVideo] = useState(null);
    const [blockedAttempts, setBlockedAttempts] = useState<string[]>([]);

    const formatViewCount = (count: number) => count >= 1000000 ? Math.floor(count / 1000000) + 'M' : count >= 1000 ? Math.floor(count / 1000) + 'K' : count;
    const formatDuration = (isoDuration: string) => {
        const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = match?.[1] ? parseInt(match[1]) : 0;
        const minutes = match?.[2] ? parseInt(match[2]) : 0;
        const seconds = match?.[3] ? parseInt(match[3]) : 0;
        return (hours > 0 ? `${hours}:` : '') + `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const bannedWords = ['song', 'songs', 'music', 'movie', 'movies', 'dance', 'game', 'games', 'sports', 'celebrity', 'film', 'dj'];

    const fetchYouTubeVideos = async (query: string, category: string) => {
        setIsLoading(true);
        setError('');
        try {
            let searchTerm = query || `beginner ${category.replace('-', ' ')} computer tutorial`;
            if (!searchTerm.toLowerCase().includes('computer')) {
                searchTerm += ' computer tutorial';
            }
            const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    maxResults: 12,
                    q: searchTerm,
                    type: 'video',
                    key: API_KEY,
                    videoEmbeddable: true,
                    safeSearch: 'strict',
                }
            });
            const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
            const details = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'contentDetails,statistics,snippet',
                    id: videoIds,
                    key: API_KEY,
                }
            });
            const results = details.data.items.map((video: any) => ({
                id: video.id,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails.medium.url,
                channelTitle: video.snippet.channelTitle,
                viewCount: formatViewCount(Number(video.statistics.viewCount)),
                duration: formatDuration(video.contentDetails.duration)
            }));
            setSearchResults(results);
        } catch (err) {
            console.error(err);
            setError('Could not load videos. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        const lowerQuery = searchQuery.toLowerCase();
        if (bannedWords.some(word => lowerQuery.includes(word))) {
            setError('❌ Please search for computer-related educational topics only.');
            setSearchResults([]);
            setBlockedAttempts(prev => [...prev, searchQuery]);
            return;
        }
        fetchYouTubeVideos(searchQuery, selectedCategory);
    };

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSearchQuery('');
        fetchYouTubeVideos('', categoryId);
    };

    useEffect(() => {
        handleCategoryClick('basics');
    }, []);

    const VideoPlayer = ({ videoId }: { videoId: string }) => (
        videoId && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold">Now Playing</h3>
                        <button onClick={() => setPlayingVideo(null)} className="text-gray-500 hover:text-gray-700">Close</button>
                    </div>
                    <div className="aspect-video">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                </div>
            </div>
        )
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="bg-blue-600 text-white p-4 shadow">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Ksagar Classes</h1>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="p-2 rounded text-gray-700 focus:outline-none"
                        />
                        <button onClick={handleSearch} className="bg-blue-800 hover:bg-blue-900 p-2 rounded">Search</button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-1/4">
                    <nav className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">Categories</h2>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`w-full flex items-center p-2 mb-2 rounded hover:bg-blue-100 ${selectedCategory === category.id ? 'bg-blue-200' : ''}`}
                            >
                                <category.icon className="w-5 h-5 mr-3" /> {category.name}
                            </button>
                        ))}
                    </nav>
                </aside>

                <section className="flex-1">
                    {error && <div className="text-center text-red-500">{error}</div>}

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-40 bg-gray-300 animate-pulse rounded-lg"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map(video => (
                                <div
                                    key={video.id}
                                    onClick={() => setPlayingVideo(video.id)}
                                    className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer overflow-hidden"
                                >
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover" />
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-800 line-clamp-2">{video.title}</h3>
                                        <p className="text-gray-500 text-sm">{video.channelTitle}</p>
                                        <div className="text-xs text-gray-400">{video.viewCount} views · {video.duration}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {blockedAttempts.length > 0 && (
                        <div className="p-4 mt-4 bg-yellow-100 rounded-lg">
                            <h3 className="font-bold mb-2">Blocked Searches:</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-600">
                                {blockedAttempts.map((attempt, index) => (
                                    <li key={index}>{attempt}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </main>

            {playingVideo && <VideoPlayer videoId={playingVideo} />}

            <footer className="text-center text-sm p-4 text-gray-500">© 2025 Ksagar Classes. All rights reserved.</footer>
        </div>
    );
}
