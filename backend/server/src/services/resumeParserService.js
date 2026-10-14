const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Comprehensive technical skill taxonomy for exact and fuzzy matching
const SKILL_TAXONOMY = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML5', 'HTML', 'CSS3', 'CSS', 'Bash', 'Shell', 'R', 'Dart', 'Scala',
  // Frontend
  'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte', 'Redux', 'Zustand', 'Tailwind CSS', 'Tailwind', 'Bootstrap', 'Material-UI', 'Sass', 'SCSS', 'Webpack', 'Vite',
  // Backend & APIs
  'Node.js', 'Node', 'Express', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Spring', 'Ruby on Rails', 'ASP.NET', 'GraphQL', 'REST API', 'RESTful APIs', 'gRPC', 'WebSockets', 'Microservices',
  // Databases & Caching
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra', 'Elasticsearch', 'DynamoDB', 'Supabase', 'Firebase', 'Prisma', 'TypeORM', 'Mongoose',
  // Cloud & DevOps
  'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s', 'Terraform', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'Linux', 'Nginx', 'Prometheus', 'Grafana', 'Serverless',
  // AI & Data Science
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'OpenCV', 'LangChain', 'LlamaIndex', 'Hugging Face', 'NLP', 'Computer Vision', 'RAG', 'Vector DB',
  // Tools & Testing
  'Git', 'GitHub', 'GitLab', 'Jira', 'Postman', 'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium', 'Docker Compose', 'Figma'
];

async function extractTextFromBuffer(buffer, mimetype, originalname) {
  const ext = originalname.toLowerCase().slice(originalname.lastIndexOf('.'));
  
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    ext === '.docx' ||
    ext === '.doc'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // Fallback to UTF-8 text
  return buffer.toString('utf-8');
}

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].trim() : '';
}

function extractPhone(text) {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0].trim() : '';
}

function extractLinks(text) {
  const links = {
    linkedin: '',
    github: '',
    portfolio: ''
  };

  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) links.linkedin = linkedinMatch[0];

  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) links.github = githubMatch[0];

  const urlMatches = text.match(/https?:\/\/[^\s/$.?#].[^\s]*/gi) || [];
  for (const url of urlMatches) {
    if (!url.includes('linkedin.com') && !url.includes('github.com') && !links.portfolio) {
      links.portfolio = url;
    }
  }

  return links;
}

function extractSkills(text) {
  const lowerText = ` ${text.toLowerCase().replace(/[^a-z0-9+#.-]/g, ' ')} `;
  const foundSkills = new Set();

  for (const skill of SKILL_TAXONOMY) {
    const regex = new RegExp(`(?:^|\\s)${escapeRegex(skill.toLowerCase())}(?:\\s|[,;.:/)]|$)`, 'i');
    if (regex.test(lowerText)) {
      foundSkills.add(canonicalSkillName(skill));
    }
  }

  return Array.from(foundSkills);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canonicalSkillName(skill) {
  const mapping = {
    'golang': 'Go',
    'node': 'Node.js',
    'express.js': 'Express',
    'react.js': 'React',
    'vue.js': 'Vue.js',
    'postgres': 'PostgreSQL',
    'k8s': 'Kubernetes',
    'amazon web services': 'AWS',
    'google cloud': 'GCP'
  };
  return mapping[skill.toLowerCase()] || skill;
}

function extractEducation(text) {
  const education = [];
  const lines = text.split(/\r?\n/);
  const degreeRegex = /(B\.?Tech|B\.?E\.?|B\.?S\.?|Bachelor|M\.?Tech|M\.?S\.?|Master|Ph\.?D|Associate|Diploma)/i;
  const yearRegex = /\b(19\d{2}|20\d{2})\b/;
  const gpaRegex = /(?:GPA|CGPA|percentage)[:\s]+([0-9.]+(?:\/[0-9.]+)?%?)/i;

  let inEduSection = false;
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(education|academic background|qualifications)/i.test(line)) {
      inEduSection = true;
      continue;
    }
    if (inEduSection && /^(experience|work experience|employment|projects|skills|certifications)/i.test(line)) {
      inEduSection = false;
      break;
    }

    if (inEduSection && line.length > 3) {
      buffer.push(line);
    }
  }

  if (buffer.length === 0) {
    // Scan entire document for degree mentions
    buffer = lines.filter(l => degreeRegex.test(l));
  }

  for (const item of buffer) {
    if (degreeRegex.test(item)) {
      const yearMatch = item.match(yearRegex);
      const gpaMatch = item.match(gpaRegex);
      education.push({
        degree: item.split(/[,|-]/)[0].trim(),
        institution: item.split(/[,|-]/)[1]?.trim() || 'University / College',
        graduationYear: yearMatch ? yearMatch[0] : '',
        gpa: gpaMatch ? gpaMatch[1] : ''
      });
    }
  }

  return education;
}

function extractExperience(text) {
  const experience = [];
  const lines = text.split(/\r?\n/);
  const dateRangeRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{4}|\d{4})\s*[-–to]+\s*(?:Present|Current|Now|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  
  let inExpSection = false;
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^(experience|work experience|employment history|work history|professional experience)/i.test(line)) {
      inExpSection = true;
      continue;
    }
    if (inExpSection && /^(education|projects|skills|certifications|awards|publications)/i.test(line)) {
      inExpSection = false;
      if (currentEntry) experience.push(currentEntry);
      break;
    }

    if (inExpSection) {
      if (dateRangeRegex.test(line)) {
        if (currentEntry) experience.push(currentEntry);
        const parts = line.split(/[-–]/);
        currentEntry = {
          title: line.replace(dateRangeRegex, '').trim() || 'Software Engineer',
          company: '',
          dateRange: line.match(dateRangeRegex)[0],
          description: ''
        };
      } else if (currentEntry) {
        if (!currentEntry.company && line.length < 50 && !line.startsWith('•') && !line.startsWith('-')) {
          currentEntry.company = line;
        } else {
          currentEntry.description += (currentEntry.description ? '\n' : '') + line;
        }
      }
    }
  }

  if (currentEntry) experience.push(currentEntry);
  return experience;
}

function extractProjects(text) {
  const projects = [];
  const lines = text.split(/\r?\n/);
  let inProjectSection = false;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^(projects|technical projects|key projects|academic projects)/i.test(line)) {
      inProjectSection = true;
      continue;
    }
    if (inProjectSection && /^(education|experience|skills|certifications|achievements)/i.test(line)) {
      inProjectSection = false;
      if (currentProject) projects.push(currentProject);
      break;
    }

    if (inProjectSection) {
      if ((line.startsWith('#') || /^[A-Z0-9\s-]{3,35}$/.test(line) || line.includes('|')) && !line.startsWith('•') && !line.startsWith('-')) {
        if (currentProject) projects.push(currentProject);
        currentProject = {
          title: line.replace(/^[#*-]\s*/, '').trim(),
          description: '',
          techStack: []
        };
      } else if (currentProject) {
        currentProject.description += (currentProject.description ? ' ' : '') + line;
      }
    }
  }
  if (currentProject) projects.push(currentProject);

  // Extract tech stack for projects
  for (const proj of projects) {
    proj.techStack = extractSkills(proj.title + ' ' + proj.description).slice(0, 6);
  }

  return projects;
}

function extractCertifications(text) {
  const certs = [];
  const certKeywords = ['Certified', 'Certification', 'AWS', 'GCP', 'Azure', 'CKA', 'Coursera', 'Meta', 'Professional', 'Specialization'];
  const lines = text.split(/\r?\n/);

  let inCertSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(certifications|licenses & certifications|credentials)/i.test(trimmed)) {
      inCertSection = true;
      continue;
    }
    if (inCertSection && /^(education|experience|projects|skills)/i.test(trimmed)) {
      inCertSection = false;
      break;
    }
    if (inCertSection && trimmed.length > 4) {
      certs.push({
        name: trimmed.replace(/^[-•*]\s*/, ''),
        issuer: certKeywords.find(k => trimmed.includes(k)) || 'Verified Credential'
      });
    }
  }

  return certs;
}

async function parseResume(buffer, mimetype, originalname) {
  const rawText = await extractTextFromBuffer(buffer, mimetype, originalname);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const links = extractLinks(rawText);
  const skills = extractSkills(rawText);
  const education = extractEducation(rawText);
  const experience = extractExperience(rawText);
  const projects = extractProjects(rawText);
  const certifications = extractCertifications(rawText);

  // Estimate experience in years
  let estimatedYears = 0;
  if (experience.length > 0) {
    estimatedYears = Math.min(15, Math.max(1, experience.length * 1.5));
  }

  return {
    rawText,
    parsed: {
      email,
      phone,
      links,
      skills,
      education,
      experience,
      projects,
      certifications,
      estimatedYears
    }
  };
}

module.exports = {
  parseResume,
  extractSkills
};
