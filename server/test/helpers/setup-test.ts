import Fastify, { FastifyInstance, HTTPInjectOptions, Plugin } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';

export interface TestContext {
  request: (url: string, options?: Partial<HTTPInjectOptions>) => Promise<HTTPResponse>;
}

export interface HTTPResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export default function<T>(app: Plugin<Server, IncomingMessage, ServerResponse, T>, hooks: NestedHooks) {
  let fastify: FastifyInstance;
  const context: TestContext = {
    request(url: string, options?: Partial<HTTPInjectOptions>) {
      return request(fastify, url, options);
    }
  };
  hooks.beforeEach(function() {
    fastify = Fastify();
    fastify.register(app);
  });
  hooks.afterEach(async function() {
    await fastify.close();
  });
  return context;
}

export async function request(fastify: FastifyInstance, url: string, options?: Partial<HTTPInjectOptions>): Promise<HTTPResponse> {
  const response = await fastify.inject({ url, ...options });

  return {
    status: response.statusCode,
    headers: response.headers as any,
    body: JSON.parse(response.payload)
  };
}
