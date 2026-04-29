/**
 * Template registry: slug -> { displayName, description, supported, ... }.
 * Supported templates carry per-template defaults / build / applyPatch /
 * greeting; unsupported entries appear on the picker as "coming soon" and
 * route through the backend's suggest short-circuit when clicked.
 *
 * The slug list (and unsupported entries) is the source of truth for the
 * picker grid; `catalog.json` describes the underlying Common Paper docs
 * but isn't imported at runtime — keeping the registry self-contained
 * lets supported / unsupported state and TS types coexist cleanly.
 */

import { applyPatch as applyAiAddendumPatch } from "./ai-addendum/applyPatch";
import { buildFullAiAddendum } from "./ai-addendum/builder";
import { createDefaultAiAddendumData } from "./ai-addendum/defaults";
import type {
  AiAddendumFieldsPatch,
  AiAddendumFormData,
} from "./ai-addendum/types";
import { applyPatch as applyNdaPatch } from "./mutual-nda/applyPatch";
import { buildFullNda } from "./mutual-nda/builder";
import { createDefaultFormData as createDefaultNdaData } from "./mutual-nda/defaults";
import type { NdaFieldsPatch, NdaFormData } from "./mutual-nda/types";

export type TemplateFormData = Record<string, unknown>;
export type TemplateFieldsPatch = Record<string, unknown>;

export interface SupportedTemplate {
  slug: string;
  displayName: string;
  description: string;
  supported: true;
  createDefaults: () => TemplateFormData;
  buildDocument: (data: TemplateFormData) => string;
  applyPatch: (
    current: TemplateFormData,
    patch: TemplateFieldsPatch,
  ) => TemplateFormData;
  greeting: string;
  inputPlaceholder: string;
}

export interface UnsupportedTemplate {
  slug: string;
  displayName: string;
  description: string;
  supported: false;
}

export type TemplateConfig = SupportedTemplate | UnsupportedTemplate;

/**
 * Helper that wires per-template typed callbacks into the erased
 * `TemplateFormData` shape the registry exposes. The casts are
 * concentrated here instead of repeated at every entry, so a wrong
 * type pairing (e.g. NDA defaults paired with AI Addendum builder)
 * fails to compile inside this helper rather than silently passing.
 */
function makeSupported<T extends object, P extends object>(args: {
  slug: string;
  displayName: string;
  description: string;
  greeting: string;
  inputPlaceholder: string;
  createDefaults: () => T;
  buildDocument: (data: T) => string;
  applyPatch: (current: T, patch: P) => T;
}): SupportedTemplate {
  return {
    slug: args.slug,
    displayName: args.displayName,
    description: args.description,
    greeting: args.greeting,
    inputPlaceholder: args.inputPlaceholder,
    supported: true,
    createDefaults: () => args.createDefaults() as TemplateFormData,
    buildDocument: (data) => args.buildDocument(data as unknown as T),
    applyPatch: (current, patch) =>
      args.applyPatch(current as unknown as T, patch as unknown as P) as TemplateFormData,
  };
}

const REGISTRY: TemplateConfig[] = [
  makeSupported<NdaFormData, NdaFieldsPatch>({
    slug: "mutual-nda",
    displayName: "Mutual NDA",
    description:
      "Common Paper Mutual Non-Disclosure Agreement. Two parties evaluating a relationship.",
    greeting:
      "Hi! I'll help you draft a Mutual NDA. To start, what's the purpose of the agreement — what are the two parties planning to share or evaluate?",
    inputPlaceholder: "Tell the assistant about your NDA…",
    createDefaults: createDefaultNdaData,
    buildDocument: buildFullNda,
    applyPatch: applyNdaPatch,
  }),
  makeSupported<AiAddendumFormData, AiAddendumFieldsPatch>({
    slug: "ai-addendum",
    displayName: "AI Addendum",
    description:
      "Common Paper AI Addendum. Layers AI-specific obligations onto an existing agreement.",
    greeting:
      "Hi! I'll help you draft an AI Addendum. To start, which existing agreement is this addendum supplementing (e.g. a CSA, PSA, or Software License)?",
    inputPlaceholder: "Tell the assistant about your AI Addendum…",
    createDefaults: createDefaultAiAddendumData,
    buildDocument: buildFullAiAddendum,
    applyPatch: applyAiAddendumPatch,
  }),
  {
    slug: "csa",
    displayName: "Cloud Service Agreement",
    description: "For vendors offering cloud-based services.",
    supported: false,
  },
  {
    slug: "design-partner-agreement",
    displayName: "Design Partner Agreement",
    description:
      "For early-stage product development collaborations between a vendor and a design partner.",
    supported: false,
  },
  {
    slug: "sla",
    displayName: "Service Level Agreement",
    description:
      "Uptime commitments, support response times, and service credits.",
    supported: false,
  },
  {
    slug: "psa",
    displayName: "Professional Services Agreement",
    description:
      "Consulting, implementation, and other professional services engagements.",
    supported: false,
  },
  {
    slug: "dpa",
    displayName: "Data Processing Agreement",
    description:
      "GDPR- and CCPA-aligned personal data handling between controllers and processors.",
    supported: false,
  },
  {
    slug: "software-license-agreement",
    displayName: "Software License Agreement",
    description: "On-premise or self-hosted software licensing.",
    supported: false,
  },
  {
    slug: "partnership-agreement",
    displayName: "Partnership Agreement",
    description: "Go-to-market, reseller, and channel partnerships.",
    supported: false,
  },
  {
    slug: "pilot-agreement",
    displayName: "Pilot Agreement",
    description:
      "Time-bound proof-of-concept evaluations of a product or service.",
    supported: false,
  },
  {
    slug: "baa",
    displayName: "Business Associate Agreement",
    description:
      "HIPAA-covered relationships involving protected health information.",
    supported: false,
  },
];

export const TEMPLATES: readonly TemplateConfig[] = REGISTRY;

export function getTemplate(slug: string): TemplateConfig | undefined {
  return REGISTRY.find((t) => t.slug === slug);
}
