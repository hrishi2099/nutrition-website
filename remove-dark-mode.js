const fs = require('fs');
const path = require('path');

// Define the patterns to remove dark mode classes
const darkModePatterns = [
  /\s*dark:[a-zA-Z0-9\-:]*\s*/g,
  /\s*dark:hover:[a-zA-Z0-9\-:]*\s*/g,
  /\s*dark:focus:[a-zA-Z0-9\-:]*\s*/g,
  /\s*dark:bg-[a-zA-Z0-9\-]*\s*/g,
  /\s*dark:text-[a-zA-Z0-9\-]*\s*/g,
  /\s*dark:border-[a-zA-Z0-9\-]*\s*/g,
];

function removeDarkModeClasses(content) {
  let updatedContent = content;

  // Remove all dark mode classes
  darkModePatterns.forEach(pattern => {
    updatedContent = updatedContent.replace(pattern, ' ');
  });

  // Clean up extra spaces in className attributes
  updatedContent = updatedContent.replace(/className="([^"]*)"/g, (match, classes) => {
    const cleanedClasses = classes.replace(/\s+/g, ' ').trim();
    return `className="${cleanedClasses}"`;
  });

  return updatedContent;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = removeDarkModeClasses(content);

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      processFile(fullPath);
    }
  });
}

// Start processing from src directory
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  processDirectory(srcPath);
  console.log('Dark mode removal completed!');
} else {
  console.error('src directory not found');
}