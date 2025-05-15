import json
import csv

# Paths to your files
INPUT_JSON = "./combined_cleaned.json"   # or whatever your cleaned JSON file is called
OUTPUT_CSV = "./tiktok_data.csv"

def flatten_entry(entry):
    """Flattens the nested fields into a flat dictionary for CSV export."""
    flat = {
        "id": entry.get("id"),
        "text": entry.get("text"),
        "textLanguage": entry.get("textLanguage"),
        "createTime": entry.get("createTime"),
        "createTimeISO": entry.get("createTimeISO"),
        "isAd": entry.get("isAd"),
        "isMuted": entry.get("isMuted"),
        "webVideoUrl": entry.get("webVideoUrl"),
        "diggCount": entry.get("diggCount"),
        "shareCount": entry.get("shareCount"),
        "playCount": entry.get("playCount"),
        "collectCount": entry.get("collectCount"),
        "commentCount": entry.get("commentCount"),
        "isSlideshow": entry.get("isSlideshow"),
        "isPinned": entry.get("isPinned"),
        "isSponsored": entry.get("isSponsored"),
        "input": entry.get("input"),
        "searchHashtag": entry.get("searchHashtag", {}).get("name"),
        "searchHashtagViews": entry.get("searchHashtag", {}).get("views"),
        "mentions": ", ".join(entry.get("mentions", []))
    }

    # Flatten authorMeta
    author = entry.get("authorMeta", {})
    flat.update({
        "author_id": author.get("id"),
        "author_name": author.get("name"),
        "author_nickName": author.get("nickName"),
        "author_verified": author.get("verified"),
        "author_private": author.get("privateAccount"),
        "author_following": author.get("following"),
        "author_friends": author.get("friends"),
        "author_fans": author.get("fans"),
        "author_heart": author.get("heart"),
        "author_video": author.get("video"),
        "author_profileUrl": author.get("profileUrl")
    })

    # Flatten musicMeta
    music = entry.get("musicMeta", {})
    flat.update({
        "music_name": music.get("musicName"),
        "music_author": music.get("musicAuthor"),
        "music_original": music.get("musicOriginal"),
        "music_album": music.get("musicAlbum"),
        "music_playUrl": music.get("playUrl"),
        "music_id": music.get("musicId")
    })

    # Flatten videoMeta
    video = entry.get("videoMeta", {})
    flat.update({
        "video_height": video.get("height"),
        "video_width": video.get("width"),
        "video_duration": video.get("duration"),
        "video_definition": video.get("definition"),
        "video_format": video.get("format")
    })

    return flat

def main():
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Flatten all entries
    rows = [flatten_entry(entry) for entry in data]

    # Write to CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ CSV file saved to: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
