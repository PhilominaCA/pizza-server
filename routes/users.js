var express = require('express');
var router = express.Router();
var randomstring = require("randomstring");
const { MongoClient, dbName } = require('../dbSchema')
const {encryptedPassword,decryptComparePassword,createToken,sessionToken,createActivationToken} = require('../authenticate')
const sendgrid = require('@sendgrid/mail');
const JWTD = require('jwt-decode');

require('dotenv').config()

router.get('/get-users', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let userDetails = await dbClient.collection('pizzaUsers').find({}).toArray();
    if (userDetails.length > 0) {
      res.json({
        statusCode: 200,
        body: userDetails
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

router.post('/sign-up', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let userDetails = await dbClient.collection('pizzaUsers').find({ email: req.body.email }).toArray();
    if (userDetails.length > 0) {
      res.json({
        statusCode: 400,
        message: "User Already Exists"
      })
    }
    else {
      const {firstName,lastName,email,mobile,password,role} = req.body;
const hashedPassword = await encryptedPassword(password);
      const userDetails ={
        firstName,
        lastName,
        email,
        mobile,
        role,
        password : hashedPassword,
        activationStatus:false,
        resetPasswordToken:""
      }
      await dbClient.collection('pizzaUsers').insertOne(userDetails);
      res.json({
        statusCode: 200,
        message: "Great!, You will receive an account activation link via email",
         body:userDetails
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

router.post('/activation-email/:useremail', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let userDetails = await dbClient.collection('pizzaUsers').findOne({ email: req.params.useremail });
    if (userDetails) {
      let genUserToken = await createActivationToken(userDetails.email);
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
        to: userDetails.email,
        from: process.env.EMAIL,
        subject: 'Activation Link',
        html: `<p>Hi ${userDetails.firstName},</p>
       <p> Kindly click on the below link to activate your account.</p>
       <p> Account Activation Link : https://cranky-johnson-c08cde.netlify.app/account-activation/${genUserToken}</p><br/>
       <p>Thank you,</p>
        <p>NodeAuth Team</p>`,
     }
     sendgrid
        .send(msg)
        .then((resp) => {
          res.json({
            statusCode:200,
            message:"Account activation link sent via Email"
          })
        })
        .catch((error) => {
          res.json({
            statusCode:400,
            message:error
          })
      })
    }
  else{
    res.json({
      statusCode:404,
      message:"Invalid UserId"
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
//       <p> Account Activation Link : http://localhost:3000/account-activation/${genUserToken}</p><br/>

router.post('/account-activation/:token', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let decodedToken = JWTD(req.params.token);
    let userDetails = await dbClient.collection('pizzaUsers').findOne({email: decodedToken.email })
    if (userDetails) {
            await dbClient.collection('pizzaUsers').updateOne({ email: decodedToken.email },{ $set: { "activationStatus" : true}})
            res.json({
              statusCode: 200,
              message: "Account Activated Successfully!, Please try to Login now!",
               body:userDetails
            })
          }
  else{
    res.json({
      statusCode:404,
      message:"User Not Found!"
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

router.post('/login/:role', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let userDetails = await dbClient.collection('pizzaUsers').findOne({ email: req.body.email })
    if (userDetails) {
      let passwordCheck = await decryptComparePassword(req.body.password,userDetails.password); 
     if(passwordCheck)
     {
       console.log(userDetails.role,req.params.role)
      if(parseInt(userDetails.role) == parseInt(req.params.role))
      {
      let token  = await sessionToken(req.body.email,userDetails.role)
      res.json({
        statusCode: 200,
        message: "Login Successfull!",
        token
      })
    }
    else{
      res.json({
        statusCode:400,
        message:"You are not authorized"
      })
    }
  }
    else{
      res.json({
        statusCode:400,
        message:"Invalid Password"
      })
    }
  }
  else{
    res.json({
      statusCode:404,
      message:"Please enter a valid UserId"
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

router.post('/verify-login/:token', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let decodedToken = JWTD(req.params.token)
    if(new Date()/1000>decodedToken.exp){
                  res.json( {
                      statusCode:401,
                      message:"Link Expired!"
                  })
             }
    let userDetails = await dbClient.collection('pizzaUsers').findOne({email: decodedToken.email })
    if (userDetails) {
           res.json({
              statusCode: 200,
              message: "Has valid Token!",
               body:userDetails
            })
          }
  else{
    res.json({
      statusCode:404,
      message:"Login Expired!"
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

router.post('/forgot-password', async (req, res) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName)
    let userDetails = await dbClient.collection('pizzaUsers').findOne({ email: req.body.email });
    console.log(userDetails,req.body.email,req.body);
    if (userDetails) {
      let UserToken = randomstring.generate(15);
      let genUserToken = await createToken(UserToken,req.body.email);
      await dbClient.collection('pizzaUsers').updateOne({ email: req.body.email },{ $set: { "resetPasswordToken" : UserToken }})
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
        to: userDetails.email,
        from: process.env.EMAIL,
        subject: 'Password Reset Link',
        html: `<p>Hi ${userDetails.firstName},</p>
       <p> Kindly click on the below link to reset your password.</p>
       <p> Password Reset Link : https://cranky-johnson-c08cde.netlify.app/reset-password/${genUserToken}</p>
        <p><strong>Please not that this link will expire within 1 hour.</strong></p>
        <p>Thank you,</p>
        <p>NodeAuth Team</p>`,
     }
     sendgrid
        .send(msg)
        .then((resp) => {
          res.json({
            statusCode:200,
            message:"Email Sent Successfully, Reset your password now!"
          })
        })
        .catch((error) => {
          res.json({
            statusCode:400,
            message:error
          })
      })
    }
  else{
    res.json({
      statusCode:404,
      message:"Invalid UserId"
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

      //  <p> Password Reset Link : http://localhost:3000/reset-password/${genUserToken}</p>


router.post('/reset-password/:token', async (req, res,next) => {
  const client = await MongoClient.connect(process.env.MONGODB_URL)
  try {
    let dbClient =  await client.db(dbName);
    let decodedToken = JWTD(req.params.token);
    if((new Date()/10000)>decodedToken.exp){
                  res.json( {
                      statusCode:401,
                      message:"Link Expired!"
                  })
             }

    let userDetails = await dbClient.collection('pizzaUsers').findOne({ resetPasswordToken: decodedToken.userToken,email: decodedToken.email })
    if (userDetails) {
      console.log(userDetails)
      const {password} = req.body;
      const hashedPassword = await encryptedPassword(password);
            await dbClient.collection('pizzaUsers').updateOne({ resetPasswordToken: decodedToken.userToken,email: decodedToken.email },{ $set: { "password" : hashedPassword,"resetPasswordToken" :""}})
            res.json({
              statusCode: 200,
              message: "Password Reset Successful!, Try to login now",
               body:userDetails
            })
          }
  else{
    res.json({
      statusCode:404,
      message:"Token is not Valid!"
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

module.exports = router;


