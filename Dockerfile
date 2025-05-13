# install deps
FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# build
FROM base as builder
WORKDIR /usr/src/app
RUN npm run build


# production
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /usr/src/app/dist ./dist
ENTRYPOINT ["npm", "run", "start"]