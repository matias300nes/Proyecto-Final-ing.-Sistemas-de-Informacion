module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define(
        "User",
        {
            //attributes
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.CHAR(128),
                allowNull: false,
            },
            tempPassword: {
                type: DataTypes.STRING(100),
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            nombre: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            apellido: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            // Other model options go here
            tableName: "users",
            timestamps: true,
            paranoid: false, // soft delete
        }
    );

    User.associate = function (models) {};
    
    //   User.sync({ alter: true });

    return User;
};
