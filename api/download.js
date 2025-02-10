const ytdl = require("ytdl-core");

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    const info = await ytdl.getInfo(url, { format: "best" });
    const videoData = info.videoDetails;
    
    // Attempt to use top-level URL if available
    let downloadLinks = [];
    if (info.url) {
      downloadLinks.push({
        quality: "Best",
        url: info.url
      });
    } else {
      // Otherwise, filter formats for progressive streams (both audio and video)
      downloadLinks = info.formats
        .filter(format => format.hasAudio && format.hasVideo && format.url)
        .map(format => ({
          quality: format.qualityLabel || format.format || "Unknown",
          url: format.url
        }));
    }
    
    // Use highest resolution thumbnail available
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
