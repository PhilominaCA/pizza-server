var express = require('express');
var router = express.Router();
const { MongoClient, dbName } = require('../dbSchema')
// const {encryptedPassword,decryptComparePassword,createToken,sessionToken} = require('../authenticate')

require('dotenv').config()

router.get('/get-menu', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let menuDetails = await dbClient.collection('pizza').find({}).toArray();
    // console.log(menuDetails)
    if (menuDetails.length > 0) {
      res.json({
        statusCode: 200,
        data: menuDetails
      })
    }
    else {
      res.json({
        statusCode: 400,
        message: "No records found!"
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

router.post('/new-item', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let itemDetails = await dbClient.collection('pizza').find({ name: req.body.name }).toArray();
    if (itemDetails.length > 0) {
      res.json({
        statusCode: 400,
        message: "Item Already Exists"
      })
    }
    else {
      const {name,amount,image,variety,availability} = req.body;
      const itemDetails ={
        name,amount,image,variety,availability
      }
      await dbClient.collection('pizza').insertOne(itemDetails);
      res.json({
        statusCode: 200,
        message: "Item added successfully",
         body:itemDetails
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

// router.post('/add-cart/:token/:id', async (req, res) => {
//     const client = await MongoClient.connect(process.env.MONGODB_URL)
//     try {
//       let dbClient =  await client.db(dbName)
//       let decodedToken = JWTD(req.params.token);
//       let cartDetails = await dbClient.collection('cart').findOne({email: decodedToken.email })
//       let vCount=0,nvCount=0;
//       if(req.params.id == 3)
//       vCount++;
//       if(req.params.id == 4)
//       nvCount++;
//       const {name,amount} = req.body.item;
//       if (cartDetails.length > 0) {
//           let updadedItems = [...cartDetails.items,{name,amount}];
//           let newTotal =0;
//           if((req.params.id == 3 && cartDetails.vegCount<2) || (req.params.id == 4 && cartDetails.nonVegCount<1))
//            newTotal = parseInt(cartDetails.cartTotal)+ 0 ;
// else
//            newTotal = parseInt(cartDetails.cartTotal)+parseInt(amount);
//         await dbClient.collection('cart').updateOne({ email: decodedToken.email },{ $set: { "items" : updadedItems , "cartTotal":newTotal,"vegCount":cartDetails.vegCount+vCount,"nonVegCount":cartDetails.nonVegCount+nvCount}})
//         res.json({
//           statusCode: 200,
//           message: "Item added to cart successfully!"
//         })
//       }
//       else {
//         const newCart = {
//             email: decodedToken.email,
//           items:[{name,amount}],
//           cartTotal:amount
//         }
//         await dbClient.collection('cart').insertOne(newCart);
//         res.json({
//             statusCode: 200,
//             message: "Item added to cart successfully!"
//           })
//     }
//       }
//     catch (error) {
//       console.log(error)
//       res.json({
//         statusCode: 500,
//         message: "Internal Server Error"
//       })
//     }
//   })

// router.get('/view-cart/:token', async (req, res) => {
//     const client = await MongoClient.connect(process.env.MONGODB_URL)
//     try {
//       let dbClient =  await client.db(dbName)
//       let decodedToken = JWTD(req.params.token);
//       let cartDetails = await dbClient.collection('cart').findOne({email: decodedToken.email })
//       if (cartDetails.length > 0) {
//         res.json({
//           statusCode: 200,
//           body: cartDetails
//         })
//       }
//       else {
//         res.json({
//           statusCode: 400,
//           message: "Your Cart is Empty!"
//         })
//       }
//     }
//     catch (error) {
//       console.log(error)
//       res.json({
//         statusCode: 500,
//         message: "Internal Server Error"
//       })
//     }
//   })

// router.post('/place-order/:token', async (req, res) => {
//     const client = await MongoClient.connect(process.env.MONGODB_URL)
//     try {
//       let dbClient =  await client.db(dbName)
//       let decodedToken = JWTD(req.params.token);
//       let orderDetails = await dbClient.collection('order').findOne({email: decodedToken.email })
//       const {items,cartTotal} = req.body.cart;
//     //   await dbClient.collection('pizza').updateOne( { $text: { $search: items.name } },{$set:{"availability":}} )
// //     const stock =   
// items.map(({name,amount})=>{
// const itemRecord = dbClient.collection('pizza').find({name:name} )//{ $text: { $search: items.name } })
//  dbClient.collection('pizza').updateOne( { name:itemRecord.name } ,{$set:{"availability" :itemRecord.availability-1}})
// }) 
// //  if(stock.varieties.vegPizzas.name == items.name){}
// //  else{}
//     if (orderDetails.length > 0) {
//         const newOrder = {order_id:"O"+orderDetails.orders.length,items,orderTotal:cartTotal,orderStatus:["Order Placed"],date:new Date()}
//           let updadedItems = [...orderDetails.orders,newOrder];
//         await dbClient.collection('order').updateOne({ email: decodedToken.email },{ $set: { "orders" : updadedItems}})
//         res.json({
//           statusCode: 200,
//           message: "Procced to Payment"
//         })
//       }
//       else {
//         const updatedOrder = {
//             email: decodedToken.email,
//           orders:[ {order_id:"O1",items,orderTotal:cartTotal,orderStatus:"Order Placed",date:new Date()}
//         ],
//         }
//         await dbClient.collection('cart').insertOne(updatedOrder);
//         res.json({
//             statusCode: 200,
//             message: "Procced to Payment"
//           })
//     }
//       }
//     catch (error) {
//       console.log(error)
//       res.json({
//         statusCode: 500,
//         message: "Internal Server Error"
//       })
//     }
//   })

//   router.get('/view-order/:token', async (req, res) => {
//     const client = await MongoClient.connect(process.env.MONGODB_URL)
//     try {
//       let dbClient =  await client.db(dbName)
//        let decodedToken = JWTD(req.params.token);
//       let orderDetails = await dbClient.collection('order').findOne({email:decodedToken.email});
//       if (orderDetails.length > 0) {
//         res.json({
//           statusCode: 200,
//           body: orderDetails
//         })
//       }
//       else {
//         res.json({
//           statusCode: 400,
//           message: "No orders yet!"
//         })
//       }
//     }
//     catch (error) {
//       console.log(error)
//       res.json({
//         statusCode: 500,
//         message: "Internal Server Error"
//       })
//     }
//   })
module.exports = router;
