const express = require('express');
const router = express.Router();
const multer  = require('multer')
const { verificaToken } = require('../middlewares/autenticacion');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'server/documentos/');
    },
    filename: (req, file, cb) => {
        const { idProducto } = req.params; 
        const ext = path.extname(file.originalname); 
        cb(null, `${idProducto}${ext}`);
    },
});
const upload = multer({ storage });

/* DISTINCT */
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

router.get('/unidades',[verificaToken], function (req, res) {
    const text = `select distinct unidad from tbl_producto where activo=true order by 1`;
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

/* CATEGORIA */
router.put('/actualizarCategoria',[verificaToken], function (req, res) {
    const text = `UPDATE tbl_producto
        SET categoria='${req.body.uno}', usumod='${req.body.logb}', fecmod=(SELECT now() AT TIME ZONE 'America/La_Paz')
        WHERE id_producto = ANY(ARRAY[${req.body.idu}])`;
    pool.query(text, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: err.message,
            })
        }
        const text1 = `UPDATE tbl_producto
            SET categoria='${req.body.dos}', usumod='${req.body.logb}', fecmod=(SELECT now() AT TIME ZONE 'America/La_Paz')
            WHERE id_producto = ANY(ARRAY[${req.body.idd}])`;
        pool.query(text1, (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: err.message,
                })
            }
            return res.status(200).json('ok')
    })
    })
});

router.post('/addCategoria',[verificaToken], function (req, res) {
    const text = `INSERT INTO tbl_categoria(categoria, descripcion, icono, activo, usucre)
        VALUES ('${req.body.categoria}', '', ${req.body.icono}, true, '${req.body.logb}')`;
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

router.put('/updateCategoria',[verificaToken], function (req, res) {
    const text = `UPDATE tbl_categoria
        SET categoria='${req.body.categoria}', 
        icono=${req.body.icono}, 
        usumod= '${req.body.logb}', 
        fecmod=now()
        WHERE id_categoria=${req.body.idCategoria} RETURNING *`;
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

router.get('/listCategoria',[verificaToken], function (req, res) {
    const text = `select id_categoria,tc.categoria,descripcion,icono,count(*) as articulo from tbl_categoria tc
        left join tbl_producto tp on tc.categoria=tp.categoria
        group by id_categoria,tc.categoria,descripcion,icono
        order by tc.categoria`;
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

/* PRODUCTO */
router.post('/addProducto',[verificaToken], function (req, res) {
    const text = `INSERT INTO tbl_producto(categoria, marca, producto, unidad, contenido, precio, activo, usucre)
        VALUES ('${req.body.categoria}', '${req.body.marca}', '${req.body.producto}', '${req.body.unidad}', ${req.body.contenido}, 
            ${req.body.precio}, true, '${req.body.logb}') RETURNING id_producto`;
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

router.put('/updateProducto',[verificaToken], function (req, res) {
    const text = `UPDATE tbl_producto
        SET categoria='${req.body.categoria}', 
        marca='${req.body.marca}', 
        producto='${req.body.producto}', 
        unidad='${req.body.unidad}', 
        contenido= ${req.body.contenido}, 
        precio=${req.body.precio}, 
        usumod='${req.body.logb}', 
        fecmod=now()
        WHERE id_producto=${req.body.idProducto} RETURNING *`;
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

router.get('/listProducto/:id',[verificaToken], function (req, res) {
    const text = `select id_producto,categoria,marca,producto,unidad,contenido,precio::float,stock,(
        SELECT json_agg(json_build_object(
        'idCompra', c.id_compra,
        'lote', c.lote,
        'vencimiento', c.vencimiento::date::text) ORDER BY c.lote ASC)
        FROM tbl_compra c WHERE c.id_producto = tbl_producto.id_producto AND c.validar != 0
        ) AS lote from tbl_producto 
        where activo=true and case when 0=${req.params.id} then id_producto::text ilike '%%' else id_producto=${req.params.id} end order by categoria,producto`;
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

router.put('/deleteProducto/:id',[verificaToken], function (req, res) {
    const text = `UPDATE tbl_producto
        SET activo=false,
        usumod='${req.body.logb}', 
        fecmod=now()
        WHERE id_producto=${req.params.id} RETURNING *`;
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

//solo web//
router.get('/productoCategoria/:categoria',[verificaToken], function (req, res) {
    const text = `select id_producto,marca,producto from tbl_producto where activo=true and categoria='${req.params.categoria}' order by producto`;
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

//solo movil//
router.get('/listProductoId/:categoria',[verificaToken], function (req, res) {
    const text = `select id_producto,categoria,marca,producto,unidad,contenido,precio::float,stock,(
        SELECT json_agg(json_build_object(
        'idCompra', c.id_compra,
        'lote', c.lote,
        'vencimiento', c.vencimiento::date::text) ORDER BY c.lote ASC)
        FROM tbl_compra c WHERE c.id_producto = tbl_producto.id_producto AND c.validar != 0
        ) AS lote from tbl_producto 
        where activo=true and case when '0'='${req.params.categoria}' then categoria ilike '%%' else categoria='${req.params.categoria}' end
        order by categoria,producto`;
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

/* STOCK */
router.get('/listBajoStock',[verificaToken], function (req, res) {
    const text = `select id_producto,categoria,marca,producto,unidad,contenido,precio::float,stock from tbl_producto 
        where activo=true order by stock asc limit 10`;
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

/* DEVOLUCION */
router.get('/listDevolucion/:fecha',[verificaToken], function (req, res) {
    const text = `select id_venta,id_producto,producto,precio,unitario,cantidad,lote,usucre from tbl_devolucion 
        where feccre::date='${req.params.fecha}'::date
        and case when '0'='${req.body.depb}' then usucre ilike '%%' else usucre='${req.body.logb}' end
        order by id_venta,id_producto`;
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

/* COMPRA */
router.get('/listCompraId/:id',[verificaToken], function (req, res) {
    const text = `select lote,producto,tb.cantidad,tb.precio,tb.usucre from tbl_compra tb 
        join tbl_producto tp on tp.id_producto=tb.id_producto where tb.id_compra=${req.params.id}`;
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


router.get('/listCompra/:fecha',[verificaToken], function (req, res) {
    const text = `select id_compra,tb.id_producto,cantidad,tb.precio,precio_sugerido,vencimiento,tb.usucre,producto from tbl_compra tb
    join tbl_producto tp on tp.id_producto=tb.id_producto
    where tb.activo=true and tb.feccre::date='${req.params.fecha}'::date
    and case when '0'='${req.body.depb}' then tb.usucre ilike '%%' else tb.usucre='${req.body.logb}' end
    order by tb.id_compra`;
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

router.post('/addCompra',[verificaToken], function (req, res) {
    const text = `select * from guardar_compra(${req.body.idProducto},${req.body.cantidad},${req.body.precio},${req.body.precioSugerido},'${req.body.fecha}','${req.body.logb}')`;
    pool.query(text, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows[0])
    })
});

/* USUARIO */
router.get('/listUsuario',[verificaToken], function (req, res) {
    const text = `select id_usuario,login,nombre,id_departamento as rol,case when id_departamento='0' then 'Administrador' else 'Vendedor' end tipo from tbl_usuario
        where activo=true order by 1`;
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

router.put('/updateUsuario',[verificaToken], function (req, res) {
    const text = `UPDATE tbl_usuario
	SET nombre='${req.body.nombre}', id_departamento=${req.body.rol}, usumod='${req.body.logb}', fecmod=(SELECT now() AT TIME ZONE 'America/La_Paz')
	WHERE id_usuario=${req.body.id_usuario} returning *`;
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

router.put('/updateEstado',[verificaToken], function (req, res) {
    const text = `UPDATE tbl_usuario
	SET  activo=false, usumod='${req.body.logb}', fecmod=(SELECT now() AT TIME ZONE 'America/La_Paz')
	WHERE id_usuario=${req.body.id} returning *`;
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

router.put('/updatePass',[verificaToken], function (req, res) {
    const valor = bcrypt.hashSync(req.body.pass, 10);
    const text = `UPDATE tbl_usuario
	SET  password='${valor}',usumod='${req.body.logb}', fecmod=(SELECT now() AT TIME ZONE 'America/La_Paz')
	WHERE id_usuario=${req.body.id} returning *`;
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

router.post('/addUsuario',[verificaToken], function (req, res) {
    const valor = bcrypt.hashSync('123456', 10);
    const text = `INSERT INTO tbl_usuario(login, password, nombre, id_departamento, activo, usucre, feccre) 
    VALUES ('${req.body.login}','${valor}','${req.body.nombre}',${req.body.rol},true,'${req.body.logb}',(SELECT now() AT TIME ZONE 'America/La_Paz')) returning *`;
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

/* VENTA */
router.post('/addVenta',[verificaToken], function (req, res) {
    const text = `select * from guardar_datos(${req.body.total},'${JSON.stringify(req.body.descripcion)}',${req.body.descuento},'${req.body.tipo}','${req.body.logb}')`;
    pool.query(text, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows[0])
    })
});

router.put('/updateVenta',[verificaToken], function (req, res) {
    const text = `select * from modificar_datos(${req.body.idVenta},${req.body.total},'${JSON.stringify(req.body.descripcion)}',${req.body.descuento},'${req.body.tipo}','${req.body.logb}')`;
    pool.query(text, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows[0])
    })
});

router.get('/listVenta/:fecha',[verificaToken], function (req, res) {
    const text = `select id_venta,total::float,descripcion,descuento::float,tipo::text,feccre::date::text as fecha,usucre from tbl_venta 
        where activo=true and feccre::date='${req.params.fecha}'::date
        and case when '0'='${req.body.depb}' then usucre ilike '%%' else usucre='${req.body.logb}' end
        order by id_venta`;
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

router.get('/listVentaId/:id',[verificaToken], function (req, res) {
    const text = `select id_venta,total,descripcion,usucre from tbl_venta where id_venta=${req.params.id}`;
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

/* DESCRIPCION */
router.post('/addDescripcion',[verificaToken], function (req, res) {
    const text = `select * from guardar_devolucion(${req.body.idVenta},${req.body.idProducto},'${req.body.producto}',${req.body.precio},${req.body.unitario},${req.body.cantidad},${req.body.lote},'${req.body.logb}')`;
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

/* IMAGEN */
router.get('/verImagen/:nombre', (req, res)=>{ 
    if(fs.existsSync(path.join(__dirname, '../documentos', `${req.params.nombre}.jpg`))) {
      res.sendFile(path.join(__dirname, '../documentos', `${req.params.nombre}.jpg`));
    } else {
      res.json('No existe el documento');
    }
});

router.post('/uploadImagen/:idProducto', upload.single('imagen'), (req, res) => {
    const { idProducto } = req.params;  
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    return res.status(200).json({
      mensaje: 'Imagen subida correctamente',
      nombreArchivo: req.file.filename,
      idProducto: idProducto,
    });
});


module.exports = router;
