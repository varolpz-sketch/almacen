const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');

const indexRouter = require(path.join(__dirname, 'server/routes', 'index'));
const loginRouter = require(path.join(__dirname, 'server/routes', 'login'));
const movilRouter = require(path.join(__dirname, 'server/routes', 'movil'));

const app = express();
let server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/movil', movilRouter);

server.prependListener("request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
});

server.listen(process.env.PORT, () => {
  console.log(`✅ Servidor en puerto ${process.env.PORT}`);
});