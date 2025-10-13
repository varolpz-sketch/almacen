const express = require('express');
const router = express.Router();
const multer  = require('multer')
const { verificaToken } = require('../middlewares/autenticacion');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');

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
router.post('/addCategoria',[verificaToken], function (req, res) {
    const text = `INSERT INTO tbl_categoria(categoria, descripcion, icono, activo, usucre)
        VALUES ('${req.body.categoria}', '', ${req.body.icono}, true, '${req.body.logb}') RETURNING *`;
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
        join tbl_producto tp on tc.categoria=tp.categoria
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
            ${req.body.precio}, true, '${req.body.logb}') RETURNING *`;
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
    const text = `select id_producto,categoria,marca,producto,unidad,contenido,precio::float,stock,minimo from tbl_producto 
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

router.get('/listProductoId/:categoria',[verificaToken], function (req, res) {
    const text = `select id_producto,categoria,marca,producto,unidad,contenido,precio::float,stock,minimo from tbl_producto 
        where activo=true and categoria='${req.params.categoria}' order by producto`;
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
    const text = `select id_producto,categoria,marca,producto,unidad,contenido,precio::float,stock,minimo from tbl_producto 
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

/* COMPRA */
router.post('/addCompra',[verificaToken], function (req, res) {
    const text = `select * from guardar_compra(${req.body.idProducto},${req.body.cantidad},${req.body.precio},${req.body.precioSugerido},'${req.body.fecha}','${req.body.logb}')`;
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

router.put('/updateVenta/:id',[verificaToken], function (req, res) {
    const text = `select * from modificar_datos(${req.params.id},'${req.body.logb}')`;
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

router.get('/listVenta/:dia/:mes/:gestion',[verificaToken], function (req, res) {
    const text = `select id_venta,total::float,descripcion,descuento::float,tipo::text,feccre::date::text as fecha from tbl_venta 
        where activo=true and usucre='${req.body.logb}' and feccre::date::text='${req.params.gestion}-${req.params.mes}-${req.params.dia}'::text`;

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
