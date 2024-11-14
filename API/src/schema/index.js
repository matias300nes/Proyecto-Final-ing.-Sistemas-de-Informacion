const path = require('path');
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { mergeResolvers, mergeTypeDefs } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');

// Se cargan los archivos de tipo SDL
const typesArray = loadFilesSync(path.join(__dirname, './typedefs'), { extensions: ['gql', 'js'] });
// Se unifica la SDL en un unico documento
const typeDefs = mergeTypeDefs(typesArray, { all: true });

// Se cargan los archivos de resolvers
const resolversArray = loadFilesSync(path.join(__dirname, './resolvers'), { extensions: ['js'] });
// Se unifican los resolvers en un unico objeto
const resolvers = mergeResolvers(resolversArray, { all: true });

// Se crea el esquema de GraphQL
const schema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolvers
})

module.exports = schema