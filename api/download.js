const ytdl = require("ytdl-core");

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  // Validate the YouTube URL before proceeding
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    // Retrieve video info from YouTube
    const info = await ytdl.getInfo(url);
    const videoData = info.videoDetails;
    
    // Filter available formats that contain both audio and video
    const downloadLinks = info.formats
      .filter(format => format.hasAudio && format.hasVideo && format.url)
      .map(format => ({
        quality: format.qualityLabel || format.quality || "Unknown",
        url: format.url
      }));
    
    // Use the highest resolution thumbnail available
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
