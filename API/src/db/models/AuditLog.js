module.exports = function (sequelize, DataTypes) {
  const AuditLog = sequelize.define("AuditLog", {
    id: {
      type: DataTypes.INTEGER,
      allowNunll: false,
      autoIncrement: true,
      primaryKey: true,
    },
    table: {
      type: DataTypes.STRING, // Nombre de la tabla
    },
    action: {
      type: DataTypes.STRING, // Acción realizada
    },
    previousData: {
      type: DataTypes.JSON,  // Datos previos en formato JSON
    },
    newData: {
      type: DataTypes.JSON, // Datos posteriores en formato JSON
    },
  }, {
    timestamps: true,
    updatedAt: false,
    tableName: 'auditLogs',
  })

  return AuditLog
}