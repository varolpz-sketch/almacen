const express = require('express')
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verificaToken } = require('../middlewares/autenticacion');
const { pool } = require('../config/db');

router.post('/signup', function(req, res) {
    if (!req.body.id_departamento || !req.body.login || !req.body.password || !req.body.nombre) {
        return res.status(400).json({ msg: 'Porfavor introduzca el Usuario y Contraseña' })
    } else {
        const query = {
            text: 'INSERT INTO public.seg_usuario (id_departamento, login, password, nombre, usucre) VALUES($1, $2, $3, $4, $5)',
            values: [req.body.id_departamento, req.body.login, bcrypt.hashSync(req.body.password, 10), req.body.nombre, req.body.usucre],
        }
        pool.query(query)
            .then(result => res.status(200).json({
                usuario: req.body.login,
                nombre: req.body.nombre,
                departamento: req.body.id_departamento
            }))
            .catch(e => console.error(e.stack))
            .then(() => pool.end())
    }
});

router.post('/signin', function(req, res) {
    if (!req.body.login || !req.body.password) {
        res.status(400).json({ msg: 'Porfavor introduzca el Usuario y Contraseña' })
    } else {
        const query = `SELECT s.* FROM tbl_usuario s WHERE login='${req.body.login}' and s.activo=true`;
        console.log(query);
        pool.query(query, (err, result) => {
            if (err) throw err
            if (result.rowCount == 0) return res.status(400).json({ msg: 'Usuario no valido' })
            if (!bcrypt.compareSync(req.body.password, result.rows[0].password)) {
                return res.status(400).json({ msg: 'Contraseña no valido' })
            }

	    let generador=result.rows[0];
            delete generador.password;
            let token = jwt.sign({
                usuario: generador
            }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });
        
            return res.status(200).json({
                login: req.body.login,
                usuario: generador,
                token
            })
        })

    }
});

router.get('/renew', verificaToken, function (req, res) {
    const { token } = req.headers;
    var payload = jwt.decode(token, process.env.SEED);
    const { usuario } = payload;
    res.json({
        usuario: usuario,
        token: token,
        menu: usuario.menu
    });    
});

module.exports = router;