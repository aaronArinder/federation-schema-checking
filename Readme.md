## Home-rolled apollo check
Apollo is awesome! But, why pay for apollo-checks? This repo is a PoC for home-rolling apollo-checks. It covers _one_ use case: removing a field. It doesn't check changes field value changes (i.e., changes to the type of the value rather than just straight removal of the value), and it doesn't do any kind of sampling.

### Up and running

To run the federated services and gateway, do the following:

- `yarn` to install the dependencies,
- `yarn start-services` to start the services,
- and, in a different terminal, `yarn start-gateway` to kick on the gateway

### Demonstrating a breaking change
#### Querying the federated services
To demonstrate a breaking change, first you must make a query. Go to `localhost:4000` and query the following:

```
query {
  topProducts {
    upc
    name
  }
}
```
You now have a query saved in a file that we'll use for checking schema changes.

#### Changing the schema
Make a breaking change! Go to `products/schema.graphql.ts` and remove the `name` field from the schema. If all goes well, you'll see `Error: breaking schema change: field queryType actively used, but has been removed.`
