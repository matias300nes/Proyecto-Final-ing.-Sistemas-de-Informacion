module.exports = function(sequelize, DataTypes) {

    const Notificacion = sequelize.define('Notificacion', {
        //attributes
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true 
        },
        programmedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        header: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        body: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
        },
        channels: {
            type: DataTypes.JSON,
            get(){
                let json = this.getDataValue('channels')
                if (typeof json === 'string') json = JSON.parse(json)
                return json
            }
        },
        users: {
            type: DataTypes.JSON,
            get(){
                let json = this.getDataValue('users')
                if (typeof json === 'string') json = JSON.parse(json)
                return json
            }
        },
    },{
        tableName: 'notificaciones',
        timestamps: true,
        updatedAt: false,
    });

    //Notificacion.sync({alter: true});

    return Notificacion;
}