const ws = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { execute, subscribe } = require('graphql');

module.exports = (server, schema) => {
  // Creación de servidor websocket (subscriptions)
  const path = '/subscriptions'
  const wsServer = new ws.Server({
    server,
    path
  });

  useServer(
    {
      schema,
      execute,
      subscribe,
      // Contexto de la conexión, se envía a todos los resolvers
      context: (ctx) => {
        let decoded
        try {
          const token = ctx.connectionParams.Authorization
          decoded = jwt.verify(token, process.env.JWT_KEY)
        } catch (error) {
          return {
            isAuth: false,
            error: error.message
          }
        }
        if (!decoded) {
          return {
            isAuth: false,
            error: "Unable to decode jwt"
          }
        }
        return {
          isAuth: true,
          user: decoded.user,
          error: null,
          isDevelopment,
        }
      },
      // Eventos de estado de la conexión
      onConnect: (ctx) => {},
      onSubscribe: (ctx, msg) => {},
      onNext: (ctx, msg, args, result) => {},
      onError: (ctx, msg, errors) => {
        console.error(errors)
      },
      onComplete: (ctx, msg) => {},
    },
    wsServer
  );

  return wsServer;
};