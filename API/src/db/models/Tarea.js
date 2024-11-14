module.exports = function (sequelize, DataTypes) {
  const Tarea = sequelize.define("Tarea", {
    //attributes
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("Tarea", "Incidente", "Mantenimiento"),
      defaultValue: "Tarea",
    },
    prioridad: {
      type: DataTypes.ENUM("Sin especificar", "Baja", "Media", "Alta", "Urgente"),
      defaultValue: "Sin especificar",
    },
    estado: {
      type: DataTypes.ENUM("Pendiente", "Bloqueado", "En curso", "Finalizado"),
      defaultValue: "Pendiente",
    },
    descripcion: {
      type: DataTypes.STRING,
    },
    comentarios: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        let json = this.getDataValue("comentarios");
        if (typeof json === "string") json = JSON.parse(json);
        return json;
      },
    },
    idResponsable: {
      type: DataTypes.INTEGER,
      allowNull: true,
      set(val) {
        this.setDataValue("idResponsable", val ? parseInt(val) : null);
      },

    },
    idUserAdd: {
      type: DataTypes.INTEGER,
      set(val) {
        this.setDataValue("idUserAdd", val ? parseInt(val) : null);
      },
    },
  },
    {
      tableName: "tareas",
      timestamps: true,
      paranoid: false,
    });

  Tarea.associate = function (models) {
    Tarea.belongsTo(models.User, {
      foreignKey: "idResponsable",
      as: "responsable",
    });
    Tarea.belongsTo(models.User, {
      foreignKey: "idUserAdd",
      as: "userAdd",
    });
  };

  //Tarea.sync({ alter: true });

  return Tarea;
}