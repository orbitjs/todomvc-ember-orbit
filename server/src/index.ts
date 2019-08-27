import { pluralize, singularize } from "inflected";
import { Schema, ModelDefinition } from "@orbit/data";
import Server from "@orbit-server/fastify";
import SQLSource from "orbit-sql";
import plugin from "fastify-plugin";

import schemaJson from "./schema.json";

export default plugin(function(fastify, _, next) {
  const schema = new Schema({
    models: schemaJson.models as Record<string, ModelDefinition>,
    pluralize,
    singularize
  });

  const source = new SQLSource({
    schema,
    knex: {
      client: "sqlite3",
      // connection: { filename: ':memory:' },
      connection: { filename: "./todomvc-ember-orbit.db" },
      useNullAsDefault: true
    }
  });

  const server = new Server({
    source,
    jsonapi: true,
    graphql: true
  });

  fastify.register(server.createHandler());

  next();
});
