import fs from 'fs/promises';
import path from 'path';

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

const normalizeForDb = (absolutePath) => {
  const relativePath = path.relative(process.cwd(), absolutePath);
  return relativePath.split(path.sep).join('/');
};

class LocalStorageAdapter {
  async save(file, userId) {
    if (!file?.path) {
      throw new Error('File path is required to save');
    }

    if (!userId) {
      throw new Error('User id is required to save file');
    }

    return normalizeForDb(file.path);
  }

  async delete(filePath) {
    if (!filePath) return;

    const resolvedPath = path.resolve(filePath);
    const normalizedRoot = `${UPLOADS_ROOT}${path.sep}`;

    if (resolvedPath !== UPLOADS_ROOT && !resolvedPath.startsWith(normalizedRoot)) {
      throw new Error('Refusing to delete file outside uploads directory');
    }

    try {
      await fs.unlink(resolvedPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getUrl(filePath) {
    if (!filePath) return null;

    const normalized = String(filePath).replace(/\\/g, '/');
    const relative = normalized.startsWith('uploads/') ? normalized.slice('uploads/'.length) : path.basename(normalized);
    return `/uploads/${relative}`;
  }
}

const storageService = new LocalStorageAdapter();

export { LocalStorageAdapter };
export default storageService;
