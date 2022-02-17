const rzp = new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_SECRET_KEY,
   })

   app.post('/orders', async (req, res) => {
    const options = {
        amount: req.body.amount,
        currency: 'INR',
        receipt: shortid.generate(), //any unique id
        payment_capture = 1 //optional
    }
    try {
        const response = await razorpay.orders.create(options)
        res.json({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount
        })
    } catch (error) {
        console.log(error);
        res.status(400).send('Unable to create order');
    }
})



const requestedBody = JSON.stringify(req.body)
const receivedSignature = req.headers['x-razorpay-signature']
const expectedSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(requestedBody).digest('hex')if (receivedSignature === expectedSignature) { 
    // Store in your DB
  } else {
   res.status(501).send('received but unverified resp')
  }

//    const rzpOrder = await rzp.orders.create({
//     amount: amount * 100, // rzp format with paise
//     currency: 'INR',
//     receipt: "receipt#1", //Receipt no that corresponds to this Order,
//     payment_capture: true,
//     notes: {
//      orderType: "Pre"
//     } //Key-value pair used to store additional information
//    })// To create recurring subscription
//    const subscriptionObject = {
//     plan_id: PLAN_ID,
//     total_count: 60,
//     quantity: 1,
//     customer_notify: 1,
//     notes,
//    }
//    const subscription = await rzp.subscriptions.create(subscriptionObject)