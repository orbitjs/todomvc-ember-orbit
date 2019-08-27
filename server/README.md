# Orbit Server Template

A template repository for orbit server

## Usage

``` bash
yarn install
yarn start
```

You should have a server running on `http://localhost:3000`.
With default configuration it exposes an in-memory `sqlite` database through a `JSONAPI` and a `GraphQL` endpoints.
You can explore `GraphQL` schema by going to `http://localhost:3000/graphql`.
You can change the schema by editing `schema.json`.

You can print all available endpoints by running:

``` bash
yarn routes
```
