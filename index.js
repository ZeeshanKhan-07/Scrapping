require('dotenv').config();
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const API_KEY = process.env.YOUTUBE_API_KEY;
const MAX_RESULTS = 50; 
const TOTAL_VIDEOS = 500; 
const genre = 'music';

const csvWriter = createCsvWriter({
    path: 'youtube_data.csv',
    header: [
        { id: 'videoUrl', title: 'Video URL' },
        { id: 'title', title: 'Title' },
        { id: 'description', title: 'Description' },
        { id: 'channelTitle', title: 'Channel Title' },
        { id: 'tags', title: 'Keyword Tags' },
        { id: 'category', title: 'YouTube Video Category' },
        { id: 'topicDetails', title: 'Topic Details' },
        { id: 'publishedAt', title: 'Video Published At' },
        { id: 'duration', title: 'Video Duration' },
        { id: 'viewCount', title: 'View Count' },
        { id: 'commentCount', title: 'Comment Count' },
        { id: 'captionsAvailable', title: 'Captions Available' },
        { id: 'captionText', title: 'Caption Text' },
        { id: 'location', title: 'Location of Recording' },
    ]
});

async function fetchVideos(genre, pageToken = '') {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
            part: 'snippet',
            maxResults: MAX_RESULTS,
            q: genre,
            type: 'video',
            pageToken: pageToken,
            key: API_KEY
        }
    });
    return response.data;
}

async function fetchVideoDetails(videoId) {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
            part: 'snippet,contentDetails,statistics,topicDetails',
            id: videoId,
            key: API_KEY
        }
    });
    return response.data.items[0];
}

async function main() {
    let videos = [];
    let pageToken = '';

    while (videos.length < TOTAL_VIDEOS) {
        const data = await fetchVideos(genre, pageToken);
        const videoPromises = data.items.map(item => fetchVideoDetails(item.id.videoId));
        const videoDetails = await Promise.all(videoPromises);

        videoDetails.forEach(video => {
            if (video) {
                videos.push({
                    videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    channelTitle: video.snippet.channelTitle,
                    tags: video.snippet.tags ? video.snippet.tags.join(', ') : '',
                    category: video.snippet.categoryId,
                    topicDetails: video.topicDetails && video.topicDetails.topicIds ? video.topicDetails.topicIds.join(', ') : '', // Added Topic Details
                    publishedAt: video.snippet.publishedAt,
                    duration: video.contentDetails.duration,
                    viewCount: video.statistics.viewCount,
                    commentCount: video.statistics.commentCount,
                    captionsAvailable: video.contentDetails.caption === 'true' ? 'true' : 'false',
                    captionText: '',
                    location: video.snippet.localized ? video.snippet.localized.title : ''
                });
            }
        });

        pageToken = data.nextPageToken;
        if (!pageToken) break; // Exit if no more pages
    }

    // Write to CSV
    await csvWriter.writeRecords(videos);
    console.log('Data has been written to youtube_data.csv');
}

main().catch(console.error);