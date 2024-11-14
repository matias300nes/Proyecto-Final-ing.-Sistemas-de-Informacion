const jwt = require("jsonwebtoken");
const db = require("../../db");
const pubsub = require("../../helpers/pubsub");
const { Op } = require("sequelize");
const { userLoader } = require("../../loaders");
const subscribersList = require("../../helpers/subscribersList");
const eventEmiter = require("../../helpers/eventEmiter");
const { gqlWhereParser } = require("../../helpers/gqlWhereParser");
const { sha512 } = require("js-sha512");

const resolvers = {
  Query: {
    currentUser: async (
      parent,
      args,
      { user, isAuth },
      info
    ) => {
      if (!isAuth) {
        throw Error("No autorizado");
      }
      const currentUser = await userLoader.load(user.id);
      return currentUser;
    },
    connections: async (parent, args, context, info) => {
      if (!context.isAuth) {
        throw Error("No autorizado");
      }
      return subscribersList.get();
    },
    usuarios: async (
      parent,
      { filter, pagination, search, order },
      { isAuth, reqID },
      info
    ) => {
      if (!isAuth) throw Error("No autorizado");
      let options = {
        where: {
          id: { [Op.not]: 1 },
        },
      };
      if (filter) options = { ...options, ...gqlWhereParser(filter) };
      if (order) options.order = [[order.field, order.order]];
      if (search) {
        options.where = {
          [Op.and]: [
            options.where,
            {
              [Op.or]: [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
              ],
            },
          ],
        };
      }

      if (pagination) {
        options.limit = pagination.limit;
        options.offset = (pagination.page - 1) * pagination.limit;
      }
      const { count, rows } = await db.User.findAndCountAll(options);
      if (pagination) {
        eventEmiter.emit("pagination", {
          reqID: reqID,
          pages: Math.ceil(count / pagination.limit),
          total: count,
        });
      }
      return rows;
    },
  },
  Mutation: {
    login: async (parent, { input }, context, info) => {
      const { username, email, password } = input;
      let options = {
        where: {},
      };

      if (!username && !email) throw Error("Se requiere username o email");

      if (!password) throw Error("La contraseña es obligatoria");

      if (username) options.where.username = username;

      if (email) options.where.email = email;

      const user = await db.User.findOne(options);

      if (!user) throw Error("El nombre de usuario o email no existe");

      if (user.password !== password)
        throw Error("La contraseña no es correcta");

      const token = jwt.sign(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
        },
        process.env.JWT_KEY,
        {
          algorithm: "HS256",
          expiresIn: "7d",
        }
      );

      return { token, user };
    },
    saveUser: async (parent, { input }, { isAuth, user }, info) => {
      if (!isAuth) {
        throw Error("No autorizado");
      }
      if (user.id == input.id) {
        if (input.id) {
          const user = await db.User.findByPk(input.id);
          if (!user) throw Error("User no encontrado");
          if (input.password) {
            input.password = sha512(input.password);
            input.tempPassword = null;
          }
          await user.update(input);
          userLoader.clear(parseInt(input.id));
          return user;
        } else {
          let tempPassword = Math.floor(
            100000 + Math.random() * 900000
          ).toString();
          let hashed = sha512(tempPassword);
          input.password = hashed;
          input.tempPassword = tempPassword;
          const user = await db.User.create(input);
          return user;
        }
      } else {
        throw Error("No autorizado");
      }
    },
  },
  Subscription: {
    connections: {
      subscribe: (parent, args, context) => {
        return pubsub.asyncIterator("CONNECTION_EVENT");
      },
    },
  },
  User: {
    connected: async ({ id }, args, context, info) => {
      return subscribersList.get().includes(id);
    },
  },
};

module.exports = resolvers;
