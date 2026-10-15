import type { CollectionEntry } from 'astro:content';

// Normalize display labels without rewriting the imported article metadata.
const labels: Record<string, string> = {
  java: 'Java', javascript: 'JavaScript', typescript: 'TypeScript',
  vue: 'Vue', vue3: 'Vue', 'vue.js': 'Vue', react: 'React',
  docker: 'Docker', git: 'Git', database: 'Database', oracle: 'Oracle',
  numpy: 'NumPy', plotly: 'Plotly', polotly: 'Plotly', thymeleaf: 'Thymeleaf',
};
export function postTopics(post: CollectionEntry<'posts'>): string[] {
  const original = [...post.data.category.split(/\s*\/\s*/), ...post.data.tags];
  return [...new Set(original.map(tag => labels[tag.toLowerCase()] || tag))];
}
