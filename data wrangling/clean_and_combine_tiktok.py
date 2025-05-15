import json
import os
import glob

# Configure these paths
INPUT_FOLDER = "./tiktok_jsons"       # Folder where your input JSON files are stored
OUTPUT_FILE = "./combined_cleaned.json"  # Path to save the combined, cleaned file

# Define which fields to keep
TOP_LEVEL_KEYS = {
    "id", "text", "textLanguage", "createTime", "createTimeISO", "isAd", "isMuted",
    "authorMeta", "musicMeta", "webVideoUrl", "mediaUrls", "videoMeta",
    "diggCount", "shareCount", "playCount", "collectCount", "commentCount",
    "mentions", "isSlideshow", "isPinned", "isSponsored", "input", "searchHashtag"
}
AUTHOR_KEYS = {
    "id", "name", "profileUrl", "nickName", "verified", "privateAccount",
    "ttSeller", "following", "friends", "fans", "heart", "video"
}
MUSIC_KEYS = {
    "musicName", "musicAuthor", "musicOriginal", "musicAlbum", "playUrl", "musicId"
}
VIDEO_KEYS = {
    "height", "width", "duration", "definition", "format"
}

def reduce_tiktok_json(data):
    reduced = []
    for item in data:
        cleaned_item = {k: v for k, v in item.items() if k in TOP_LEVEL_KEYS}
        if "authorMeta" in item:
            cleaned_item["authorMeta"] = {
                k: v for k, v in item["authorMeta"].items() if k in AUTHOR_KEYS
            }
        if "musicMeta" in item:
            cleaned_item["musicMeta"] = {
                k: v for k, v in item["musicMeta"].items() if k in MUSIC_KEYS
            }
        if "videoMeta" in item:
            cleaned_item["videoMeta"] = {
                k: v for k, v in item["videoMeta"].items() if k in VIDEO_KEYS
            }
        reduced.append(cleaned_item)
    return reduced

def main():
    all_cleaned_data = []

    # Load all JSON files in the input folder
    for filepath in glob.glob(os.path.join(INPUT_FOLDER, "*.json")):
        print(f"Processing {filepath}...")
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                cleaned = reduce_tiktok_json(raw_data)
                all_cleaned_data.extend(cleaned)
        except Exception as e:
            print(f"Failed to process {filepath}: {e}")

    # Write to combined output file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_cleaned_data, f, indent=2)
    print(f"\n✅ Combined file saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
