const express = require('express')
require('dotenv').config();
const compression = require('compression')
const cors = require("cors");
const schedule = require('./src/schedule');
const { graphqlHTTP } = require('express-graphql')
const { graphqlUploadExpress } = require('graphql-upload-minimal');
const path = require('path');
require('colors');

//EXPRESS APP
const app = express()

//SEQUELIZE SQL
const db = require('./src/db');
db.sequelize.authenticate()
  .then(() => {
    const dbname = db.sequelize.getDatabaseName()
    const host = db.sequelize.config.host
    console.log('Connected to database ' + `${dbname}`.cyan.underline + ' on ' + `${host}`.cyan.underline + '.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

//SCHEDULE JOBS
schedule.start();

//MIDDLEWARE
app.use(cors());
app.use(express.static('public'))
app.use(require('./src/middleware/auth-middleware.js'))
app.use(compression())
app.use('/public', express.static('public'))
app.use(express.json({ limit: '1mb' }));
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

//VITALS
app.get('/', (req, res) => res.send('Server is running'))

//REST CONFIG
const routes = require('./src/rest')
app.use('/rest', routes)

//ENV
const PORT = process.env.PORT;
const isDevelopment = process.env.NODE_ENV === 'development';

// GRAPHQL CONFIG
const schema = require('./src/schema')
app.use('/graphql',
  graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
  graphqlHTTP(req => ({
    schema,
    graphiql: isDevelopment ? {
      defaultQuery: require('./default-query.js'),
      headerEditorEnabled: true,
    } : false,
    context: {
      reqID: req.id,
      isAuth: req.isAuth,
      user: req.user,
      error: req.error,
      isDevelopment,
    },
    customFormatErrorFn: (err) => {
      if (!err.originalError) {
        return err
      }
      /* 
          You can add the following to any resolver
          const error = new Error('My message')
          error.data = [...]
          error.code = 001
      */
      const message = err.message || 'An error occured.'
      const code = err.originalError.code
      const data = err.originalError.data
      return {
        // ...err, 
        message,
        code,
        data
      }
    }
  }))
)

const server = app.listen(PORT, () => {
  const sAddress = server.address()
  console.log(`[${process.env.NODE_ENV}]`.blue + ` GraphQL Server running on http://localhost:${sAddress.port}/graphql`)
  // GRAPHQL-WEB-SOCKETS
  if (process.env.USE_WS) {
    const createWsServer = require('./ws');
    const wsServer = createWsServer(server, schema); // Creamos el servidor WebSocket
    const wsAddress = wsServer.address()
    console.log(`[${process.env.NODE_ENV}] WebSockets listening on ws://localhost:${wsAddress.port}${wsServer.options.path}`);
  }
});