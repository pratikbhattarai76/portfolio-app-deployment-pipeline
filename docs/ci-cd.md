# CI/CD Pipeline

The pipeline is defined in `.github/workflows/docker.yml` and has two jobs: `verify` and `build-and-push`.

## verify
Runs on every pull request and every push to main. Steps:

1. Checkout the code.
2. Set up Node.js (pinned to the same version as the Dockerfile).
3. `npm ci` to install dependencies, with the npm cache restored from previous runs.
4. `npm run ci:verify`, which runs three things in sequence:
   - `npm run check` — Astro/TypeScript type checking.
   - `npm run build` — production build.
   - `npm run smoke` — boot the built server and validate it actually responds.
5. Build the Docker image (without pushing) to confirm the build itself works.

If any step fails, the workflow fails and nothing reaches the next job.

## build-and-push
Only runs on pushes to main, and only after `verify` has passed. Steps:

1. Checkout, set up Buildx.
2. Log into GHCR using the ephemeral `GITHUB_TOKEN`.
3. Generate tags via `docker/metadata-action`: `latest` (only on main) and `commit-<short-sha>` for every build.
4. Build and push the image with both tags applied. Buildx cache is shared with the verify job via GitHub Actions cache.

The image is published as `ghcr.io/pratikbhattarai76/portfolio-app`.

## Concurrency Control
The workflow uses a concurrency group keyed on the branch with `cancel-in-progress: true`. If multiple commits land on main in quick succession, only the latest one finishes building — older builds are cancelled mid-run. This prevents race conditions where an older build could overwrite a newer one in the registry.

## Permissions
Each job has its own scoped permissions block. `verify` only gets `contents: read`. `build-and-push` gets `contents: read` and `packages: write`. Each job receives the minimum it needs and nothing more, which limits the blast radius if a malicious dependency in `npm ci` were ever to try to abuse `GITHUB_TOKEN`.

## Server-Side Deployment
The server-side half of the pipeline lives in the [infrastructure repository](https://github.com/pratikbhattarai76/private-cloud-infrastructure). A bash script on the server runs every 30 minutes via cron, pulls the `latest` tag from GHCR, compares image IDs, and recreates the container if a new image is detected. See that repository's [ci-cd.md](https://github.com/pratikbhattarai76/private-cloud-infrastructure/blob/main/docs/guides/ci-cd.md) for the deployment side.
