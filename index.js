require('dotenv').config();
const express = require('express');
const app = express();
const db = require(__dirname + '/modules/db_connect');
// app.set('view engine', 'ejs')
const cors = require('cors');
const multer = require('multer');

// top middleware
app.use(cors());
// header 解析
app.use(express.urlencoded({ extended: false }));
// 解析 JSON
app.use(express.json());
// 解析Form表單
app.post(multer().none(), async (req, res, next) => {
  next();
});

app.get('/', (req, res, next) => {
  res.json('<h2>首頁</h2>');
});

// 以下新增路由 (請做備註)

//裕庭新增商品路由
const productRouter = require(__dirname + '/routes/product');
app.use('/product', productRouter);

// --------404-------------

app.use((req, res) => {
  res.status(404).send('Error! NOT FOUND');
});

const port = process.env.SERVER_PORT || 6002;

app.listen(port, () => console.log(`server started, port:${port}`));
