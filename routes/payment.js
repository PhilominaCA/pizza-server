var express = require('express');
var router = express.Router();
const Razorpay = require("razorpay");
// const crypto = require("crypto");
const { MongoClient, dbName } = require('../dbSchema')
const orderid = require('order-id')('key');

require('dotenv').config()

   router.post("/orders", async (req, res) => {
    try {
        const {amount} = req.body
        const instance = new Razorpay({
            key_id: process.env.RZP_KEY_ID,
            key_secret: process.env.RZP_SECRET_KEY,
        });

        const options = {
            amount: amount*100, // amount in smallest currency unit
            currency: "INR",
            receipt: "receipt_order_74394",
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).send("Some error occured");

        res.json(order);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

router.post("/success", async (req, res) => {
    try {
        // getting the details back from our font-end
        // const {
        //     orderCreationId,
        //     razorpayPaymentId,
        //     razorpayOrderId,
        //     // razorpaySignature,
        // } = req.body;

        // Creating our own digest
        // The format should be like this:
        // digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
        // const shasum = crypto.createHmac("sha256", "w2lBtgmeuDUfnJVp43UpcaiT");

        // shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

        // const digest = shasum.digest("hex");

        // comaparing our digest with the actual signature
        // if (digest !== razorpaySignature)
        //     return res.status(400).json({ msg: "Transaction not legit!" });

        // THE PAYMENT IS LEGIT & VERIFIED
        // YOU CAN SAVE THE DETAILS IN YOUR DATABASE IF YOU WANT
            const client = await MongoClient.connect(process.env.MONGODB_URL)
            try {
                const id = orderid.generate();
              let dbClient =  await client.db(dbName)
              let decodedToken = JWTD(req.params.token);
              let orderDetails = await dbClient.collection('orders').findOne({email: decodedToken.email })
              const {items,amount} = req.body;
              if (orderDetails) {
                  let updadedOrder = [...orderDetails.orders,{ orderID:orderid.getTime(id),items:items,orderTotal : parseInt(amount),tracking:["Order Placed"]}];
                await dbClient.collection('orders').updateOne({ email: decodedToken.email },{ $set: { "orders" : updadedOrder}})
                res.json({
                  statusCode: 200,
                  message: "Transaction successful! Order Placed Successfully"
                })
              }
            // }
              else {
                await dbClient.collection('orders').deleteOne({ email: decodedToken.email })
                const newOrder = {
                    email: decodedToken.email,
                  orders:[{orderID:orderid.getTime(id),items:items,orderTotal : parseInt(amount),tracking:["Order Placed"]}],
                }
                await dbClient.collection('orders').insertOne(newOrder);
                res.json({
                    statusCode: 200,
                    message: "Transaction successful! Order Placed Successfully"
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
          
        res.json({
            msg: "Transaction successful! Order Placed Successfully",
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});



module.exports = router;
