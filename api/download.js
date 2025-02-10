const fetch = require("node-fetch");

/**
 * Extracts the JSON blob from the YouTube HTML that is assigned to ytInitialPlayerResponse.
 * Returns the parsed object or null if not found.
 */
function extractPlayerResponse(html) {
  // YouTube embeds the player response like: 
  // "ytInitialPlayerResponse = { ... };"
  // The regex below uses a lazy match for the JSON object.
  const regex = /ytInitialPlayerResponse\s*=\s*(\{.+?\});/s;
  const match = html.match(regex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
  }
  return null;
}

module.exports = async (req, res) => {
  let { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  // Convert a YouTube Shorts URL to a standard watch URL, if needed.
  if (url.includes("/shorts/")) {
    url = url.replace("/shorts/", "/watch?v=");
  }

  try {
    // Fetch the raw HTML of the YouTube video page.
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch video page." });
    }
    const html = await response.text();

    // Extract the ytInitialPlayerResponse JSON from the HTML.
    const playerResponse = extractPlayerResponse(html);
    if (!playerResponse) {
      return res.status(500).json({ error: "Failed to extract video info from page." });
    }

    // Extract video details from the JSON.
    const videoDetails = playerResponse.videoDetails || {};
    const streamingData = playerResponse.streamingData || {};
    const formats = streamingData.formats || [];
    const adaptiveFormats = streamingData.adaptiveFormats || [];
    
    // Combine progressive and adaptive formats (this is a simplified approach).
    const allFormats = formats.concat(adaptiveFormats);

    // Map available formats to a simple downloadLinks array.
    // (Note: Many formats may be adaptive, so the links may not be directly downloadable as a single file.)
    const downloadLinks = allFormats
      .filter(f => f.url)
      .map(f => ({
        quality: f.qualityLabel || f.itag || "Unknown",
        url: f.url
      }));

    // Choose the highest resolution thumbnail if available.
    const thumbnails = videoDetails.thumbnails || [];
    const thumbnailUrl = thumbnails.length
      ? thumbnails[thumbnails.length - 1].url
      : "";

    const result = {
      title: videoDetails.title || "No Title",
      thumbnail: thumbnailUrl,
      downloadLinks: downloadLinks
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error retrieving video info:", error);
    return res.status(500).json({ error: "Failed to retrieve video info." });
  }
};
