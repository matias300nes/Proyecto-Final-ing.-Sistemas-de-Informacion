module.exports = function (sequelize, DataTypes) {
    const TareaFile = sequelize.define("TareaFile", {
        //attributes
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        idTarea: {
            type: DataTypes.INTEGER,
            set(val) {
                this.setDataValue("idTarea", val ? parseInt(val) : null);
            },
        },
        nombre: {
            type: DataTypes.STRING,
        },
        file: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        idUser: {
            type: DataTypes.INTEGER,
            set(val) {
                this.setDataValue("idUser", val ? parseInt(val) : null);
            },
        },
    },
    {
        tableName: "tareaFiles",
        timestamps: true,
        updatedAt: false,
        paranoid: false,
    });

    TareaFile.beforeCreate(async (instance, options) => {
        if (!instance.nombre && instance.file) {
          instance.nombre = instance.file.split("\\").pop().split(".").slice(0, -1).join(".");
        }
    });

    TareaFile.associate = function (models) {
        TareaFile.belongsTo(models.Tarea, {
            foreignKey: "idTarea",
            as: "tarea",
        });
    };

    //TareaFile.sync({ alter: true });

    return TareaFile;
}