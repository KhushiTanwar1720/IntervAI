const multer = require('multer');

// Memory storage keeps file buffer in memory for instant parsing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const hasValidExt = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

  if (allowedMimes.includes(file.mimetype) || hasValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload a PDF, DOCX, DOC, or TXT resume.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter
});

module.exports = upload;
