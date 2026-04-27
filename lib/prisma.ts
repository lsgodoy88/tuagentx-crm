// @ts-nocheck
import { PrismaClient } from "../app/generated/prisma/index.js"

const globalForPrisma = globalThis as any

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter: null, datasources: { db: { url: process.env.DATABASE_URL } } })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
