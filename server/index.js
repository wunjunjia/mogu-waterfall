const express = require('express')
const axios = require('axios')

const app = new express()

app.use('/api/data', (req, res) => {
  
})

app.listen(3000, () => {
  console.log('server start at port 3000!')
})