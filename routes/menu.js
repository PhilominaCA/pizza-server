var express = require('express');
var router = express.Router();
const { MongoClient, dbName } = require('../dbSchema')
const JWTD = require('jwt-decode');
const {encryptedPassword,decryptComparePassword,createToken,sessionToken} = require('../authenticate')

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
        body: menuDetails
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

router.get('/get-custom-menu', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let menuDetails = await dbClient.collection('pizza').find({variety:"customPizza"}).toArray();
    // console.log(menuDetails)
    if (menuDetails.length > 0) {
      res.json({
        statusCode: 200,
        body: menuDetails
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

router.post('/add-cart/:token', async (req, res) => {
    const client = await MongoClient.connect(process.env.MONGODB_URL)
    try {
      let dbClient =  await client.db(dbName)
      let decodedToken = JWTD(req.params.token);
      let cartDetails = await dbClient.collection('cart').findOne({email: decodedToken.email })
      const {name,amount,image,category,variety} = req.body;
      if (cartDetails && cartDetails.items.length>0) {
        let itemNameMatch = await cartDetails.items.filter((e)=> e.name == name);
if(itemNameMatch.length>0)
{
  res.json({
    statusCode: 200,
    message: "Item already in cart!"
  })
}
else{
        let veggiesCount = await cartDetails.items.filter((e)=> e.category =='veggies').length;
let meatCount = await cartDetails.items.filter((e)=> e.category =='meat').length;
          let updadedItems = [...cartDetails.items,{name,amount,image,category,variety,quantity:1}];
          let newTotal =0;
          if((veggiesCount<3 && category == "veggies") || (meatCount<1 && category=="meat"))
           newTotal = parseInt(cartDetails.cartTotal)+ 0 ;
else
           newTotal = parseInt(cartDetails.cartTotal)+parseInt(amount);
        await dbClient.collection('cart').updateOne({ email: decodedToken.email },{ $set: { "items" : updadedItems , "cartTotal":newTotal}})
        res.json({
          statusCode: 200,
          message: "Item added to cart successfully!"
        })
      }
    }
      else {
        await dbClient.collection('cart').deleteOne({ email: decodedToken.email })
        const newCart = {
            email: decodedToken.email,
          items:[{name,amount : parseInt(amount),image,variety,category,quantity:1}],
          cartTotal : parseInt(amount)
        }
        await dbClient.collection('cart').insertOne(newCart);
        res.json({
            statusCode: 200,
            message: "Cart created & Item added to cart successfully!"
          })
    }
      }
    catch (error) {
      console.log(error)
      res.json({
        statusCode: 500,
        message: "Invalid token / Internal Server Error , Please Login again and try"
      })
    }
  })

router.get('/view-cart/:token', async (req, res) => {
    const client = await MongoClient.connect(process.env.MONGODB_URL)
    try {
      let dbClient =  await client.db(dbName)
      let decodedToken = JWTD(req.params.token);
      let cartDetails = await dbClient.collection('cart').findOne({email: decodedToken.email })
      if (cartDetails) {
        res.json({
          statusCode: 200,
          body: cartDetails
        })
      }
      else {
        res.json({
          statusCode: 400,
          message: "Your Cart is Empty!"
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

router.post('/delete-item/:token', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient = await client.db(dbName)
    let decodedToken = JWTD(req.params.token);
    let cartDetails = await dbClient.collection('cart').findOne({ email: decodedToken.email })
    const { name, amount, category, quantity } = req.body;
    if (cartDetails) {
      let updatedItems = await cartDetails.items.filter((e) => e.name != name);
      let veggiesCount = await cartDetails.items.filter((e) => e.category == 'veggies').length;
      let meatCount = await cartDetails.items.filter((e) => e.category == 'meat').length;
      let updatedAmout = 0;
      if ((veggiesCount <= 3 && category == "veggies") || (meatCount <= 1 && category == "meat"))
        updatedAmout = parseInt(cartDetails.cartTotal) - 0;
      else
        updatedAmout = parseInt(cartDetails.cartTotal) - (parseInt(amount) * parseInt(quantity))
      if (updatedItems) {
        await dbClient.collection('cart').updateOne({ email: decodedToken.email }, { $set: { "items": [...updatedItems], "cartTotal": updatedAmout } })
        res.json({
          statusCode: 200,
          message: "Item deleted successfully!",
          body: updatedItems
        })
      }
      else {
        res.json({
          statusCode: 404,
          message: "No item found"
        })
      }
    }
    else {
      res.json({
        statusCode: 404,
        message: "No item found"
      })
    }
  }
  catch (error) {
    console.log(error)
    res.json({
      statusCode: 500,
      message: "Invalid token / Internal Server Error , Please Login again and try"
    })
  }
}) 

router.post('/quantity-update/:token', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient = await client.db(dbName)
    let decodedToken = JWTD(req.params.token);
    let cartDetails = await dbClient.collection('cart').findOne({ email: decodedToken.email })
    const { name, amount, quantity } = req.body;
    if (cartDetails) {
      let currentItem = await cartDetails.items.filter((e) => e.name == name);
      if (currentItem[0]) {
        const updatedAmout = parseInt(cartDetails.cartTotal) - parseInt(currentItem[0].quantity) * parseInt(currentItem[0].amount) + parseInt(quantity) * parseInt(amount);
        console.log(updatedAmout);
        const currIndex = cartDetails.items.map((e) => e.name).indexOf(currentItem[0].name);
        cartDetails.items[currIndex].quantity = quantity;
        await dbClient.collection('cart').updateOne({ email: decodedToken.email }, { $set: { "items": cartDetails.items, "cartTotal": updatedAmout } })
        res.json({
          statusCode: 200,
          message: "Quantity updated!"
        })
      }
      else {
        res.json({
          statusCode: 404,
          message: "No item found"
        })
      }
    }
    else {
      res.json({
        statusCode: 404,
        message: "No item found"
      })
    }
  }
  catch (error) {
    console.log(error)
    res.json({
      statusCode: 500,
      message: "Invalid token / Internal Server Error , Please Login again and try"
    })
  }
})
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
