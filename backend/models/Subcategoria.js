/**
 * MODELO SUBCATEGORIA
 * define la tabla Subcategoria en la base de daos
 * Almacena las subcategorias de los productos
 */

//Importar DataType de sequelize 
const {DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Subcategoria
 */
const Subcategoria = sequelize.define('Subcategoria', {
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
        unique: {
            msg: 'Ya existe una subcategoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la subcategoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener netre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion dee la subcategoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTERGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla relacionada
            key: 'id' //campo de la tabla relacioonada
        },
        
    }

    /**
     * activo estado de la categoria 
     * si es false la categoria y todas sus sibcategorias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    
    }
}, {
    // Opciones dek modelo

    tableName: 'categorias',
    timestamps: true, //Agrega campos de createdAT y updateAT

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * afterUpdate: se ejecuta despues de actualizar una categoria
         * si se desactiva una categoria se descativan todas sus subcategorias y productos
         */
        afterUpdate: async (categoria, options) => {
            //Verificar si el campo activo cambio
            if (categoria.changed('activo') && !categoria.activo) {
                console.log(`Desactivando categoria: ${categoria.nombre}`);

                // Importar modelos (aqui para evitat dependecias circulares)
                const Subcategoria = require('./Subcategoria');
                const Producto = require('./Producto');

                try {
                    // Paso 1 desactivar las subcategorias de esta categoria
                    const subcategorias = await Subcategoria.findAll({
                        where: { categoriaId: categoria.id}
                    });

                    for (const subcategoria of subcategorias) {
                        await subcategoria.update({
                            activo: false}, {transaction: options.transaction});
                            console.log(`Subcategoria desactivada: ${subcategoria.nombre}`);
                }
                // Paso 2 desactivas los productos de esta categoria
                const productos = await Producto.findAll({
                        where: { categoriaId: categoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({ activo: false}, {transaction: options.transaction});
                            console.log(`Producto desactivada: ${producto.nombre}`);
                }

                console.log('Categoria y elementos reaccionados desactivados correctamente');
                } catch (error) {
                console.error('Error al descativar elementos relacionados:', error.message);
                throw error;
                }
            }
            // Si se activa una categoria no se activam auomaticamente las subcategorias y productos
        }
    }
});

// METODOS DE INSTACIA 
/**
 * Metodo para contar subcategorias de esta categoria
 * 
 * @returns {Promise<number>} - numero de subcategoria
 */
Categoria.prototype.contarSubcategorias = async function() {
    const Subcategoria= require('/.Subcatergoria');
    return await Subcategoria.count({ 
        where: { categoriaId: this.id} });
};

/**
 * Metodo para contar productos de esta categoria
 * 
 * @returns {Promise<number>} - numero de productos
 */
Categoria.prototype.contarProductos = async function() {
    const Subcategoria= require('/.Producto');
    return await Producto.count({ 
        where: { categoriaId: this.id} });
};

//Exportar modelo Categoria
Module.exports = Categoria;