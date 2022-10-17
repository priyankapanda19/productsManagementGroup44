const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer')
const PORT = process.env.PORT || 3000;
const route = require("./routes/route")

const app = express();

app.use(express.json());
app.use(multer().any());


mongoose.connect("mongodb+srv://rahul:rahul123@cluster0.ghayzlv.mongodb.net/group-44?retryWrites=true&w=majority", {
  useNewUrlParser: true
})
  .then(() => console.log("mongoDb is connected"))
  .catch(err => console.log(err))
  
  app.use('/', route)
  
  app.listen(PORT, () => { console.log(`express app running on port ${PORT}`) })
  