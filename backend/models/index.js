/**
 * Asociaciones entre modelos
 * este archivo define las relaciones entres los modelos de sequelize
 * deje ejecutarse despues de importar los modelos
 */

//Importar todos los modelos

const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Subcategoria = require('./Subcategoria');
const Producto = require('./Producto');
const Carrito = require('./Carrito');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const { PassThrough } = require('node:stream');

/**
 * Defonor asociaciones 
 * Tipos de asociaciones sequelize:
 * hasone 1 - 1
 * belongsto 1 - 1
 * hasmany - 1 - N
 * belongstomany N - N  
 */

/**
 * Categoria - Subcategoria
 * Una categoria tiene muchas subcategorias 
 * Una subcategoria pertenece a una categoria
 */

Categoria.hasMany(Subcategoria, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas 
    as: 'subcategorias', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina una categoria eliminar subcategoria
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar subcategoria 
});

Subcategoria.belongsTo(Categoria, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas 
    as: 'categoria', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina una categoria eliminar subcategoria
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar subcategoria 
});

/**
 * Categoria - producto
 * Una categoria tiene muchos productos 
 * Un producto pertenece a una categoria
 */

Categoria.hasMany(Producto, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas 
    as: 'productos', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina una categoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar el producto 
});

Producto.belongsTo(Categoria, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas 
    as: 'categoria', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina una categoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar el producto 
});

/**
 * Subcategoria - producto
 * Una subcategoria tiene muchos productos 
 * Un producto pertenece a una subcategoria
 */

Subcategoria.hasMany(Producto, {
    foreignKey: 'subcategoriaId', //Campo que conecta las tablas 
    as: 'productos', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina una subcategoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza subcategoria actualizar el producto
});

Producto.belongsTo(Subcategoria, {
    foreignKey: 'subcategoriaId', //Campo que conecta las tablas 
    as: 'subcategoria', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina una subcategoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza subcategoria actualizar el producto
});

/**
 * Usuario - Carrito
 * Un usuario tiene muchos carritos
 * Un carrito pertenece a un usuario
 */

Usuario.hasMany(Carrito, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas 
    as: 'carrito', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina un usuario eliminar carrito
    onUpdate: 'CASCADE' //Si se actualiza usuario actualizar el carrito
});

Carrito.belongsTo(Usuario, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas 
    as: 'usuario', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina un usuario eliminar carrito
    onUpdate: 'CASCADE' //Si se actualiza un usuario actualizar carrito 
});

/**
 * Producto - Carritos
 * Un producto tiene muchos productos
 * Un carrito pertenece a un producto
 */

Producto.hasMany(Carrito, {
    foreignKey: 'productoId', //Campo que conecta las tablas 
    as: 'carrito', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina un producto eliminar carrito
    onUpdate: 'CASCADE' //Si se actualiza un producto actualizar carrito 
});

Carrito.belongsTo(Producto, {
    foreignKey: 'productoId', //Campo que conecta las tablas 
    as: 'producto', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina un producto eliminar carrito
    onUpdate: 'CASCADE' //Si se actualiza un producto actualizar carrito
});

/**
 * Usuario - pedido
 * Un usuario tiene muchos pedido
 * Un pedido pertenece a un usuario
 */

Usuario.hasMany(Pedido, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas 
    as: 'pedidos', // Alias para la relacion 
    onDelete: 'RESTRICT', //Si se elimina un usuario no eliminar pedidos
    onUpdate: 'CASCADE' //Si se actualiza un usuario actualizar pedidos
});

Pedido.belongsTo(Usuario, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas 
    as: 'usuario', // Alias para la relacion 
    onDelete: 'RESTRICT', //Si se elimina un usuario no eliminar pedido
    onUpdate: 'CASCADE' //Si se actualiza un usuario actualizar pedido
});

/**
 * Pedido - DetallePedido
 * Un pedido tiene muchos detalles de productos 
 * Un detalle de pedido pertenece a un pedido
 */

Pedido.hasMany(DetallePedido, {
    foreignKey: 'pedidoId', //Campo que conecta las tablas 
    as: 'detalles', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina un pedido eliminar detalles de pedido
    onUpdate: 'CASCADE' //Si se actualiza un pedido actualizar detalles de pedido
});

DetallePedido.belongsTo(Pedido, {
    foreignKey: 'pedidoId', //Campo que conecta las tablas 
    as: 'pedido', // Alias para la relacion 
    onDelete: 'CASCADE', //Si se elimina un pedido eliminar detalles de pedido
    onUpdate: 'CASCADE' //Si se actualiza un pedido actualizar detalles de pedido
});

/**
 * Producto - DetallePedido
 * Un producto puede estar en muchos detalles de pedido
 * Un detalle tiene un producto
 */

Producto.hasMany(DetallePedido, {
    foreignKey: 'productoId', //Campo que conecta las tablas 
    as: 'detallesPedidos', // Alias para la relacion 
    onDelete: 'RESTRICT', //No se puede elimina un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' //Si se actualiza un producto actualizar detalles de pedido 
});

DetallePedido.belongsTo(Producto, {
    foreignKey: 'productoId', //Campo que conecta las tablas 
    as: 'producto', // Alias para la relacion 
    onDelete: 'RESTRICT', //No se puede elimina un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar subcategoria 
});

/**
 * relacion muchos a muchos
 * Pedido - Producto tiene una relacion muchos a muchos atraves de detalles de pedido
 */

Pedido.hasMany(Producto, {
    through: DetallePedido, //Tabla intermedia
    foreignKey: 'pedidoId', //Campo que conecta las tablas
    otherkey: 'productoId', //Campo que conecta las tablas
    as: 'productos', // Alias para la relacion 
});

Producto.hasMany(Pedido, {
    through: DetallePedido, //Tabla intermedio
    foreignKey: 'pedidoId', //Campo que conecta las tablas
    otherkey: 'productoId', //Campo que conecta las tablas
    as: 'pedidos', // Alias para la relacion 
});

/**
 * Exportar funcion de inicializacion
 * funciones para inciar todas las asociaciones
 * se llama desde el server.js despues de cragar los modelos
 */
const initAssociations = () => { //Este archivo crea las relaciones entre las tablas
    console.log('Asociaciones entre los modelos establecidas correctamente');
};

//Exportar los modelos 
module.exports = {
    Usuario,
    Categoria,
    Subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
};