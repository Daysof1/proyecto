/**
 * MODELO CARRITO
 * define la tabla Carrito en la base de daos
 * Almacena los productos que cada usuario ha agregado a su carrito
 */

//Importar DataType de sequelize 
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');
const { timeStamp } = require('node:console');

/**
 * Definir el modelo del carrito
 */
const Carrito = sequelize.define('Carrito', {
    //Campos de la tabl
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId ID del usuario dueño del carrito
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',// si se elimina el usuario se elimina su carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },

     // ProductoId ID del producto en el carrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',// Se elimina el producto del carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    //Cantidad de este producto en el carrito
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },

    /**
     * Precio unitario del producto al momemto de agregarlo al carrito
     * se guarda para mantener el precio aunque el producto cambie de precio
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    }
}, {
    //opciones del modelo

    tableName: 'carritos',
    timestamps: true,
    //indices para mejorar las busquedas 
    indixes: [
        {
            //indice para buscar carrito pot usuario
            fields: ['usuarioId']
        },

        {
        //Indice compuesto: un usuario no puede tener un mismo producto duplicado
        unique: true,
        fields: ['usuarioId', 'productoId'],
        name: 'usuario_producto_unique'
        }
    ],

/**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoria
         * verifica que la categoria padre este activa
         */
        beforeCreate: async (subcategoria) => {
            const Categoria = require('./categoria'); //No lee la ruta con C nayuscula

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(subcategoria.categoriaId);

            if (!categoria) {
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('No se puede crear una subcategoria en una categoria inactiva');
            }
        },
        /**
         * afterUpdate: se ejecuta despues de actualizar una subcategoria
         * si se desactiva una subcategoria se descativan todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            //Verificar si el campo activo cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoria: ${subcategoria.nombre}`);

                // Importar modelos (aqui para evitat dependecias circulares)
                const Producto = require('./Producto');

                try {
                    // Paso 1 desactivar las subcategorias de esta subcategoria
                    const productos = await Producto.findAll({
                        where: { subcategoriaId: subcategoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({
                            activo: false}, {transaction: options.transaction});
                            console.log(`Producto desactivado: ${producto.nombre}`);
                }
                console.log(`Subcategoria y productos relacionados desactivados correctamente`);
            } catch (error) {
                console.error('Error al desactivar productos relacionados:', error.message);
                throw error;
            }
        }
                
            // Si se activa una categoria no se activam auomaticamente las subcategorias y productos
        }
    }
});
// METODOS DE INSTACIA 
/**
 * Metodo para contar productos de esta subcategoria
 * 
 * @returns {Promise<number>} - numero de productos
 */
Subcategoria.prototype.contarProductos = async function() {
    const Producto= require('./Producto');
    return await Producto.count({ 
        where: { subcategoriaId: this.id} });
};
    nombre: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: {
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate: {
            notEmpy: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre de la categoria debe tener netre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion dee la categoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
