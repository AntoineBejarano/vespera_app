import { z } from "zod";

export const seoGeneratedSectionSchema = z.object({
  heading: z.string().min(8).max(90),
  body: z.string().min(120).max(900),
});

export const seoGeneratedFaqSchema = z.object({
  q: z.string().min(12).max(120),
  a: z.string().min(80).max(500),
});

export const seoGeneratedContentSchema = z.object({
  title: z.string().min(30).max(68),
  h1: z.string().min(20).max(86),
  metaDescription: z.string().min(120).max(165),
  summary: z.string().min(120).max(360),
  intro: z.string().min(160).max(650),
  sections: z.array(seoGeneratedSectionSchema).min(3).max(5),
  platformFit: z.array(z.string().min(30).max(180)).min(4).max(7),
  sampleWorkflow: z.array(z.string().min(30).max(180)).min(4).max(7),
  promptExample: z.string().min(80).max(500),
  faqs: z.array(seoGeneratedFaqSchema).min(3).max(5),
  ctaLabel: z.string().min(8).max(50),
});

export type SeoGeneratedContent = z.infer<typeof seoGeneratedContentSchema>;

export const seoGeneratedReviewSchema = z.object({
  score: z.number().int().min(0).max(100),
  publishable: z.boolean(),
  reasons: z.array(z.string().min(8).max(180)).min(2).max(8),
});

export type SeoGeneratedReview = z.infer<typeof seoGeneratedReviewSchema>;

export type SeoGenerationTopic = {
  slug: string;
  fingerprint: string;
  category: string;
  audience: string;
  useCase: string;
  intent: string;
  channel: string;
  productAngle: string;
};
