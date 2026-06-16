FROM public.ecr.aws/docker/library/node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ARG DATABASE_URL="postgresql://admin:Admin123123@localhost:5432/pms-db-dev"

ENV DATABASE_URL=$DATABASE_URL

RUN yarn prisma generate

RUN yarn prisma migrate deploy

RUN yarn build

FROM public.ecr.aws/docker/library/node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["sh","-c","node dist/main.js"]