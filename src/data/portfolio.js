// Edit content here once. Every "world" renders this same object.
const base = import.meta.env.BASE_URL;
export const portfolio = {
  name: "Aghedo Promise",
  fullName: "Aghedo Oseiwe Promise",
  photo: `${base}photo.webp`,
  cv: `${base}cv.pdf`,
  email: "aghedopromise74@gmail.com",
  location: "Kebbi, Nigeria",
  availability: "Available for projects and hiring",
  roles: ["Full-stack software engineer", "React Native developer", "Technical instructor"],
  headline: "I build web and mobile products that hold up in the real world, and I teach people to do the same.",
  summary: [
    "Software engineer with over three years of experience shipping React, React Native and Node.js products, and training the developers who come after me.",
    "I founded King’s Code Academy, where I design the curriculum and teach. I also clean and map health data for field teams, and build offline-first apps for places where signal is not guaranteed.",
  ],
  metrics: [
    { value: "2", label: "Apps live on the App Store and Google Play" },
    { value: "4", label: "Student cohorts taught" },
    { value: "20+", label: "Websites and web services built" },
    { value: "3", label: "Health data organizations supported" },
  ],
  experience: [
    { role: "Founder and lead developer", org: "King’s Code Academy", when: "Aug 2025 – Present", points: ["Founded a coding academy teaching React.js, React Native, Node.js and Git.", "Designed and built the academy website and oversee curriculum for beginner and intermediate developers.", "Mentor junior developers and manage their project assignments."] },
    { role: "Web developer", org: "Motherboard (Remote)", when: "Dec 2024 – Present", points: ["Build and maintain client websites, including security patches and feature upgrades.", "Integrate REST APIs and third-party services with design and backend teams.", "Run performance tests and optimize front-end components for speed and accessibility."] },
    { role: "Web developer and instructor", org: "Neocloud Technologies, Abuja", when: "Jun 2024 – Dec 2024", points: ["Taught HTML, CSS, JavaScript, React and Node.js, and graduated four student cohorts.", "Gave one-on-one feedback so students could launch real projects.", "Led developers and designers using Agile, Asana, ClickUp and Slack."] },
    { role: "Freelance web and mobile developer", org: "Independent", when: "Jan 2023 – Present", points: ["Designed and built responsive websites for clients across industries.", "Expanded into React Native for small-business clients.", "Ran online workshops and coaching so clients could build their own products."] },
  ],
  work: [
    { title: "Hykers and Hyker Guide", summary: "Two mobile apps built and published to the Apple App Store and Google Play through Expo Application Services.", result: "Live on both stores, April 2026", tags: ["React Native", "Expo", "EAS"] },
    { title: "Field data for health teams", summary: "Cleaned and quality-checked TB and HIV/AIDS monitoring data at LAMIS Consult, mapped Noma field data for Médecins Sans Frontières, and verified demographics for CMDA’s Pad the Girl Child campaign.", result: "Three health organizations", tags: ["SPSS", "Stata", "GeoPandas", "QGIS"] },
    { title: "Enterprise web-to-mobile migration", summary: "Building the mobile interface for an established high-traffic web platform, under NDA, with brand consistency and touch-first performance.", result: "In progress, confidential", tags: ["React Native", "System integration"] },
    { title: "Offline-first and embedded builds", summary: "Apps that keep working without a signal using SQLite and MMKV, plus Arduino sensor loggers that write to SD cards.", result: "Works without connectivity", tags: ["SQLite", "MMKV", "Arduino"] },
    { title: "Wallet system with PayPal", summary: "A digital wallet with secure PayPal transactions, real-time payment tracking, authentication and balance updates.", result: "Full payment flow", tags: ["React", "Node.js", "PayPal API"] },
    { title: "Charity donation platform", summary: "A responsive donation site for a non-profit, with APIs for donations, accounts and content, deployed with HTTPS.", result: "Deployed to the cloud", tags: ["React", "Node.js", "MongoDB"] },
  ],
  stack: [
    ["Frontend and mobile", ["React.js", "React Native", "Expo", "Tailwind CSS", "Vite", "Framer Motion"]],
    ["Backend and APIs", ["Node.js", "Express.js", "Python", "REST APIs", "JWT auth"]],
    ["Data and storage", ["MongoDB", "PostgreSQL", "SQLite", "MMKV", "MySQL"]],
    ["Analytics and GIS", ["SPSS", "Stata", "GeoPandas", "QGIS"]],
    ["Shipping and design", ["Git", "Vercel", "EAS", "Figma", "Canva"]],
  ],
  education: { degree: "B.Tech, Information and Communication Technology", school: "Kebbi State University Aliero", when: "2019 – 2025" },
  courses: ["Software Development, CompTIA (2024)", "Product Management Fundamentals, University of Maryland (2024)", "React Native and Mobile App Development, Net Ninja (2025)"],
  posts: ["Building Seamless Authentication Routes in Node.js & Express", "Optimizing Background Location Tracking in React Native for Battery Efficiency"],
  social: [["LinkedIn", "https://linkedin.com/in/aghedopromise"], ["GitHub", "https://github.com/aghedopromise"], ["Dev.to", "https://dev.to/aghedopromise"]],

  intro: "Aghedo Promise is a full-stack software engineer, React Native developer and technical instructor in Kebbi, Nigeria. He is the founder of King\u2019s Code Academy and has more than three years of experience building web and mobile products.",
  services: [
    { title: "Full-stack web development", body: "React, Node.js, Express, MongoDB and PostgreSQL. Dashboards, payment flows, donation platforms and business sites." },
    { title: "Mobile apps with React Native", body: "Cross-platform iOS and Android apps built with Expo, offline-first where signal is unreliable, and published to both stores." },
    { title: "Training and curriculum", body: "Bootcamps, one-on-one mentoring and four-week syllabi for beginner and intermediate developers." },
    { title: "Health data cleaning and mapping", body: "Quality control and field mapping in SPSS, Stata, GeoPandas and QGIS for health programmes." },
  ],
  // Add a real `live` URL to any product to show a "Visit live" link.
  products: [
    { title: "Hykers and Hyker Guide", summary: "Two mobile apps built and published to the Apple App Store and Google Play through Expo Application Services.", tags: ["React Native", "Expo", "EAS"], result: "Live on both stores, April 2026", live: "" },
    { title: "King\u2019s Code Academy", summary: "A coding academy teaching React.js, React Native, Node.js and Git, with its own website, curriculum and student cohorts.", tags: ["Teaching", "React", "Brand"], result: "Four cohorts taught", live: "" },
  ],
  faq: [
    { q: "Who is Aghedo Promise?", a: "A full-stack software engineer, React Native developer and technical instructor based in Kebbi, Nigeria. He founded King\u2019s Code Academy in August 2025." },
    { q: "What does King\u2019s Code Academy do?", a: "It trains students in React.js, React Native, Node.js and Git through bootcamps, project work and a designed curriculum." },
    { q: "Does he work remotely?", a: "Yes. He is based in Kebbi and works with clients and teams remotely." },
    { q: "Which technologies does he use?", a: "React, React Native, Expo, Node.js, Express, MongoDB, PostgreSQL and Python, with SPSS, Stata and QGIS for data work." },
    { q: "Can he build and publish a mobile app?", a: "Yes. Hykers and Hyker Guide are live on the Apple App Store and Google Play, shipped through Expo Application Services." },
    { q: "Can he build apps that work offline?", a: "Yes. He uses SQLite and MMKV so apps keep working without a signal." },
    { q: "Is he available for freelance or full-time work?", a: "Yes. He is open to full-time roles, contract builds and teaching engagements." },
    { q: "How can I start a project?", a: "Send an email to aghedopromise74@gmail.com with a short description of what you need." },
  ],
};
