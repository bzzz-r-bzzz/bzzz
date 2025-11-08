# Bzzz

Personal project for utilities and simple starter examples.

- [`@bzzz/persist`](./packages/persist/README.md)
  Moved from an older singleton repo, would like to
  refactor at some stage.
- `@bzzz/utility`
  - [`@bzzz/utility/ArrayPlus`](./packages/utility/src/ArrayPlus.md) 
    Array constructor with additional methods and 
    mutation event for simple tracking.

A CI action is setup for publishing packages using changeset.

> Trying out Bioome rather that eslint / prettier
> haven't fixed all lints yet, not sure how I feel
> about some of them but its just a eslint / prettier vs biome thing.
>
> Will slowly move more code into this project, just
> useful simple things that require little to no deps

---

# Example starter cloudflare worker

- [`example-worker`](./apps/example-worker/README.md)