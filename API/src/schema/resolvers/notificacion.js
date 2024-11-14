const { withFilter } = require("graphql-subscriptions");
const db = require("../../db");
const { Op } = require("sequelize");
const notificationHandler = require("../../helpers/NotificationHandler");
const pubsub = require("../../helpers/pubsub");
const { DateTime } = require("luxon");

const resolvers = {
  Query: {
    notificaciones: async (parent, args, { isAuth, user }, info) => {
      if (!isAuth) throw Error("No autorizado");
      //desde hace 15 dias
      let desde = DateTime.local().minus({ days: 15 }).toJSDate();
      let options = {
        where: {
          [Op.and]: [
            db.sequelize.literal(`JSON_CONTAINS(users, '"${user.id}"')`),
            {
              [Op.and]: [
                { programmedAt: { [Op.gte]: desde } },
                { programmedAt: { [Op.lte]: new Date() } },
              ],
            },
          ],
        },
        order: [["programmedAt", "DESC"]],
      };

      const notificaciones = await db.Notificacion.findAll(options);
      return notificaciones.filter((notificacion) => {
        return notificacion.channels.includes("app");
      });
    },
  },
  Mutation: {
    addNotificacion: async (parent, { input }, { isAuth }, info) => {
      if (!isAuth) throw Error("No autorizado");
      return notificationHandler.send(input);
    },
  },
  Subscription: {
    notificaciones: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("NOTIFICATION"),
        async (payload, variables, { user }) => {
          return payload.notificaciones.users.includes(user.id.toString());
        }
      ),
    },
  },
  Notificacion: {
    channels: async (parent, args, context, info) => {
      return parent.channels;
    },
  },
};

module.exports = resolvers;
