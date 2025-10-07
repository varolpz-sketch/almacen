const { response, request } = require('express');
const jwt = require('jsonwebtoken');

const verificaToken = async( req = request, res = response, next ) => {
    const authHeader = req.headers['authorization']; 
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            msg: 'El token no es valido'
        })
    }
    try {
        const valor = await jwt.verify(token,process.env.SEED);
        req.body.usub=valor['usuario'].id_usuario;
        req.body.depb=valor['usuario'].id_departamento;
        req.body.logb=valor['usuario'].login;
        next();     
    } catch (error) {
        return res.status(401).json({
            ok:false,
            msg: 'Token no válido'
        })
    }
}

module.exports = {
    verificaToken
}
