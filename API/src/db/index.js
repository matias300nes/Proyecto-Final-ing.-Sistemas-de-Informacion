const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')
const modelsFolder = path.join(__dirname, 'models')
const db = {}
const isDevelopment = process.env.NODE_ENV === 'development'

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: isDevelopment && console.log,
  freezeTableName: true,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '-03:00',
})

fs
  .readdirSync(modelsFolder)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
  })
  .forEach(function (file) {
    var model = require(path.join(modelsFolder, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.addHook('afterUpdate', (instance, options) => {
  db.AuditLog.create({
    table: instance.constructor.tableName,
    action: "UPDATE",
    previousData: { ...instance._previousDataValues },
    newData: { ...instance.dataValues },
  })
})
sequelize.addHook('beforeBulkUpdate', async (options) => {
  let previousData = await options.model.findAll({
    where: options.where,
    attributes: options.attributes
  })
  if (!previousData?.length) return
  db.AuditLog.create({
    table: options.model.tableName,
    action: "BULKUPDATE",
    previousData: previousData,
    newData: options.attributes,
  })
})
sequelize.addHook('afterDestroy', (instance, options) => {
  db.AuditLog.create({
    table: instance.constructor.tableName,
    action: "DELETE",
    previousData: { ...instance._previousDataValues },
    newData: instance.dataValues.deletedAt ?
      { deletedAt: instance.dataValues.deletedAt } :
      null,
  })
})
sequelize.addHook('beforeBulkDestroy', async (options) => {
  let previousData = await options.model.findAll({
    where: options.where,
  })
  if (!previousData?.length) return
  db.AuditLog.create({
    table: options.model.tableName,
    action: "BULKDELETE",
    previousData: previousData,
    newData: 'deletedAt' in previousData[0] ?
      { deletedAt: new Date() } :
      null,
  })
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db