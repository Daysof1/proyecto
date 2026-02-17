/**
 * MODELO USUARIO
 * define la tabla Usuario en la base de daos
 * Almacena la informacion de los usuarios del sistema
 */

//Importar DataType de sequelize 
const { DataTypes } = require('sequelize');

//Importar bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

//importar instancia de sequelize
const { sequelize } = require('../config/database');
const { before } = require('node:test');

/**
 * Definir el modelo de Usuario
 */
const Usuario = sequelize.define('Usuario', {
    //Campos de la tablas
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener netre 2 y 100 caracteres'
            }
        }
    },

    email: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: {
            msg: 'Este email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'Debe ser un email valido'
            },
            notEmpty: {
                msg: 'El email no puede estar vacio'
            }
        }
    },

    password: {
        type: DataTypes.STRING(255), //cadena larga para el hash
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La contraseña no puede estar vacio'
            },
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener al menos 6 caracteres'
            }
        }
    },
    //rol de usuario (cliente, auxiliar o administrado)
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'), //tres roles disponibles
        allowNull: false,
        defaultValue: 'cliente', // por defecto es cliente
        validate: {
            isIn: {
                arg: [['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol debe ser cliente auxiliar o administrador'
            }
        }
    },
    //Telefono del usuario es opcional
    telefono: {
        type: DataTypes.STRING(20), 
        allowNull: true, // es opcional
        validate: {
            is: {
                args: /^[0-9+\-\s()]*$/, //solo numeros, espacios, guiones y parentesis
                msg: 'El telefono dolo puede contener numeros y caracteres validos'
            }
        }
    },

    /**
     * Direccion del usuario es opcional
     */
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * activo estado del usuario
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true //por defecto activo
    }

}, {
    // Opciones del modelo

    tableName: 'usuarios',
    timestamps: true, //Agrega campos de createdAT y updateAT

    /**
     * Scopes consultas predefinidas
     */

    defaultScope: {
        /**
         * por defecto excluir el password de todas las consultas
         */
        attributes: { exclude: ['password']}
    },
    scopes: {
        // scope para incluir el password cuando sea necesario (ejemplo en login)
        withPassword: {
            attributes: {} // Incluir todos los atributos
        }
    },

    /**
     * hooks funciones que se ejecutan en momentos especificos
     */
    hooks: {
        /**
         * beforeCreate se ejecuta antes de crear un usuario
         * Encripta la contraseña antes de guardarla en la base de datos
         */
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                //genera un salt (semilla aleatoria) con factor de costo de 10
                const salt = await bcrypt.genSalt(10); //Minima incriptacion de 10 caracteres
                //Encriptar la contraseña con salt
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }, 
        /**
         * beforeUpdate se ejecuta antes de actualizar un usuario
         * Encripta la contraseña si se modifica
         */
        beforeUpdate: async (usuario) => {
            //Verificar si la contraseña fue modificada
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
    }
});

// METODOS DE INSTACIA 
/**
 * Metodo para comparar contraseñas
 * Compara una contraseña en texto plano con el hash guardado
 * @param {string} passwordIngresado contraseña en texto
 * 
 * @returns {Promise<boolean>} - true si coinciden, false si no
 */
Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Metodo para obtener datos publicos del usuario (sin contraseña)
 * 
 * @returns {Object} - Objetos co datos publicos del usuario
 */
Usuario.prototype.toJSON = function() {
    const valores = Object.assign({}, this.get());

    //Eliminar la contraseña deñ objeto
    delete valores.password;
    return valores;
};

//Exportar modelo Usuario
module.exports = Usuario;