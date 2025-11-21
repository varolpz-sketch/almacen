const express = require('express');
const router = express.Router();
const { verificaToken } = require('../middlewares/autenticacion');
const { pool } = require('../config/db');

router.get('/listMaximo',[verificaToken], function (req, res) {
    const text = `SELECT producto,sum(cantidad) total FROM tbl_venta v
CROSS JOIN LATERAL json_to_recordset(v.descripcion) AS d("idProducto" text, producto text, precio numeric, unitario numeric, cantidad numeric)
WHERE v.activo = true group by producto order by total desc limit 10`;
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

router.get('/usuarioVenta',[verificaToken], function (req, res) {
    const text = `select string_agg('count(*) FILTER (WHERE usucre = '''||login||''') as '||login||'',',' order by login) from tbl_usuario where activo=true`;
    pool.query(text, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: err.message,
            })
        }
        const valor = result.rows[0].string_agg;
        const text1 = `select feccre::date,${valor} from tbl_venta where activo=true group by feccre::date order by feccre::date`;
        pool.query(text1, (err1, result1) => {
            if (err1) {
                return res.status(400).json({
                    ok: false,
                    message: err.message,
                })
            }            
            return res.status(200).send(result1.rows)
        })
    })
});

router.get('/semanaVenta',[verificaToken], function (req, res) {
    const text = `SELECT DATE_TRUNC('week', feccre)::date::text as variable,COUNT(*) FROM tbl_venta WHERE activo = true GROUP BY DATE_TRUNC('week', feccre) ORDER BY 1`;
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

router.get('/tipoVenta',[verificaToken], function (req, res) {
    const text = `select tipo,COUNT(*) FROM tbl_venta WHERE activo=true GROUP BY tipo ORDER BY 1`;
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


router.get('/reporteVenta/:fecha',[verificaToken], function (req, res) {
    const text = `SELECT id_venta,total,descuento,tipo,producto,precio,unitario,cantidad,usucre,feccre::date FROM tbl_venta v
        CROSS JOIN LATERAL json_to_recordset(v.descripcion) AS d("idProducto" text, producto text, precio numeric, unitario numeric, cantidad numeric)
        WHERE v.activo = true and feccre::date='${req.params.fecha}'::date
        order by feccre,id_venta,"idProducto"`;
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

module.exports = router;
