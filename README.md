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
- [ ] Support keyboard shortcuts for tagging
- [ ] Add option to remove or hide videos from the coding queue
- [ ] Implement autosave confirmation when navigating

### 🌐 Backend Integration
- [ ] Set up backend using Express/FastAPI/Next.js API routes
- [ ] Upload CSVs from the UI and store them on the server
- [ ] Store and retrieve responses per coder from a backend DB (e.g., Firebase, Supabase, PostgreSQL)
- [ ] Automatically detect and handle large datasets (pagination or lazy load)

### 🗃 Multi-Project Support
- [ ] Create project-level abstraction to handle multiple datasets
- [ ] Add project selection screen with metadata and progress
- [ ] Store coding schemas and coders separately per project

### 🏠 UI Improvements
- [ ] Add a homepage/dashboard with recent projects
- [ ] Improve styling of tag selection and editing interface
- [ ] Make embed and metadata layout responsive on smaller screens
- [ ] Add visual indicator for coded vs. uncoded videos

### 👥 Coder Workflow
- [ ] Allow coders to “complete” videos and filter by status
- [ ] Assign videos to coders in round-robin or manual fashion
- [ ] Add coder progress overview (e.g., 35/120 completed)

### 🔐 Authentication (Optional)
- [ ] Add lightweight authentication for coders
- [ ] Store coder identities securely on backend
- [ ] Provide unique links or logins for each coder

---

