/**
 * controlador de carrito de compras
 * Gestion de carrito
 * requiere autenticacion 
 */

//Importar modelos
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * obtener carrito del usuario autenticado
 * GET /api/carrito
 * @param {Object} req request de Express con req.usuario del middleware
 * @param {Object} res response de Express
 */
const getCarrito = async (req, res) => {
    try {
        //obtener items del carrito con los productos relacionados
        const itemsCarrito = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: [ 'id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                    include: [
                        {
                            model: Categoria,
                            as: 'categoria',
                            attributes: ['id', 'nombre']
                        },
                        {
                            model: Subcategoria,
                            as: 'subcategoria',
                            attributes: ['id', 'nombre']
                        },
                    ]
                }
            ],
            order: (('createAt', 'DESC'))
        });

        //Calcular el total del carrito
        let totalCarrito = 0;
        itemsCarrito.forEach(item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //respiuesta exitosa
        res.json({
            success: true,
            data: {
                items: itemsCarrito,
                resumen: {
                    totaItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                    totalCarrito: total.toFixed(2)
                }
            }
        });
    }
}
