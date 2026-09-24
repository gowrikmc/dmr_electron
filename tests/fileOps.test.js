const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { moveFile } = require('../fileOps');

test('moveFile removes the source folder when the last file is moved', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dmr-move-'));
  const sourceDir = path.join(tempRoot, 'source');
  const destDir = path.join(tempRoot, 'dest');
  const sourceFile = path.join(sourceDir, 'sample.txt');

  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(destDir, { recursive: true });
  await fs.writeFile(sourceFile, 'hello');

  try {
    const movedPath = await moveFile(sourceFile, destDir, 'sample.txt');

    assert.equal(movedPath, path.join(destDir, 'sample.txt'));
    await assert.rejects(fs.access(sourceDir), /ENOENT|no such file/i);
    await assert.doesNotReject(fs.access(path.join(destDir, 'sample.txt')));
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
