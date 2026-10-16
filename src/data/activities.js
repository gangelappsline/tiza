import { Calculator, FlaskConical, Landmark, Languages, LayoutGrid, Palette } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: LayoutGrid },
  { id: 'math', label: 'Matemáticas', icon: Calculator },
  { id: 'language', label: 'Lenguaje', icon: Languages },
  { id: 'science', label: 'Ciencias', icon: FlaskConical },
  { id: 'art', label: 'Arte', icon: Palette },
  { id: 'history', label: 'Historia', icon: Landmark },
];

export const DIFFICULTIES = {
  EASY: { label: 'Fácil', className: 'bg-emerald-100 text-emerald-700' },
  MEDIUM: { label: 'Medio', className: 'bg-amber-100 text-amber-800' },
  HARD: { label: 'Difícil', className: 'bg-rose-100 text-rose-700' },
};

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Destacadas' },
  { id: 'popular', label: 'Populares' },
  { id: 'newest', label: 'Más Recientes' },
];

/** Imagen de Unsplash (formato automático WebP/AVIF y tamaño adaptado). */
export function unsplashUrl(photoId, width = 600) {
  const height = Math.round((width * 2) / 3);
  return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=70`;
}

/**
 * Catálogo de la Biblioteca Pública.
 * - `link`: si existe, la actividad es jugable; si no, se muestra como "Próximamente".
 * - `featured`, `popularity` y `addedAt` solo se usan para ordenar las pestañas
 *   (pueden reemplazarse por datos reales de la API más adelante).
 */
export const ACTIVITIES = [
  {
    id: 'vocales-memory',
    emoji: '🎮',
    title: 'Memoria de Vocales',
    description:
      'Encuentra las parejas de vocales y sus imágenes en este divertido juego de memoria. ¡Perfecto para aprender las vocales!',
    photo: 'photo-1606326608606-aa0b62935f2b',
    difficulty: 'EASY',
    duration: 5,
    category: 'language',
    type: 'activity',
    link: '/actividad/memorama',
    keywords: ['vocales', 'memorama', 'memoria', 'lectura', 'preescolar'],
    featured: 1,
    popularity: 98,
    addedAt: '2026-01-12',
  },
  {
    id: 'matematicas-practica',
    emoji: '🧮',
    title: 'Práctica de Matemáticas',
    description:
      'Mejora tus habilidades con sumas, restas, multiplicaciones y divisiones. Elige tu nivel y practica con operaciones aleatorias.',
    photo: 'photo-1509228627152-72ae9ae6848d',
    difficulty: 'MEDIUM',
    duration: 15,
    category: 'math',
    type: 'activity',
    link: '/actividad/matematicas',
    keywords: ['sumas', 'restas', 'multiplicacion', 'division', 'operaciones', 'calculo'],
    featured: 2,
    popularity: 95,
    addedAt: '2026-01-19',
  },
  {
    id: 'ordenar-oraciones',
    emoji: '📝',
    title: 'Ordenar Oraciones',
    description:
      'Arrastra las palabras para formar oraciones correctas. Practica tu comprensión del español con ejercicios interactivos.',
    photo: 'photo-1455390582262-044cdead277a',
    difficulty: 'EASY',
    duration: 10,
    category: 'language',
    type: 'activity',
    link: '/actividad/ordenar-oraciones',
    keywords: ['español', 'oraciones', 'palabras', 'lectura', 'escritura', 'gramatica'],
    featured: 3,
    popularity: 90,
    addedAt: '2026-01-26',
  },
  {
    id: 'nave-espacial',
    emoji: '🚀',
    title: 'Batalla Espacial Matemática',
    description:
      'Pilota tu nave, dispara a los asteroides con números y suma exactamente la vida de la nave enemiga para derrotarla.',
    photo: 'photo-1446776811953-b23d57bd21aa',
    difficulty: 'MEDIUM',
    duration: 10,
    category: 'math',
    type: 'game',
    link: '/juegos/nave',
    keywords: ['juego', 'nave', 'espacio', 'sumas', 'asteroides', 'calculo mental'],
    featured: 4,
    popularity: 97,
    addedAt: '2026-02-02',
  },
  {
    id: 'mascota-ia',
    emoji: '🐶',
    title: 'Mascota Virtual',
    description:
      'Adopta una mascota, aliméntala y cuídala. ¡Hazla crecer resolviendo operaciones para que suba de nivel!',
    photo: 'photo-1543466835-00a7907e9de1',
    difficulty: 'EASY',
    duration: 10,
    category: 'math',
    type: 'game',
    link: '/juegos/tamagochi',
    keywords: ['juego', 'tamagochi', 'mascota', 'perro', 'gato', 'sumas', 'restas'],
    featured: 5,
    popularity: 93,
    addedAt: '2026-02-09',
  },
  {
    id: 'algebra-espacial',
    emoji: '🪐',
    title: 'Misión Espacial Álgebra: Ecuaciones Lineales',
    description:
      'Ayuda al Capitán X a encontrar las coordenadas perdidas en la nebulosa resolviendo ecuaciones lineales.',
    photo: 'photo-1614730321146-b6fa6a46bcb4',
    difficulty: 'MEDIUM',
    duration: 15,
    category: 'math',
    type: 'activity',
    keywords: ['algebra', 'ecuaciones', 'espacio'],
    featured: 6,
    popularity: 72,
    addedAt: '2025-11-03',
  },
  {
    id: 'laboratorio-quimica',
    emoji: '⚗️',
    title: 'Laboratorio de Reacciones Químicas',
    description:
      'Mezcla elementos volátiles virtualmente para descubrir nuevos compuestos y desbloquear el Sanctum Periódico.',
    photo: 'photo-1532187863486-abf9dbad1b69',
    difficulty: 'HARD',
    duration: 25,
    category: 'science',
    type: 'activity',
    keywords: ['quimica', 'ciencias', 'tabla periodica', 'experimentos'],
    featured: 7,
    popularity: 80,
    addedAt: '2025-10-20',
  },
  {
    id: 'geometria-dash',
    emoji: '📐',
    title: 'Geometría Dash Pro',
    description: 'Domina polígonos complejos y formas 3D para navegar a través del Laberinto del Maestro.',
    photo: 'photo-1635070041078-e363dbe005cb',
    difficulty: 'HARD',
    duration: 12,
    category: 'math',
    type: 'activity',
    keywords: ['geometria', 'poligonos', 'figuras', '3d'],
    featured: 8,
    popularity: 76,
    addedAt: '2025-10-06',
  },
  {
    id: 'galaxia-gramatical',
    emoji: '🌌',
    title: 'Galaxia Gramatical',
    description:
      'Defiende el Planeta Sintaxis de los Piratas Puntuación en este desafío lingüístico de alta velocidad.',
    photo: 'photo-1543722530-d2c3201371e7',
    difficulty: 'EASY',
    duration: 10,
    category: 'language',
    type: 'activity',
    keywords: ['gramatica', 'puntuacion', 'sintaxis', 'español'],
    featured: 9,
    popularity: 84,
    addedAt: '2025-11-17',
  },
  {
    id: 'linea-temporal',
    emoji: '⏳',
    title: 'Búsqueda de la Línea Temporal Histórica',
    description:
      'Viaja a través del Renacimiento para encontrar invenciones perdidas antes de que se acabe el tiempo.',
    photo: 'photo-1524995997946-a1c2e315a42f',
    difficulty: 'MEDIUM',
    duration: 20,
    category: 'history',
    type: 'activity',
    keywords: ['historia', 'renacimiento', 'inventos', 'linea del tiempo'],
    featured: 10,
    popularity: 68,
    addedAt: '2025-09-22',
  },
  {
    id: 'viaje-vocabulario',
    emoji: '🏝️',
    title: 'Viaje de Vocabulario',
    description: 'Zarpa hacia la Isla Sinónimo y recolecta palabras raras para tu cofre del tesoro lingüístico.',
    photo: 'photo-1544551763-46a013bb70d5',
    difficulty: 'EASY',
    duration: 8,
    category: 'language',
    type: 'activity',
    keywords: ['vocabulario', 'sinonimos', 'palabras', 'español'],
    featured: 11,
    popularity: 74,
    addedAt: '2025-12-01',
  },
];

export const PAGE_SIZE = 6;
