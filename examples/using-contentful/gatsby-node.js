const _ = require(`lodash`)
const path = require(`path`)
const slash = require(`slash`)

exports.sourceNodes = ({ actions, schema }) => {
  actions.createTypes(`
    # This is needed if there aren't any MarkdownRemark nodes.
    type MarkdownRemark implements Node {
      html: String
    }
  `)

  actions.createTypes(
    [`contentfulProductProductDescriptionTextNode`].map(typeName =>
      schema.buildObjectType({
        name: typeName,
        fields: {
          childMarkdownRemark: {
            type: `MarkdownRemark`,
            resolve: async (source, args, context) => {
              const { path } = context
              const result = await context.nodeModel.getNodesByIds(
                { ids: source.children, type: `MarkdownRemark` },
                { path }
              )
              if (result && result.length > 0) {
                return result[0]
              } else {
                return null
              }
            },
          },
        },
        extensions: {
          infer: false,
        },
      })
    )
  )
}

// Implement the Gatsby API “createPages”. This is
// called after the Gatsby bootstrap is finished so you have
// access to any information necessary to programmatically
// create pages.
exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  // The “graphql” function allows us to run arbitrary
  // queries against the local Contentful graphql schema. Think of
  // it like the site has a built-in database constructed
  // from the fetched data that you can run queries against.
  return graphql(
    `
      {
        allContentfulProduct(limit: 1000) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
  )
    .then(result => {
      if (result.errors) {
        throw result.errors
      }

      // Create Product pages
      const productTemplate = path.resolve(`./src/templates/product.js`)
      // We want to create a detailed page for each
      // product node. We'll just use the Contentful id for the slug.
      _.each(result.data.allContentfulProduct.edges, edge => {
        // Gatsby uses Redux to manage its internal state.
        // Plugins and sites can use functions like "createPage"
        // to interact with Gatsby.
        createPage({
          // Each page is required to have a `path` as well
          // as a template component. The `context` is
          // optional but is often necessary so the template
          // can query data specific to each page.
          path: `/products/${edge.node.id}/`,
          component: slash(productTemplate),
          context: {
            id: edge.node.id,
          },
        })
      })
    })
    .then(() =>
      graphql(
        `
          {
            allContentfulCategory(limit: 1000) {
              edges {
                node {
                  id
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          throw result.errors
        }

        // Create Category pages
        const categoryTemplate = path.resolve(`./src/templates/category.js`)
        // We want to create a detailed page for each
        // category node. We'll just use the Contentful id for the slug.
        _.each(result.data.allContentfulCategory.edges, edge => {
          // Gatsby uses Redux to manage its internal state.
          // Plugins and sites can use functions like "createPage"
          // to interact with Gatsby.
          createPage({
            // Each page is required to have a `path` as well
            // as a template component. The `context` is
            // optional but is often necessary so the template
            // can query data specific to each page.
            path: `/categories/${edge.node.id}/`,
            component: slash(categoryTemplate),
            context: {
              id: edge.node.id,
            },
          })
        })
      })
    )
}
