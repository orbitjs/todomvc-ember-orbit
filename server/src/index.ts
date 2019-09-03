import { Config } from "knex";
import { pluralize, singularize } from "inflected";
import { Schema, ModelDefinition } from "@orbit/data";
import { FastifyInstance } from "fastify";
import OrbitServer from "@orbit-server/fastify";
import SQLSource from "orbit-sql";
import plugin from "fastify-plugin";

import schemaJson from "./schema.json";
import * as config from "./knexfile";

function loadConfig(fastify: FastifyInstance) {
  const env = process.env.NODE_ENV || "development";
  fastify.log.info(`Starting in "${env}" environment`);
  return (config as Record<string, Config>)[env];
}

export default plugin(function(fastify, _, next) {
  const schema = new Schema({
    models: schemaJson.models as Record<string, ModelDefinition>,
    pluralize,
    singularize
  });

  const source = new SQLSource({
    schema,
    knex: loadConfig(fastify)
  });

  const server = new OrbitServer({
    source,
    jsonapi: true,
    graphql: true
  });

  fastify.register(server.createHandler());

  next();
});
