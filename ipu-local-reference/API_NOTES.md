# API inspection notes

## Observed public page routes

These are regular public website pages found while following links from the homepage. They are not asserted to be API endpoints.

- Homepage: `https://www.ipu.ac.in/`
- Notices / Circulars: `https://www.ipu.ac.in/notices.php`
- Student Welfare: `https://www.ipu.ac.in/dsw.php`
- Examination Department: `https://www.ipu.ac.in/examinationsmain.php`
- Examination Notices: `https://www.ipu.ac.in/exam_notices.php`
- Admissions 2026–27: `https://www.ipu.ac.in/adm2026/adm2026main.php`
- List of Programmes: `https://www.ipu.ac.in/all_programmes.php`

## What was visible in the public pages

- The homepage navigation is grouped into major university areas.
- The notices page visibly has a search input, a page-size selector and a paginated list of notice titles and upload dates.
- The Student Welfare and Examination areas have their own public pages.

## What is not known from this inspection

- Whether a given page makes XHR/fetch calls in a real browser session.
- The original website's server-side implementation and database.
- Any private API, internal endpoint, credential or authentication flow.

The local app deliberately uses `/api/...` routes that we control so you can understand the frontend/backend boundary before we design the real application backend.
