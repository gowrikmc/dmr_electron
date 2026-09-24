// fileOps.js
const fs = require('fs/promises');
const path = require('path');

async function moveFile(sourcePath, destFolder,filename) {
//   const fileName = path.basename(sourcePath);
  let destPath = path.join(destFolder, filename);

//   // avoid overwriting if a file with same name exists
//   destPath = await getUniqueDestPath(destPath);
  await fs.mkdir(destFolder, { recursive: true });

  try {
    await fs.rename(sourcePath, destPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      // different drive/volume - rename won't work, fallback to copy+delete
      await fs.copyFile(sourcePath, destPath);
      await fs.unlink(sourcePath);
    } else {
      throw err;
    }
  }

  const sourceDir = path.dirname(sourcePath);
  try {
    const remainingEntries = await fs.readdir(sourceDir);
    if (remainingEntries.length === 0) {
      await fs.rmdir(sourceDir);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Unable to remove empty source folder ${sourceDir}:`, err.message);
    }
  }

  return destPath;
}

async function getUniqueDestPath(destPath) {
  let finalPath = destPath;
  let counter = 1;
  const dir = path.dirname(destPath);
  const ext = path.extname(destPath);
  const base = path.basename(destPath, ext);

  while (await fileExists(finalPath)) {
    finalPath = path.join(dir, `${base} (${counter})${ext}`);
    counter++;
  }
  return finalPath;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

module.exports = { moveFile };