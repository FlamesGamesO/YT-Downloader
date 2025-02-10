const ytdl = require("ytdl-core");

module.exports = async (req, res) => {
  let { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  // Convert YouTube Shorts URL to a standard YouTube URL
  if (url.includes("/shorts/")) {
    url = url.replace("/shorts/", "/watch?v=");
  }

  // Validate the URL
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  try {
    // Retrieve video info using ytdl-core with the "best" format
    const info = await ytdl.getInfo(url, { format: "best" });
    const videoData = info.videoDetails;

    // Try to get a progressive (combined audio/video) download link.
    let downloadLinks = [];
    if (info.url) {
      downloadLinks.push({
        quality: "Best",
        url: info.url,
      });
    } else {
      // Otherwise, filter the formats for ones that include both audio and video.
      downloadLinks = info.formats
        .filter(format => format.hasAudio && format.hasVideo && format.url)
        .map(format => ({
          quality: format.qualityLabel || format.format || "Unknown",
          url: format.url,
        }));
    }

    // Use the highest resolution thumbnail available
    const thumbnails = videoData.thumbnails;
    const thumbnailUrl = thumbnails && thumbnails.length
      ? thumbnails[thumbnails.length - 1].url
      : "";

    const responseData = {
      title: videoData.title,
      thumbnail: thumbnailUrl,
      downloadLinks: downloadLinks,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching video info:", error);
    return res.status(500).json({ error: "Failed to retrieve video info." });
  }
};
