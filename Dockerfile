# syntax=docker/dockerfile:1.7

########################
# base: node + yarn
########################
FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN corepack enable

########################
# deps: install once, cacheable
########################
FROM base AS deps

COPY package.json yarn.lock .yarnrc.yml ./
# COPY .yarn/ .yarn/

# Use BuildKit cache for Yarn's global cache
RUN --mount=type=cache,id=yarn-cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable

########################
# builder: compile app
########################
FROM base AS builder

# Reuse node_modules from deps layer
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN yarn build

########################
# prod-deps: prune to production only
########################
FROM base AS prod-deps

ENV NODE_ENV=production

# Copy manifests and yarn metadata
COPY package.json yarn.lock .yarnrc.yml ./
# COPY .yarn/ .yarn/

# Production-only install (no scripts re-run thanks to skip-build)
RUN --mount=type=cache,id=yarn-cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable --mode=skip-build

########################
# runtime: small, no yarn
########################
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Create non-root user (node) and use it
USER node

# Only what's needed to run
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder   /usr/src/app/dist         ./dist
COPY --chown=node:node package.json .

# Prefer running Node directly so Yarn isn't needed at runtime.
CMD ["node", "dist/src/index.js"]
