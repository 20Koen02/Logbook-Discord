# syntax=docker/dockerfile:1.7

########################
# base: node + system deps + yarn
########################
FROM node:22-slim AS base
WORKDIR /usr/src/app
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        fontconfig \
        python3 \
        pkg-config \
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

COPY fonts/ /usr/local/share/fonts/truetype/custom/
RUN fc-cache -f

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

# Production-only install.
# Native modules like `canvas` need their install/build scripts in the runtime
# dependency layer, otherwise Vega cannot create a headless canvas in Docker.
RUN --mount=type=cache,id=yarn-cache,target=/usr/local/share/.cache/yarn \
    yarn install --immutable

########################
# runtime: production
########################
FROM base AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Only what's needed to run
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder   /usr/src/app/dist         ./dist
COPY --chown=node:node package.json .

# Prefer running Node directly so Yarn isn't needed at runtime.
CMD ["node", "dist/src/index.js"]
