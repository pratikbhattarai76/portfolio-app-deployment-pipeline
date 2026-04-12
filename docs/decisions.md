# Design Decisions

## Why Docker
Containerizing the app means it runs the same on my laptop, in CI, and on the server. No "works on my machine" surprises. The image becomes the unit of deployment instead of source code plus a deploy script.

## Why a Multi-Stage Build
The Dockerfile has three stages: `deps`, `builder`, `runner`. Only the runner stage ends up in the final image. This means the published image contains the compiled `dist/` folder and production-only `node_modules`, but no source code, no dev dependencies, no build tools, and no TypeScript. Smaller image, smaller attack surface, faster pulls on the server.

## Why Astro SSR Instead of Static
The app has a contact form that sends email through Nodemailer. That requires a real Node.js server, not just static HTML. Astro's SSR mode gives me static-quality performance for the pages that don't need a server, plus real API routes for the ones that do.

## Why GHCR Over Docker Hub
GHCR is integrated with the same GitHub account that holds the source code, uses the same authentication via the ephemeral `GITHUB_TOKEN`, and the published package automatically links back to the repository thanks to the OCI source label in the Dockerfile. No separate account, no separate credentials, no rate limits to worry about for a personal project.

## Why Pull-Based Deployment
The server pulls new images on a schedule rather than CI pushing to the server. This means CI never needs SSH access, deploy keys, or any inbound credentials for the server. A compromised CI pipeline can publish a bad image to GHCR but cannot execute commands on the server. The full reasoning lives in the [infrastructure repository's decisions doc](https://github.com/pratikbhattarai76/private-cloud-infrastructure/blob/main/docs/guides/decisions.md#why-pull-based-deployment).

## Why `:latest` Plus Commit-SHA Tags
Every published image gets two tags: `latest` (the update channel that the server's cron script watches) and `commit-<short-sha>` (an immutable reference to the exact build). The server uses `latest` for the rolling update flow, but every historical build is still addressable by its SHA tag if a rollback is ever needed.

## Why a Non-Root Container User
The Dockerfile ends with `USER node`, switching from the default root user to the unprivileged `node` user that the official Node images ship with. If a vulnerability in the app or a dependency were ever exploited, the attacker would land as a non-root user with no ability to write outside the working directory.

## Why a Built-In Healthcheck
The Dockerfile includes a `HEALTHCHECK` instruction that uses Node's built-in `http` module to GET `/api/health`. Node is used instead of `curl` because the slim base image does not ship `curl` or `wget`, and pulling them in would add weight for no real gain. Using the runtime that is already in the image is the cleaner answer.

## Why a Smoke Test in CI
The CI workflow runs a smoke test that boots the actual built server, polls `/api/health` until it responds, hits the home page to verify expected markup is present, and then shuts the server down. This catches a class of bugs that type checking and unit tests would miss — broken builds, runtime errors on startup, missing assets — before any image is published.
