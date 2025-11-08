# Example Cloudflare worker setup and client build

Bare bones Cloudflare worker, with a setup for serving
external projects which build to the workers dist and
proxies to the vite dev server in dev mode.

## Tech Stack

- Turborepo
- Cloudflare Worker
  - /api with AI chat endpoint
  - Catch all 
    - serves apps/worker/dist/client/index.html in prod
    - proxies to vite dev server in development
- Vue client
  - builds to apps/worker/dist/client
- Future Clients
  I 'll add other clients ie other frameworks to play around
  with for example svelete which would catch all on /svelte/
  and proxy to its dev server

## Main focus

The main focus for now will be headless client logic that can
be used by multiple frameworks.
Also I want to start using Custom Elements for UI by default.
As such most framework implemenmtation may heavilly use shared 
custom Elements and headless client logic.

For Custom Elements I'll use Lit as it seems worth it rather
than the boilerplate of native, even if you end up writing 
your own wrapper seems better to not reinvent the wheel.

Another reason for focus on custom elements is that I am more
interested in Elixir these days, and Ash but I'm still not sure
how I feel about phoenix live-view. However I do see how combining
with frameworks like Vue, React etc seems overkill since live-view
does most you need, so to me custom elements and plain html
seem to be the way to go for me in elixir, live-view to handle \
most updates and any additional desired client interaction
can be contained in custom elements.