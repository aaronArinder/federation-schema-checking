const { gql } = require("apollo-server");
module.exports = {
    typeDefs: gql`
        extend type Query {
            topProducts(first: Int = 5): [Product]
        }

        type Product @key(fields: "upc") {
            upc: String!
            name: String
            price: Int
            weight: Int
        }
    `
}
