const { GraphQLScalarType } = require("graphql");
const db = require("../../db");
const { provinciaLoader, userLoader } = require("../../loaders");
const { DateTime } = require("luxon");
const { GraphQLUpload } = require("graphql-upload-minimal");
const { GraphQLJSON } = require("graphql-type-json");
const eventEmitter = require("../../helpers/eventEmiter");

//FORMATS ONLY FOR GRAPHQL
const DATEFORMAT = "yyyy-MM-dd";
const DATETIMEFORMAT = "yyyy-MM-dd HH:mm:ss";

const resolvers = {
    DateTime: new GraphQLScalarType({
        name: "DateTime",
        description: `format (${DATETIMEFORMAT})`,
        parseValue(value) {
            let date = DateTime.fromFormat(value, DATETIMEFORMAT).toJSDate();
            if (date == "Invalid Date") {
                throw new Error("Invalid Date");
            }
            return date;
        },
        serialize(value) {
            if (typeof value === "string") {
                value = new Date(value);
            }
            return DateTime.fromJSDate(value).toFormat(DATETIMEFORMAT);
        },
        parseLiteral(ast) {
            return DateTime.fromFormat(ast.value, DATETIMEFORMAT).toJSDate();
        },
    }),
    Date: new GraphQLScalarType({
        name: "Date",
        description: `format (${DATEFORMAT})`,
        parseValue(value) {
            let date = DateTime.fromFormat(value, DATEFORMAT).toJSDate();
            if (date == "Invalid Date") {
                throw new Error("Invalid Date");
            }
            return date;
        },
        serialize(value) {
            if (typeof value === "string") {
                return DateTime.fromFormat(value, "yyyy-MM-dd").toFormat(
                    DATEFORMAT
                );
            }
            if (value instanceof Date) {
                return DateTime.fromJSDate(value).toFormat(DATEFORMAT);
            }
        },
        parseLiteral(ast) {
            return DateTime.fromFormat(ast.value, DATEFORMAT).toJSDate();
        },
    }),
    Upload: GraphQLUpload,
    JSON: GraphQLJSON,
    Query: {
        provincias: async (parent, args, { isAuth }, info) => {
            //Obtener todas las provincias ordenadas por nombre
            const provincias = await db.Provincia.findAll({
                order: [["nombre", "ASC"]],
            });
            return provincias;
        },
        localidades: async (parent, { provincia }, { isAuth }, info) => {
            const localidades = await db.Localidad.findAll({
                where: {
                    idProvincia: provincia,
                },
                order: [["nombre", "ASC"]],
            });
            return localidades;
        },
        paginationInfo: async (parent, args, { reqID }, info) => {
            const timeout = 2000;
            let resolved = false;
            return new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    resolve(null);
                    if (!resolved) {
                        eventEmitter.removeListener("pagination", callback);
                        resolve(null);
                    }
                }, timeout);

                const callback = (data) => {
                    if (reqID === data.reqID) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        eventEmitter.removeListener("pagination", callback);
                        resolve(data);
                    }
                };

                eventEmitter.on("pagination", callback);
            });
        },
    },
    Localidad: {
        provincia: async (parent, args, context, info) => {
            const provincia = await provinciaLoader.load(parent.idProvincia);
            return provincia;
        },
    },
    ErrorLog: {
        user: async ({ idUser }, args, context, info) => {
            if (!idUser) return null;
            const user = await userLoader.load(idUser);
            return user;
        },
    },
};

module.exports = resolvers;
