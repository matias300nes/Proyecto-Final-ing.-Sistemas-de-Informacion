const db = require("../../db");
const { gqlWhereParser } = require("../../helpers/gqlWhereParser");
const { saveFile } = require('../../helpers/fileManager');
const DataLoader = require("dataloader");
const { Op } = require("sequelize");
const eventEmiter = require("../../helpers/eventEmiter");
const { userLoader } = require("../../loaders");

const documentosLoader = new DataLoader(async (ids) => {
    const documentos = await db.TareaFile.findAll({
        where: {
            idTarea: {
                [Op.in]: [... new Set(ids)]
            }
        }
    })
    return ids.map(id => documentos.filter(e => e.idTarea == id))
}, { cache: false })

const resolvers = {
    Query: {
        tareas: async (parent, { filter, pagination, order }, { isAuth, reqID }, info) => {
            if (!isAuth) throw Error("No autorizado");
            let options = { }
            if (filter) options = { ...options, ...gqlWhereParser(filter) }
            if (order) options.order = [[order.field, order.order]]
            if (pagination) {
                options.limit = pagination.limit;
                options.offset = (pagination.page - 1) * pagination.limit;
            }
            const { count, rows } = await db.Tarea.findAndCountAll(options)
            if (pagination) {
                eventEmiter.emit("pagination", {
                    reqID: reqID,
                    pages: Math.ceil(count / pagination.limit),
                    total: count,
                });
            }
            return rows;
        }
    },
    Mutation: {
        saveTarea: async (parent, { input }, { isAuth, user }, info) => {
            if (!isAuth) throw Error("No autorizado");
            if (!input.id) return db.Tarea.create({...input, idUserAdd: user.id})
            let tarea = await db.Tarea.findByPk(input.id)
            if (!tarea) throw Error("Tarea no encontrada")
            return tarea.update(input)
        },
        deleteTarea: async (parent, { id }, { isAuth }, info) => {
            if (!isAuth) throw Error("No autorizado");
            const tarea = await db.Tarea.findByPk(id)
            if (!tarea) throw Error("Tarea no encontrada")
            await tarea.destroy()
            return true
        },
        addTareaFile: async (parent, { idTarea, file }, { isAuth, user }, info) => {
            if (!isAuth) throw Error("No autorizado");
            let f = await file
            let nombre = f.filename.split(".").slice(0, -1).join(".")
            let url = await saveFile("tareas/", f)
            return db.TareaFile.create({ idTarea, file: url, nombre, idUser: user.id })
        },
        addComentarioTarea: async (parent, { input }, { isAuth, user }, info) => {
            if (!isAuth) throw Error("No autorizado");
            let tarea = await db.Tarea.findOne({
                where: { id: input.idTarea },
            });
            if (!tarea) throw Error("Tarea no encontrado");
            let comentarios = tarea.comentarios || [];
            comentarios.push({
                ...input,
                idUser: user.id,
            });
            await tarea.update({ comentarios });
            return comentarios[comentarios.length - 1];
        },
    },
    Tarea: {
        documentos: async ({ id }) => {
            if (!id) return null;
            return documentosLoader.load(id)
        },
        comentarios: async ({ comentarios }) => {
            if (!comentarios) return [];
            return comentarios;
        },
        responsable: async ({ idResponsable }) => {
            if (!idResponsable) return null;
            return userLoader.load(idResponsable);
        },
        userAdd: async ({ idUserAdd }) => {
            if (!idUserAdd) return null;
            return userLoader.load(idUserAdd)
        },
    },
}

module.exports = resolvers