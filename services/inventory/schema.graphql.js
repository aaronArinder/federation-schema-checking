const { gql } = require("apollo-server");

module.exports = {
    typeDefs: gql`
        extend type Product @key(fields: "upc") {
            upc: String! @external
            weight: Int @external
            price: Int @external
            inStock: Boolean
            shippingEstimate: Int @requires(fields: "price weight")
        }
    `
}
