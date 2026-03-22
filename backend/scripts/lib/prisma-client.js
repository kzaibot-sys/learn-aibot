require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for smoke scripts");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

module.exports = {
  createPrismaClient,
};
