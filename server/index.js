const express = require('express');
const multer = require('multer');

const app = new express();
const uplaod = multer({ dest: 'upload/' });

app.post('/api/upload', uplaod.single('image'), (req, res) => {
  console.log(req.file);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.send('ok');
});

app.listen(3000, () => {
  console.log('server start at port 3000!')
});