import fs from 'fs';
import path from 'path';
import { isValidProjectId } from '../config.js';

/**
 * File-backed project records: storage/projects/<id>/project.json
 * Keeps project metadata across restarts using the same folder that already holds each project's files,
 * so no database is required. Paths are resolved at call time (tests and containers may change cwd).
 */
export const projectsRoot = () => path.join(process.cwd(), 'storage', 'projects');

function recordPath(id) {
  return path.join(projectsRoot(), id, 'project.json');
}

export const ProjectStore = {
  save(project) {
    if (!isValidProjectId(project?.id)) throw new Error('Invalid project id.');
    const file = recordPath(project.id);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Write to a temp file then rename so a crash never leaves a half-written record
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(project, null, 2));
    fs.renameSync(tmp, file);
    return project;
  },

  get(id) {
    if (!isValidProjectId(id)) return null;
    try {
      return JSON.parse(fs.readFileSync(recordPath(id), 'utf8'));
    } catch {
      return null;
    }
  },

  /** Merge changes into an existing record. Returns null when the project does not exist. */
  update(id, updates) {
    const current = this.get(id);
    if (!current) return null;
    return this.save({ ...current, ...updates, id, updated_at: new Date().toISOString() });
  },

  list() {
    const root = projectsRoot();
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter(d => d.isDirectory() && isValidProjectId(d.name))
      .map(d => this.get(d.name))
      .filter(Boolean)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  },

  /** Remove the project's own folder (never anything outside storage/projects/<id>). */
  remove(id) {
    if (!isValidProjectId(id)) return false;
    const root = path.resolve(projectsRoot());
    const dir = path.resolve(root, id);
    if (path.dirname(dir) !== root || !fs.existsSync(dir)) return false;
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }
};

/** Ids reserved for the bundled sample projects; user uploads must never write under these. */
export const RESERVED_PROJECT_IDS = new Set(['demo-proj-001', 'demo-proj-002', 'demo-proj-003']);
export const isReservedProjectId = id => RESERVED_PROJECT_IDS.has(id) || /^demo-/.test(id);
