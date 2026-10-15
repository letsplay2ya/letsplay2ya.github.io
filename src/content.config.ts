import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(), description: z.string(), category: z.string(),
    tags: z.array(z.string()).default([]), role: z.string(),
    status: z.enum(['case-study', 'experiment']).default('case-study'),
    featured: z.boolean().default(false), order: z.number().default(100),
    year: z.string().optional(), highlights: z.array(z.string()).default([]),
    accent: z.string().optional(), draft: z.boolean().default(false),
  }),
});
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]), category: z.string().default('기록'),
    origin: z.enum(['hexo', 'project', 'original']).default('original'),
    project: z.string().optional(), legacyUrl: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
export const collections = { projects, posts };
