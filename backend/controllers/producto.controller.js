/**
 * Controlador de productos
 * maneja las operaciones crud y activar y desativar productos
 * solo accesible por adminitradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

//importar path y fs para manejo de imagenes
const path = require('path');
const fs = require('fs');

/**
 * obtener todas los productos
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * subcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * Activo true/false (filtrar por estado activo o inactivo)
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductos = async (req, res) => {
    try {
        const {
            categoriaId,
            subcategoriaId, 
            activo, 
            conStock,
            buscar,
            pagina = 1,
            limite = 100
        } = req.query;

        //Construir filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = { [require('sequelize').Op.gt]: 0};

        //paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);

        // Opciones de consulta
        const opciones = {
            where,
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
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //obtener productos y total
        const { count, rows: productos } = await Producto.findAndCountAll(opciones);

        //Respuesta exitosa
        res.json({
            sucess: true,
            data: {
                productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalpagina: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error) {
        console.error('Error en getProductos: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener productos',
            error: error.message
        }]
    }
};

/**
 * obtener todas los productos por id
 * GET /api/admin/productos/:id
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductosById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar productos con relacion
        const producto = await Producto. findAll( id, {
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre', 'activo']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo']
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrado'
            });
        }

        // Respuesta Exitosa
        res.json({
            success: true,
            data: {
                producto
            }
        });


    } catch (error) {
        console.error('Error en getProductoById: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener producto',
            error: error.message
        }]
    }
};

/**
 * Crear un producto
 * POST /api/admin/productos
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;

        //validacion 1 verificar campos requeridos
        if (!nombre || !precio || !categoriaId || !subcategoriaId) {
            return res.status(400).json({
                success: false,
                message: 'Fatan campos requeridos, nombre, precio, categoriaId y subcategoriaId'
            });
        }
        /**
        //valida 2 si la categoria existe
        const categoria = await Categoria.findByPK(categoriaId);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la categoria con id ${categoriaId}`
            });
        }
        */
        // Validacion 2 verifica si la categoria esta activa
        const categoria = await Categoria.findByPK(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `La categoria no existe una categoria con id ${categoriaId}`
            });
        }
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria ${categoria.nombre} esta inactiva` 
            });
        }


        //valida 3 si la subcategoria existe y pertenece a una categoria
        const subcategoria = await Subcategoria.findByPK(categoriaId);

        if(!subcategoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la subcategoria con id ${subcategoriaId}`
            });
        }
        // Validacion 3 verifica si la subcategoria esta activa
        if (!subcategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subcategoria.nombre}" esta inactiva, activela primero`
            });
        }
        if(!subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria ${subcategoria.nombre} no pertenece a la categoria con id ${categoriaId}`
            });
        }
        //Validacion 4 perrecio
        if(parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe mayor a 0'
            });
        }

        if(parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock no puede ser negativo'
            });
        }

        //obteber imagen
        const imagen = req.file ? req.file.filename : null;
    
        // Crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la descripcion se establece como null
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoriaId: parseInt(categoriaId),
            subcategoriaId: parseInt(subcategoriaId),
            imagen,
            activo: true
        });

        // Recargar con relaciones
        await nuevoProducto.reload({
            include: [
                { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
                { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] },
            ]
        });
        
        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                producto: nuevoProducto
            }
        });

    } catch (error) {
        console.error('Error en crearProducto', error);

        //si hubo error eliminar la imagen subida
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar imagen: ', err);
            }
        }

        if (error.name === 'SequelizeValidationError') 
        {
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors: error.errors.map(e => e.message)
        });
    }
    res.status(500).json({
        success: false, 
        message: 'Error al crear producto',
        error: error.message
    })
}
};

/**
 * Actualizar producto
 * PUT /api/admin/prosuctos/:id
 * body: { nombre, descripcion, categoriaId, subcategoriaId }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;
        
        //Buscar producto
       const producto = await Producto.findByPK(id);

       if(!producto) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrada'
            });
        }
        if (categoriaId && categoriaId !== producto.productoId) {
            const nuevaCategoria = await Categoria.findByPK(categoriaId);

            if (nuevaCategoria) {
                return res.status(404).json({
                    success: false,
                    message: `No existe la categoria con id ${categoriaId}`
                });
            }

            if (!nuevaCategoria.activo) {
                return res.status(400).json({
                    sucess: false,
                    message: `La categoria ${nuevaCategoria.nombre} esta inactiva`
                });
            }
        }

        if (subcategoriaId && subcategoriaId !== producto.productoId) {
            const nuevaSubcategoria = await Subcategoria.findByPK(subcategoriaId);

            if (nuevaSubcategoria) {
                return res.status(404).json({
                    success: false,
                    message: `No existe la subcategoria con id ${subcategoriaId}`
                });
            }

            if (!nuevaSubcategoria.activo) {
                return res.status(400).json({
                    sucess: false,
                    message: `La Subcategoria ${nuevaSubcategoria.nombre} esta inactiva`
                });
            }
        }

        // validacion 1 si se cambia el nombre verificar que no exista 
        if (nombre && nombre !== producto.nombre ) {
            const categoriafinal = categoriaId || producto.productoId; //Si no se cambia la categoria usar la categoria actuañ

            const productoConMismoNombre = await Producto.findOne({ 
                where: { 
                    nombre, 
                    categoriaId: categoriafinal
                }
            });

            if (productoConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe un producto con el nombre "${nombre}" en esta categoria`
                });
            }
        }

        //Actualizar campos
        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (precio !== undefined) producto.precio = precio;
        if (stock !== undefined) producto.stock = stock;
        if (categoriaId !== undefined) producto.categoriaId = categoriaId;
        if (subcategoriaId !== undefined) producto.subcategoriaId = subcategoriaId;
        if (activo !== undefined) producto.activo = activo;

        //guardar cambios
        await producto.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Producto actualizada exitosamnete',
            data: {
                subcategoria
            }
        });

    } catch (error) {
        console.error('Error en actualizarSubcategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            sucess: false,
            message: 'error al actualizar producto',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar subcategoria
 * PATCH /api/admin/subcategorias/:id/estado
 * Al desacrivar una subcategorias se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleProducto = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const subcategoria = await Subcategoria.findByPK(id);

        if(!subcategoria) {
            return res.status(404).json({
                success: false, 
                message: 'Subategoria no encontrada'
            });
        }

        // Alternar estado activo
        const nuevoEstado = !subcategoria.activo;
        subcategoria.activo = nuevoEstado;

        // Guardar cambios
        await subcategoria.save();

        //Contar cuantos registros se afectaron 
        const productosAfectados = await Producto.count({ where: { subcategoriaId: id }
        });

        //Respuesta exitosa
        res.json({
            success: true,
            message: `Subategoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                subcategoria,
                productosAfectados
            }
        });
    } catch (error) {
        console.error ('Error en toggleSubategoria:', error);
        res.status(500).json({
            success: false,
            messsage: 'Error al cambiar estado de la subcategoria',
            error: error.message
        });
    }
};

/**
 * Eliminar subcategoria 
 * DELETE /api/admin/subcategorias/:id
 * Solo permite eliminar si no productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarProducto = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const subcategoria = await Subcategoria.findByPK(id);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        // Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { subcategoriaId: id}
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la subcategoria porque tiene ${productos} productos asociadas usa PATCH /api/admin/categorias/:id toggle para para desactivarla en lugar de eliminarla`
            });
        }

        //Eiminar subcategoria
        await subcategoria.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Subategoria eliminada exitosamente'
        });

    } catch (error) {
        console.error ('Error al eliminar subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar subcategoria', 
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de una categoria
 * GET /api/admin/subcategorias estadistucas
 * retorna
 * Total de subcategorias activas /inactivas
 * Total de productos activas /inactivas
 * valor total del inventario
 * stock total
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const getEstadisticasProducto = async (req, res)  => {
    try {
        const { id } = req.params;

        //Verificar que la subcategoria exista
        const subcategoria = await Subcategoria.findByPK(id [{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        }]);

        if (!subcategoria) {
            return res.status(404).json({
                sucess: false,
                message: 'Subcategoria no encontrada'
            });
        }

        // contar productos
        const totalProductos = await Producto.count({
            where: { subcategoriaId: id }
        });
        const productosActivos = await Producto.count({
            where: { subcategoriaId: id, activo: true }
        });

        // Obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: { subcategoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
        });

        //Respuesta exitosa

        res.json({
            success: true,
            data: {
                subcategoria: {
                    id: subcategoria.id,
                    nombre: subcategoria.nombre,
                    activo: subcategoria.activo,
                    categoria: subcategoria.categoriaId
                },
                estadisticas: {

                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                        inactivos: totalProductos - productosActivos
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2) //quitar los decimales
                    }
                }
            }

        });
    } catch(error) {
        console.error('Error en getEstadisticasSubcategoria: ',error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        })
    }
};
//Exportar todos los controladores
module.exports = {
    getSubategorias,
    getSubcategoriasById,
    crearSubcategoria,
    actualizarSubcategoria,
    toggleSubcategoria,
    eliminarSubcategoria,
    getEstadisticasSubcategoria
};