import type { SavedTask } from '../types';
import { storageKey } from './storageMode';
import { pushTask, TASKS_KEY } from '../services/accountData';
// Invitado: guarda en localStorage como siempre. Con cuenta: guarda en la copia local y además envía la gestión a la base.
const key = () => storageKey(TASKS_KEY);
export function getSavedTasks(): SavedTask[] {
  try { return JSON.parse(localStorage.getItem(key()) || '[]') as SavedTask[]; } catch { return []; }
}
export function saveTask(task: SavedTask) {
  const tasks = [task, ...getSavedTasks()].slice(0, 50);
  localStorage.setItem(key(), JSON.stringify(tasks));
  pushTask(task);
  return tasks;
}
export function clearSavedTasks() { localStorage.removeItem(key()); }
