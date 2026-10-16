import { CATEGORIES } from '../data/activities';
import { normalizeText } from './utils';

const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? '';

function matchesQuery(activity, terms) {
  if (!terms.length) return true;
  const haystack = normalizeText(
    [activity.title, activity.description, categoryLabel(activity.category), ...(activity.keywords ?? [])].join(' '),
  );
  return terms.every((term) => haystack.includes(term));
}

function toTerms(query) {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

/** Filtra por categoría y texto (sin distinguir mayúsculas ni acentos). */
export function filterActivities(activities, { category = 'all', query = '' } = {}) {
  const terms = toTerms(query);
  return activities.filter(
    (activity) => (category === 'all' || activity.category === category) && matchesQuery(activity, terms),
  );
}

export function sortActivities(activities, sort = 'featured') {
  const list = [...activities];
  switch (sort) {
    case 'popular':
      return list.sort((a, b) => b.popularity - a.popularity);
    case 'newest':
      return list.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    default:
      return list.sort((a, b) => a.featured - b.featured);
  }
}

/** Número de resultados por categoría para la búsqueda actual. */
export function countByCategory(activities, query = '') {
  const terms = toTerms(query);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  for (const activity of activities) {
    if (!matchesQuery(activity, terms)) continue;
    counts.all += 1;
    counts[activity.category] = (counts[activity.category] ?? 0) + 1;
  }
  return counts;
}
