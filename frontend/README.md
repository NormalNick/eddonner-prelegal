# Mutual NDA Creator (frontend)

A Next.js prototype that generates a Common Paper Mutual Non-Disclosure Agreement
from a short web form. Tracks Jira [PL-3](https://normalnick.atlassian.net/browse/PL-3).

## What it does

- Live two-pane editor: form on the left, populated NDA on the right.
- "Download PDF" button uses the browser's print dialog (Save as PDF).
- The NDA template is the Common Paper Mutual NDA (Standard Terms + Cover Page),
  bundled in `lib/standard-terms.ts` and `lib/coverpage-template.ts`.

The source markdown templates live in the repo root at `../templates/`.

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Layout

```
app/
  layout.tsx            Root layout
  page.tsx              Form + preview composition
  globals.css           Tailwind + document/print styles
components/
  NdaForm.tsx           Controlled form
  NdaPreview.tsx        Markdown renderer
lib/
  nda-types.ts          Form data types
  nda-defaults.ts       Initial form values
  coverpage-template.ts Builds the cover page from form data
  standard-terms.ts     Standard Terms (constant)
  build-nda.ts          Composes cover page + standard terms
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, react-markdown +
remark-gfm. No backend.

## License

Templates are Common Paper, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
