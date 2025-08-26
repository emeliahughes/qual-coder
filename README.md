# TikTok Coding Tool

A browser-based tool for qualitative analysis of TikTok videos using custom coding schemas. Designed for researchers conducting manual annotation or open coding of social media datasets.

## 🧰 Features

- Load and display videos from a CSV dataset (via TikTok embed)
- View associated metadata (author, description, views, likes, etc.)
- Define flexible, multi-select coding categories with editable tags
- Add coder-specific notes
- Support for multiple coders with persistent localStorage tracking
- Navigate between videos and jump to specific indexes
- Responsive layout with side-by-side video + coding panel
- Intuitive bottom navigation with coder identity control

---

## 🗂 Project Structure

```
/public/data/tiktok_data.csv   ← source CSV file  
/src/components/ui/            ← reusable styled components  
/src/TikTokCodingTool.js       ← main component  
README.md                      ← you're here!
```

---

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Place your CSV**
   Place your TikTok video CSV in:
   ```
   public/data/tiktok_data.csv
   ```

3. **Run the app**
   ```bash
   npm start
   ```

---

## 🛠 CSV Format Requirements

Your CSV must include the following fields:

| Column          | Description                        |
|-----------------|------------------------------------|
| `id`            | TikTok video ID (as a string)      |
| `webVideoUrl`   | Full URL to the TikTok video       |
| `text`          | Video caption/description          |
| `author_name`   | TikTok username                    |
| `createTime`    | Unix timestamp                     |
| `playCount`     | View count                         |
| `diggCount`     | Like count                         |
| `shareCount`    | Share count                        |
| `commentCount`  | Comment count                      |
| `collectCount`  | Save count                         |

---

## 📦 To-Do / Roadmap

### 🔄 Core Functionality
- [ ] Export coded data to CSV or JSON format
- [ ] Add option to remove or hide videos from the coding queue
- [ ] Implement autosave confirmation when navigating
- [ ] Collapse the difference between the submit and sa

### 🌐 Backend Integration
- [X] Set up backend using Flask API routes
- [X] Upload CSVs from the UI and store them on the server
- [X] Store and retrieve responses per coder from SQLite via Flask API
- [ ] Automatically detect and handle large datasets (pagination or lazy load)

### 🗃 Multi-Project Support
- [X] Create project-level abstraction to handle multiple datasets
- [X] Add project selection screen with metadata and progress
- [X] Store coding schemas and coders separately per project

### 🏠 UI Improvements
- [X] Add a homepage/dashboard with recent projects
- [ ] Improve styling of tag selection and editing interface
- [ ] Make embed and metadata layout responsive on smaller screens
- [ ] Add visual indicator for coded vs. uncoded videos

### 👥 Coder Workflow
- [X] Allow coders to “complete” videos and filter by status
- [X] Assign videos to coders in round-robin or manual fashion
- [ ] Add coder progress overview (e.g., 35/120 completed)


---

