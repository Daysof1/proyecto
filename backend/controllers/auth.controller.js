/**
 * Controlador de autenticacion
 * maneja el registro, login y autenticacion del perfil del usuario
 */

/**
 * Importar modelos
 */

const Usuario = require('../models/Usuario');
const { generateToken } = require('../config/jwt');


/**
 * obtener todaos los usuarios
 * GET /api/usuarios
 * query params:
 * Activo true/false (filtrar por estado)
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion } = req.query

        //validacion 1 verificar que todos los campos requeridos esten presentes
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, apellido, email y password son obligatoris'
            });
        }

        //validacion 2 verificar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email invalido'
            });
        }

        //validacion 3 verificar la longitus de la contraseña
        if (!password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        //validacion 4 verificar que el email no este registrado
        const usuarioExistente = await Usuario.findOne({ where: { email }});
        if (!usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya esta registrado'
            });
        }

/**
el hook beforeCreate en el modelo se encarga de hashsear la contraseña amtes de guardarla
en el rol por defecto es cliente
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

        // Crear usuario
        const nuevaUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            telefono: telefono || null,
            direccion: direccion || null,
            rol: 'cliente' //rol por defecto
        });

        //generar Token JWT con datos del usuario
        const token = generarToken({
            id: nuevaUsuario.id,
            email: nuevaUsuario.email,
            rol: nuevaUsuario.rol
        });

        //Respuesta exitosa
        const usuarioRespuesta = nuevaUsuario.toJson();
        delete usuarioRespuesta.password; //elimina el campo de contraseña
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                usuario:usuarioRespuesta,
                token
            }
        });
    } catch (error) {
        console.error('Error en register: ', error);
        res.status(400).json({
                success: false,
                message: 'Error al register usuario',
                errors: error.message
        });
    }
};

/**
 * iniciar sesion login
 * Autentica un usuario con email y contraseña
 * retorna el usuario y un token JWT i las credenciales son correcatas
 * POST /api/auth/login
 * body: { email, password}
 */
const login = async (req, res) => {
    try {
        //Extraer credenciales del body
        const { email, password } = req.body;

        //validacion 1: verificar qe se proporcionaron email y password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        //validacion 2: buscar usuario por email
        //necesitamos incluir el password aqui normalmente se excluye por seguridad
        const usuario = await Usuario.scope('withPassword').findOne({
            where: { email }
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        //validacion 3 verificar que el suario este activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo, contacte al administrador'
            });
        }

        //validacion 4: verificar la contraseña 
        //usamos el metodo compararPassword del modelo usuario
        const passwordValida = await usuario.compararpassword(password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'credenciales invalidas'
            });
        }

        //Generar token JWT con datos basicos del usuario
        const token = generateToken({
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        });

        //preparar respuesta sin password
        const usuarioSinPassword = usuario.toJSON();
        delete usuarioSinPassword.password;

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Inicio de sesion exitoso',
            data: {
                usuario: usuarioSinPassword,
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion',
            error: error.message
        })
    }
};

/**
 * Ontener perfil del usuario autenticado
 * require middleware verificarAuth
 * get /api/auth/me
 * headers: { Authorization: 'Bearer TOKEN' }
 */

const getMe = async (req, res) => {
    try {
        //El usuario ya esta en req.usuario 
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: { exclude: ['password']}
        });

        if (!usuario) {
            return res.status(404).json({
                succes: false,
                message: 'usuario no encontrado'
            });
        }

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                usuario
            }
        });
    } catch (error) {
        console.error('Error en getMe', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        })
    }
};

/**
 * Actualizar perfil de usuario autenticado
 * permite al usuario actualizar su informacion personal
 * PUT /api/auth/me
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const updateMe = async (req, res) => {
    try {
        const { nombre, apellido, telefono, direccion } = req.body;

        //Buscar usuario
       const usuario = await Usuario.findByPk(req.usuario.id);

       if(!usuario) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrada'
            });
        }

        //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

        //guardar cambios
        await usuario.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamnete',
            data: {
                usuario: usuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en updateMe: ', error);
            return res.status(400).json({
                success: false,
                message: 'Error al actualizar perfil',
                error: error.message
        });
    }
};

/**
 * Cambiar la contraseña del usuario atenticado
 * permite al usuario cambiar su contraseña
 * requiere su contraseña actual por seguridad
 * PUT /api/auth/change-password
 */

const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        //validacion 1: verificar que se proporcionaron ambas contraseñas
        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere contraseña actual y nueva contraseña'
            });
        }

        //validacion 2: verificar que se proporcionaron ambas contraseñas
        if (!passwordActual.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual debe tener al menos 6 caracteres'
            });
        }

        //validacion 3: buscar usuario con password incluido
        const usuario = await Usuario.scope('withPassword').findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //validacion 4: verificar que la contraseña acyual sea correcta
        const passwordValida = await usuario.compararPassword(passwordActual);
        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        //actualizar contraseña
        usuario.password = passwordNueva;
        await usuario.save();

        //Respuesta exitosa

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch(error) {
        console.error('Error en changePassword: ',error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar contraseña',
            error: error.message
        })
    }
};
//Exportar todos los controladores
module.exports = {
    register,
    login,
    getMe,
    updateMe,
    changePassword
};