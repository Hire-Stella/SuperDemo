# syntax=docker/dockerfile:1
#
# The API, as one image. Runs anywhere that takes a container — Railway,
# Render, Fly, a VPS — because the one thing this service cannot be is
# serverless: it holds WebSocket connections and the outbound dialer ticks on an
# interval, and both die with a function that scales to zero between requests.
#
# Multi-stage because the build needs the whole pnpm workspace (the API imports
# @superdemo/contracts and @superdemo/db as source) while the runtime needs
# almost none of it.

FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm PATH=$PNPM_HOME:$PATH
# Prisma's engines need OpenSSL, and node:slim does not ship it.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
# Manifests only, so a source-only change does not re-resolve the whole tree.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY . .
# `db build` runs prisma generate, so the client is emitted before tsc needs it.
RUN pnpm --filter @superdemo/contracts build \
  && pnpm --filter @superdemo/db build \
  && pnpm --filter @superdemo/api build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Production tree only. The dev dependencies are a build concern and have no
# business being reachable from a running container.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --prod --filter @superdemo/api...

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/db/prisma ./packages/db/prisma
# Generate the Prisma client here rather than copying it out of the build stage.
#
# The COPY this replaces could never have worked, and had clearly never been
# run: `.npmrc` sets shamefully-hoist=false, so pnpm never places the generated
# client at the workspace root. It lives beside @prisma/client inside the pnpm
# store, under a directory name carrying a content hash — and Docker's COPY
# cannot expand a glob on the destination side, so there is no spelling of that
# path that works.
#
#   Step 33/37 : COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
#   COPY failed: stat app/node_modules/.prisma: file does not exist
#
# Regenerating is also the more honest answer to the arch-specific worry that
# motivated the copy: the engines are platform specific, and this stage is the
# platform that will run them. The CLI is pinned to the installed client's own
# version, because a generate from a mismatched CLI is a runtime failure rather
# than a build one.
RUN PRISMA_VERSION="$(cd packages/db && node -p "require('@prisma/client/package.json').version")" \
  && pnpm dlx prisma@"$PRISMA_VERSION" generate --schema=packages/db/prisma/schema.prisma

# Not 3101: hosts inject their own port and expect the app to honour it.
ENV PORT=8080
EXPOSE 8080

# No shell wrapper, so SIGTERM reaches node and in-flight calls are not cut off
# mid-deploy.
CMD ["node", "apps/api/dist/main.js"]
