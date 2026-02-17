Language Practice App
======================

Overview
--------

This is a web app that helps language learners to intensively practice vocabulary and grammar.
It holds a collection of words, and a collection of question types.  Each question type can be used with one or more randomly selected words to generate a question for the user to answer.  
The generated questions and the user's response are stored in another collection to inform future selection of words and questions, so that the learner can concentrate on the areas that need most practice.

Technical choices
-----------------

- Typescript
- React
- Vite (SPA)
- React Router (library mode)
- Tailwind CSS
- Cloudflare Kumo component library (styled components)
- Convex backend service

Notes
-----

- For deployment, the static host must rewrite all paths to `index.html` in order to allow SPA routing to work.
- A generic rewrite rule is included at `public/_redirects` (works on hosts that support Netlify-style redirects, including Cloudflare Pages).

Development
-----------

Prerequisites:
- Node.js + npm

Install:

```
npm install
```

Run:

```
npm run dev
```

Scripts:
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run typecheck`

Convex setup (first time)
-------------------------

Convex requires an interactive first-time setup to create/link a project.

1. Run the dev deployment setup in a normal interactive terminal:

```
npx convex dev
```

2. Follow the prompts to log in and create/link the Convex project.

This will create a `convex/` folder and write a `VITE_CONVEX_URL` value to `.env.local`.

See `.env.example` for the expected environment variable.


