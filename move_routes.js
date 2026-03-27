const fs = require('fs');
const path = require('path');

const pageOld = path.join(__dirname, 'app', 'page.tsx');
const pageNew = path.join(__dirname, 'app', '(main)', 'page.tsx');
const projectsOld = path.join(__dirname, 'app', 'projects');
const projectsNew = path.join(__dirname, 'app', '(main)', 'projects');

try {
  if (fs.existsSync(pageOld)) {
    fs.renameSync(pageOld, pageNew);
    console.log("Moved page.tsx successfully.");
  }
} catch(e) { console.error(e); }

try {
  if (fs.existsSync(projectsOld)) {
    fs.renameSync(projectsOld, projectsNew);
    console.log("Moved projects folder successfully.");
  }
} catch(e) { console.error(e); }
