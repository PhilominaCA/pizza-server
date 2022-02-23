var express = require('express');
var router = express.Router();
const { MongoClient, dbName } = require('../dbSchema')
const JWTD = require('jwt-decode');

require('dotenv').config()

router.get('/view-order/:token', async (req, res) => {
    const client = await MongoClient.connect(process.env.MONGODB_URL)
    try {
      let dbClient =  await client.db(dbName)
      let decodedToken = JWTD(req.params.token);
      let orderDetails = await dbClient.collection('orders').findOne({email: decodedToken.email })
      if (orderDetails) {
        res.json({
          statusCode: 200,
          body: orderDetails
        })
      }
      else {
        res.json({
          statusCode: 400,
          message: "No Orders till date!"
        })
      }
    }
    catch (error) {
      console.log(error)
      res.json({
        statusCode: 500,
        message: "Internal Server Error"
      })
    }
  })