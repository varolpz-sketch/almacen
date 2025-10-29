const express = require('express');
const router = express.Router();
const { verificaToken } = require('../middlewares/autenticacion');
const { pool } = require('../config/db');

router.get('/categorias',[verificaToken], function (req, res) {
    const text = `select distinct categoria from tbl_categoria where activo=true order by 1`;
    pool.query(text, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});