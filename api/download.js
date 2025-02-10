const ytdl = require("ytdl-core");

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Get video information from YouTube
    const info = await ytdl.getInfo(url);
    const videoData = info.videoDetails;
    
    // Filter available formats that contain both audio and video
    const downloadLinks = info.formats
      .filter(format => format.hasAudio && format.hasVideo && format.url)
      .map(format => ({
        quality: format.qualityLabel || format.quality || "Unknown",
        url: format.url
      }));
    
    // Choose a thumbnail: use the highest resolution available.
    const thumbnails = videoData.thumbnails;
    const thumbnailUrl = thumbnails[thumbnails.length - 1].url;

    const responseData = {
      title: videoData.title,
      thumbnail: thumbnailUrl,
      downloadLinks: downloadLinks
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching video info:", error);
    return res.status(500).json({ error: "Failed to retrieve video info." });
  }
};
