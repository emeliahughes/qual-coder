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
- **NEW:** Comprehensive results analysis with statistical insights
- **NEW:** Cross-category tag correlations and co-occurrence analysis
- **NEW:** Inter-coder agreement analysis with detailed metrics
- **NEW:** Tag diversity and usage statistics

---

## 🗂 Project Structure

```
/public/data/tiktok_data.csv   ← source CSV file  
/src/components/ui/            ← reusable styled components  
/src/components/               ← main application components
├── HomePage.js               ← project dashboard and management
├── coding.js                 ← main coding interface
├── ResultsPage.js            ← comprehensive results analysis
├── ProjectEditorModal.js     ← project creation and editing
└── ...                       ← other components
README.md                      ← you're here!
```

---

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the backend server** (see backend README for setup)
   ```bash
   cd ../qual-coding-backend
   source venv/bin/activate
   flask run --port=5001
   ```

3. **Start the frontend**
   ```bash
   npm start
   ```

4. **Create a project and upload your CSV**
   - Navigate to the homepage
   - Click "Create New Project"
   - Upload your TikTok video CSV
   - Define your coding categories and tags

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

## 📊 Results Analysis Features

### Statistical Analysis
- **Cross-Category Tag Correlations:** Pearson correlation analysis between tags from different categories
- **Tag Co-occurrences:** Most frequent tag combinations across categories
- **Inter-Coder Agreement:** Tag-level agreement analysis with detailed metrics
- **Tag Diversity & Usage:** Comprehensive statistics on tag utilization

### Quality Metrics
- **Coding Completeness:** Percentage of expected category-video combinations coded
- **Tag Diversity Rate:** Percentage of available tags actually used
- **Average Tags per Video:** Measures coding density and thoroughness
- **Most/Least Used Tags:** Identifies popular and underutilized tags

---

## 📦 To-Do / Roadmap

### 🔄 Core Functionality
- [x] Export coded data to CSV or JSON format (backend endpoint exists, needs frontend UI)
- [x] Add option to remove or hide videos from the coding queue
- [X] Add visual indicator for coded vs. uncoded videos
- [x] Add coder progress overview (e.g., 35/120 completed)

### 🌐 Backend Integration
- [x] Set up backend using Flask API routes
- [x] Upload CSVs from the UI and store them on the server
- [x] Store and retrieve responses per coder from SQLite via Flask API
- [ ] Automatically detect and handle large datasets (pagination or lazy load)

### 🗃 Multi-Project Support
- [x] Create project-level abstraction to handle multiple datasets
- [x] Add project selection screen with metadata and progress
- [x] Store coding schemas and coders separately per project

### 🏠 UI Improvements
- [x] Add a homepage/dashboard with recent projects
- [X] Improve styling of tag selection and editing interface
- [x] Make embed and metadata layout responsive on smaller screens
- [x] Add visual indicator for coded vs. uncoded videos

### 👥 Coder Workflow
- [x] Allow coders to "complete" videos and filter by status
- [x] Assign videos to coders in round-robin or manual fashion
- [x] Add coder progress overview (e.g., 35/120 completed)

### 📈 Analysis & Reporting
- [x] Comprehensive results analysis with statistical insights
- [x] Cross-category tag correlations and co-occurrence analysis
- [x] Inter-coder agreement analysis with detailed metrics
- [x] Tag diversity and usage statistics
- [x] Export functionality for analysis results
- [x] Advanced filtering and search capabilities

---

## 🔧 Technical Notes

- **Frontend:** React.js with Bootstrap components
- **Backend:** Flask API with SQLite database
- **Data Storage:** SQLite database with project-based organization
- **Video Embedding:** TikTok embed URLs for video display
- **State Management:** React hooks with localStorage persistence

---

## 🐛 Known Issues

- Large datasets may cause performance issues (pagination needed)
- Mobile responsiveness needs improvement
- Some edge cases in tag parsing may need refinement

