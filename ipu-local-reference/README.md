# GGSIPU — Local Reference Replica

This is a small, locally runnable reconstruction of the public-facing GGSIPU homepage structure. It is intended for learning, inspection and redesign planning. It is **not the extracted original source code**, is **not affiliated with GGSIPU**, and does not connect to university systems.

## What is included

- A responsive homepage inspired by the information architecture visible on `https://www.ipu.ac.in/`.
- Navigation groups based on the public sections: About University, Administration, Academics, Admissions, Examinations, Research, Students and Information Corner.
- Quick links to official pages where the destination could be verified.
- A sample notice list based on notices visible on the official notice board on 30 October 2026.
- Search and category filtering for the local sample notices.
- A small Node.js server using only built-in modules (no `npm install` required).
- Local JSON API endpoints so you can see how the frontend requests data from a backend.

## Run on localhost

1. Install Node.js (Node 18 or newer is recommended).
2. Extract this folder.
3. Open a terminal inside `ipu-local-reference`.
4. Run:

   ```bash
   node server.js
   ```

5. Open `http://localhost:3000` in your browser.

Stop the server with `Ctrl + C`.

## Local API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Confirms the local server is running |
| GET | `/api/site-sections` | Returns homepage navigation groups |
| GET | `/api/quick-links` | Returns quick-access cards |
| GET | `/api/notices` | Returns sample notices |
| GET | `/api/notices?q=EWS` | Searches sample notices |
| GET | `/api/notices?category=scholarships` | Filters by prototype category |
| GET | `/api/notices/ews-financial-assistance-2026-27` | Returns one notice by ID |

Example:

```bash
curl http://localhost:3000/api/notices
```

## Project structure

```text
ipu-local-reference/
├── data.js              # Sample data returned by the local API
├── server.js            # Node HTTP server and local API routes
├── README.md
└── public/
    ├── index.html       # Page structure
    ├── styles.css       # Styling and responsive layout
    └── app.js           # Fetches local APIs and renders the page
```

## Important: original backend and API calls

A browser-visible website does not expose the server-side source code, database schema, admin tools, private credentials or internal business logic. Those cannot be recovered just from the public URL.

The routes under `/api/...` in this project are **our own mock API endpoints**. They are not GGSIPU endpoints. The links such as `/notices.php`, `/dsw.php` and `/exam_notices.php` are public web pages, not evidence of JSON APIs.

To identify actual browser requests accurately, open the official site in Chrome, open DevTools → Network → Fetch/XHR, enable Preserve log, reload, and interact with the page. Record only request names, methods, public URLs and non-sensitive response structure. Do not share cookies, Authorization headers, bearer tokens, personal data or private session information. A HAR export can contain all of those, so inspect and redact it before sharing.

## Data and accuracy notes

- The sample notices are based on titles and dates visible on the official public notice list on 30 October 2026.
- Categories such as `Research`, `Campus` and `Scholarships` are convenience labels added for this prototype. They are not claimed to be GGSIPU's official classification system.
- Most sample notice cards link to the official notices listing because their individual PDF destinations were not verified. The EWS notice links to the public PDF that was opened during research.
- This prototype does not fetch fresh notices automatically.
- The original official website remains the source of truth for deadlines, eligibility and documents.

## Where to look first

- `public/index.html`: page sections and layout.
- `public/styles.css`: colours, spacing and responsive design.
- `public/app.js`: frontend `fetch()` calls to the local API.
- `server.js`: backend routes and static file serving.
- `data.js`: sample content returned by those routes.

A useful next step is to compare the visible page with the official site and then decide which parts to retain, simplify or replace in the personalised MyIPU redesign.
