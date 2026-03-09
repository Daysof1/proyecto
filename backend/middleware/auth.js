/**
 * middleware de autenticacion JWT
 * este archivo se verificaque el usuario tenga un token valido
 * se usa para las rutas protegidas que requieran autenticacion
 */


//importar funciones de JWT
const jwt = { verifyToken, extractToken } = require('../config/jwt');

const { error } = require('node:console');
const { extractToken, verifyToken } = require('../config/jwt');
//importar modelo de usuario
const Usuario = require('../models/Usuario');

//middleware de autenticaion

const verificarAuth = async (req, res, next) => {
    try {
        //paso 1 obtener el token del header Authorization
        const authHeader = req.header = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No se proporciono token de autenticacion'
            });
        }

        //Extraer el token quitar Bearer
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticacion invalido'
            });
        }

        //paso 2 verificar que el token es valido
        let decoded; //funcion para decodificar le token
        try {
            decoded = verificarToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message //token expirado o invalido
            });
        }

        //buscar el usuario en la base de datos
        const usuario = await Usuario.findById(decoded.id, {
            attributes: { exclude: ['password'] }//no incluir la contraseña en la respuesta
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //paso 4 verificar que el usuario este activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo ocontacte al administrador'
            });
        }

        //paso 5 Agregar el usuario al objeto req para uso posterios
        //ahora en los controladores podemos acceder a req.usuario

        // continuar con el siguiente
        next();

    } catch (error) {
        console.error ('Error en middleware de autenticacion', error);
        return res.status(500).json({
            success: false,
            message: 'Error en la verificación de autenticación',
            error: error.message
        });
    }
};
/**
 * middleware opcional de autenticacion
 * similar a verificarAuth pero no retorna error si no hay token
 * es para rutas que no requieren autenticacopn
 */

const verificarAuthOpcional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        //si no hay token continuar sin usarlo
        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);

        if (!token) {
            req.usuario = null;
            return next();
        }

        try {
            const decoded = verifyToken(token);
            const usuario = await Usuario.findById(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (usuario && usuario.activo) {
                req.usuario = usuario;
            } else {
                req.usuario = null;
            }
        } catch (error) {
            //Token invalido o expiradi continuar sin usuario
            req.usuario = null;
        }

        next();
    } catch (error) {
        console.error('Error en middleeare de autenticacion opcional', error);
        req.usuario = null;
        next();
    }
};

//Exportar middleware
module.exports = {
    verificarAuth,
    verificarAuthOpcional
}