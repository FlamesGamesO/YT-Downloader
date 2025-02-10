const youtubedl = require('youtube-dl-exec');

module.exports = async (req, res) => {
  let { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  // Convert YouTube Shorts URL to a standard YouTube URL if needed
  if (url.includes("/shorts/")) {
    url = url.replace("/shorts/", "/watch?v=");
  }

  try {
    // Call youtube-dl-exec with options to dump JSON video info.
    // The options below help in getting a clean JSON output.
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:googlebot'
      ]
    });

    // Attempt to use the top-level URL if available (progressive stream)
    let downloadLinks = [];
    if (output.url) {
      downloadLinks.push({
        quality: "Best",
        url: output.url
      });
    } else if (output.formats) {
      // Otherwise, filter for formats that have both audio and video.
      downloadLinks = output.formats
        .filter(format => format.url && format.acodec !== 'none' && format.vcodec !== 'none')
        .map(format => ({
          quality: format.format || format.format_note || "Unknown",
          url: format.url
        }));
    }

    // Choose the highest resolution thumbnail if available.
    let thumbnailUrl = "";
    if (output.thumbnails && output.thumbnails.length) {
      thumbnailUrl = output.thumbnails[output.thumbnails.length - 1].url;
    }

    const responseData = {
      title: output.title || "No Title",
      thumbnail: thumbnailUrl,
      downloadLinks: downloadLinks
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error retrieving video info:", error);
    return res.status(500).json({ error: "Failed to retrieve video info." });
  }
};
