import { Config } from "knex";

export const development: Config = {
  client: "sqlite3",
  connection: {
    filename: "db/development.sqlite"
  },
  useNullAsDefault: true
};

export const test: Config = {
  client: "sqlite3",
  connection: { filename: ":memory:" },
  useNullAsDefault: true
};

export const production: Config = {
  client: "pg",
  connection: process.env.DATABASE_URL
};
