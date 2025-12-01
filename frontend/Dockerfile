FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=""
ARG BACKEND_API_ORIGIN="http://localhost:8080"
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV BACKEND_API_ORIGIN=${BACKEND_API_ORIGIN}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=""
ARG BACKEND_API_ORIGIN="http://localhost:8080"
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV BACKEND_API_ORIGIN=${BACKEND_API_ORIGIN}

COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
