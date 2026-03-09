/**
 * middleware de verificar roles
 * este middleware verifica que en usuario tenga un rol requerido
 * debe usarse despues de middleware de autenticacion
 */

const esAdministrador = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.estatus(401).json({
                success: false,
                message: 'Usuario no autenticado por favor iniciar sesion'
            });
        }

        //verificar que el rol es administrador
        if (!req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado se requiere permisos del administrador'
            });
        }

        // El usuario es administrador continuear
        next();

    } catch (error) {
        console.error('Error en middleware esAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar si el usuario es cliente
 */
const esCliente = (req, res, next) => {
    try {
        //verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.estatus(401).json({
                success: false,
                message: 'Usuario no autenticado por favor iniciar sesion'
            });
        }

        //verificar que el rol es cliente
        if (!req.usuario.rol !== 'cliente') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado se requiere permisos de cliente'
            });
        }

        // El usuario es cliente continuear
        next();

    } catch (error) {
        console.error('Error en middleware esCliente', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};
/**
 * middleware flexible para verificar multiples roles
 * permite verificar varios roles validos
 * util para cuando una ruta tiene varios roles permitidos
 */
const tieneRol = (req, res, next) => {
    return (req, res, next) => {
        try {
            //verificar que exuite req.usuario (viene de la autenticacion)
            if (!req.usuario) {
                return res.estatus(401).json({
                    success: false,
                    message: 'Usuario no autenticado por favor iniciar sesion'
                });
            }

            //verificar que el usuario esta en la lista de roles permitidos
            if (!req.rolesPermitidos.include (req.usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
                });
            }

            // El usuariotiene un rol permitido continuar
            next();

        } catch (error) {
            console.error('Error en middleware tieneRol', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
                error: error.message
            });
        }
    };
};

/**
 * Middlewar para verificar que el usuario accede a sus propios datos
 * verifica que ele usuarioid en los parametros coinciden con el usuario autenticado
 */

const esPropioUsuarioOAdmin = (req, res, next) => {
    try {
        //verificar que exuite req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.estatus(401).json({
                success: false,
                message: 'Usuario no autenticado por favor iniciar sesion'
            });
        }

        //Los administradores oueden acceder a datos de cualquier usuario
        if (req.usuario.rol === 'administrador') {
            return next();
        }

        //Obtener el usuarioId de los parametros de la ruta
        const usuarioIdParam = req.params.usuarioId || req.params.id;

        //Verificar que el usuarioId coincide con el usuario autenticado
        if (parseInt(usuarioIdParam) !== req.usuario) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado no puedes acceder a datos de otros usuarios'
            });
        }

        // El usuario accede a sus propios datos continuar
        next();

    } catch (error) {
        console.error('Error en muiddleware ePropioUsuarioOAdmin', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar que ek usuario es administrador o auxiliar
 * permite al acceso a usuarios conn el rol administrador o auxiliar
 */

const esAdminOAuxiliar = (req, res, next) => {
    try {

        if (!req.usuario) {
            return res.estatus(401).json({
                success: false,
                message: 'Usuario no autenticado por favor iniciar sesion'
            });
        }

        //verificar que el rol es administrador o auxiliar
        if (!['administrador', 'auxiliar'].includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado se requiere permisos de administrador o auxiliar'
            });
        }

        // El usuario es administrador o auxiliar continuar
        next();

    } catch (error) {
        console.error('Error en muiddleware esAdminOAuxiliar', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar qye el usuario es solo administrador no auxiliar
 * bloquea el acceso a aperaciones como eliminicar
 */

const soloAdministrador = (req, res, next) => {
    try {
        //verificar que exuite req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.estatus(401).json({
                success: false,
                message: 'Usuario no autenticado por favor iniciar sesion'
            });
        }

        //verificar que el rol es administrador
        if (!req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado solo administradores pueden realizar esta operacion'
            });
        }

        // El usuario es administrador continuar
        next();

    } catch (error) {
        console.error('Error en muiddleware soloAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

//exportar los middlewares
module.exports = {
    esAdministrador,
    esCliente,
    tieneRol,
    esPropioUsuarioOAdmin,
    esAdminOAuxiliar,
    soloAdministrador
};