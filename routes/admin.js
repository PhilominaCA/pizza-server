var express = require('express');
var router = express.Router();
const { MongoClient, dbName } = require('../dbSchema')
const {encryptedPassword,decryptComparePassword,createToken,sessionToken} = require('../authenticate')

router.get('/view-order/:token', async (req, res) => {
    const client = await MongoClient.connect(process.env.MONGODB_URL)
    try {
      let dbClient =  await client.db(dbName)
    //   let decodedToken = JWTD(req.params.token);
      let orderDetails = await dbClient.collection('order').find({}).toArray();
      if (orderDetails.length > 0) {
        res.json({
          statusCode: 200,
          body: orderDetails
        })
      }
      else {
        res.json({
          statusCode: 400,
          message: "No orders yet!"
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

router.post('/order-status/:token', async (req, res) => {
    const client = await MongoClient.connect(process.env.MONGODB_URL)
    try {
      let dbClient =  await client.db(dbName)
     // let decodedToken = JWTD(req.params.token);
      let orderDetails = await dbClient.collection('order').findOne({email: decodedToken.email })
    
    //   if(orderDetails.order.orderId === req.body.orderId){}
 const updatedOrder =  orderDetails.orders.map((e,i)=>{if(e.orderId === req.body.orderId){e.status =[...e.status,req.body.status]}})
    //   const {items,cartTotal} = req.body.cart;
    //   const newOrder = {items,orderTotal:cartTotal,orderStatus:"Order Placed",date:new Date()}
    //   await dbClient.collection('pizza').updateOne( { $text: { $search: items.name } },{$set:{"availability":}} )
//     const stock =   
// items.map(({name,amount})=>{
// const itemRecord = await dbClient.collection('pizza').find({name:itemRecord.name} )//{ $text: { $search: items.name } })
// await dbClient.collection('pizza').updateOne( { name:itemRecord.name } ,{$set:{"availability" :itemRecord.availability-1}})
// }) 
//  if(stock.varieties.vegPizzas.name == items.name){}
//  else{}
    if (orderDetails.length > 0) {
        //   let updadedItems = [...orderDetails.orders,newOrder];
        await dbClient.collection('order').updateOne({ email: decodedToken.email },{ $set: { "orders" : updatedOrder}})
        res.json({
          statusCode: 200,
          message: "Order status changed successfully"
        })
      }
    //   else {
    //     const updatedOrder = {
    //         email: decodedToken.email,
    //       orders:[newOrder],
    //     }
    //     await dbClient.collection('cart').insertOne(updatedOrder);
    //     res.json({
    //         statusCode: 200,
    //         message: "Procced to Payment"
    //       })
    // }
      }
    catch (error) {
      console.log(error)
      res.json({
        statusCode: 500,
        message: "Internal Server Error"
      })
    }
  })
