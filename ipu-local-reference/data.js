// Reference content based on publicly visible GGSIPU website sections.
// Notice categories are prototype labels for filtering, not official university classifications.

const sections = [
  {
    id: 'about',
    title: 'About University',
    items: [
      { label: 'About University', url: 'https://www.ipu.ac.in/' },
      { label: 'Acts, Statutes & Ordinances', url: 'https://www.ipu.ac.in/' },
      { label: 'Accreditation / Ranking / Approval', url: 'https://www.ipu.ac.in/' },
      { label: 'Affiliated Colleges', url: 'https://www.ipu.ac.in/' }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    items: [
      { label: 'Vice Chancellor', url: 'https://www.ipu.ac.in/' },
      { label: 'Registrar', url: 'https://www.ipu.ac.in/' },
      { label: 'Finance & Accounts', url: 'https://www.ipu.ac.in/' },
      { label: 'Offices / Officials', url: 'https://www.ipu.ac.in/' }
    ]
  },
  {
    id: 'academics',
    title: 'Academics',
    items: [
      { label: 'List of Programmes', url: 'https://www.ipu.ac.in/all_programmes.php' },
      { label: 'Academic Calendar', url: 'https://www.ipu.ac.in/' },
      { label: 'Schools / Centres', url: 'https://www.ipu.ac.in/' },
      { label: 'Scheme / Syllabus', url: 'https://www.ipu.ac.in/' }
    ]
  },
  {
    id: 'admissions',
    title: 'Admissions',
    items: [
      { label: 'Admission 2026-27', url: 'https://www.ipu.ac.in/adm2026/adm2026main.php' },
      { label: 'Admission Brochures', url: 'https://www.ipu.ac.in/adm2026/adm2026main.php' },
      { label: 'CET Notices', url: 'https://cet.ggsipu.ac.in/' },
      { label: 'Refund Status', url: 'https://www.ipu.ac.in/adm2026/adm2026main.php' }
    ]
  },
  {
    id: 'examinations',
    title: 'Examinations',
    items: [
      { label: 'Examination Department', url: 'https://www.ipu.ac.in/examinationsmain.php' },
      { label: 'Examination Notices', url: 'https://www.ipu.ac.in/exam_notices.php' },
      { label: 'Datesheets', url: 'https://www.ipu.ac.in/examinationsmain.php' },
      { label: 'Results Portal', url: 'https://examweb.ggsipu.ac.in/' }
    ]
  },
  {
    id: 'students',
    title: 'Students',
    items: [
      { label: 'Students Welfare', url: 'https://www.ipu.ac.in/dsw.php' },
      { label: 'Placement', url: 'https://www.ipu.ac.in/' },
      { label: 'Hostel Facilities', url: 'https://www.ipu.ac.in/' },
      { label: 'Student Grievance Committee', url: 'https://www.ipu.ac.in/' }
    ]
  },
  {
    id: 'information',
    title: 'Information Corner',
    items: [
      { label: 'Notices / Circulars', url: 'https://www.ipu.ac.in/notices.php' },
      { label: 'News & Events', url: 'https://www.ipu.ac.in/' },
      { label: 'Jobs & Opportunities', url: 'https://www.ipu.ac.in/' },
      { label: 'Contact Us', url: 'https://www.ipu.ac.in/' }
    ]
  }
];

const quickLinks = [
  { id: 'notices', title: 'Notices & Circulars', description: 'University-wide announcements and updates', icon: '▤', url: 'https://www.ipu.ac.in/notices.php', tone: 'blue' },
  { id: 'exams', title: 'Examination Department', description: 'Exam notices, datesheets and results links', icon: '▣', url: 'https://www.ipu.ac.in/examinationsmain.php', tone: 'violet' },
  { id: 'admissions', title: 'Admissions 2026–27', description: 'Admission information, brochures and counselling', icon: '↗', url: 'https://www.ipu.ac.in/adm2026/adm2026main.php', tone: 'orange' },
  { id: 'welfare', title: 'Students’ Welfare', description: 'Student welfare notices and opportunities', icon: '♡', url: 'https://www.ipu.ac.in/dsw.php', tone: 'green' },
  { id: 'academics', title: 'Programmes & Syllabus', description: 'Academic programmes and course information', icon: '⌘', url: 'https://www.ipu.ac.in/all_programmes.php', tone: 'teal' },
  { id: 'results', title: 'Exam Results Portal', description: 'Open the university examination results service', icon: '✓', url: 'https://examweb.ggsipu.ac.in/', tone: 'pink' }
];

const notices = [
  {
    id: 'sop-repair-2026-10-30',
    title: 'Approved SOPs and Schedule of Work containing Rates for specified repair & maintenance of furniture items at Dwarka Campus',
    date: '30 Oct 2026', category: 'Administration', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: true
  },
  {
    id: 'phd-oral-exam-2026-10-30',
    title: 'Oral Examination / Evaluation of Ph.D. thesis',
    date: '30 Oct 2026', category: 'Research', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: true
  },
  {
    id: 'phd-award-2026-10-30',
    title: 'Award of Doctor of Philosophy, Ms. Shailja Pandey & Mr. Anirban Ghosh',
    date: '30 Oct 2026', category: 'Research', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: true
  },
  {
    id: 'power-interruption-2026-10-30',
    title: 'Notice regarding a short period of interruption of power supply at Dwarka Campus on 30 October 2026',
    date: '30 Oct 2026', category: 'Campus', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: true
  },
  {
    id: 'ews-financial-assistance-2026-27',
    title: 'Inviting applications for financial assistance to students under the EWS Scheme for Academic Year 2026–27',
    date: '29 Oct 2026', category: 'Scholarships', source: 'Directorate of Students’ Welfare',
    url: 'https://www.ipu.ac.in/Pubinfo2027/nt2910261711.pdf', isNew: true
  },
  {
    id: 'guest-lecture-2026-10-29',
    title: 'Guest Lecture by Mr. Abhishek Bhargava, notable alumnus of USCT',
    date: '29 Oct 2026', category: 'Events', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: false
  },
  {
    id: 'tie-talks-2026-10-29',
    title: 'TiE Talks – Alumni Entrepreneurial Talk Series on 10 November 2026',
    date: '29 Oct 2026', category: 'Events', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: false
  },
  {
    id: 'mercy-chance-2026-10-29',
    title: 'Grant of Mercy Chance to students admitted under Ordinance 10, 11 and 25',
    date: '29 Oct 2026', category: 'Examinations', source: 'University Notice Board',
    url: 'https://www.ipu.ac.in/notices.php', isNew: false
  }
];

module.exports = { sections, quickLinks, notices };
