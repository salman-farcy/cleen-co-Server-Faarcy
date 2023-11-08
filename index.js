const express = require('express')

//? Mongodb Require
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//!Jwt (jsonwebtoken) Require (JWT)
const jwt = require('jsonwebtoken');

//!Jwt cookiesParser Require (JWT)
const cookieParser = require('cookie-parser')

//?dotenv Require
require('dotenv').config()

var cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;


//!Pasesrs
app.use(express.json());
//!midelwers
app.use(cookieParser());
//!midelwers
app.use(
     cors({
          origin: 'http://localhost:5173',
          credentials: true
     }))


//? DB URI
const uri = `mongodb+srv://${process.env.SERVER_USER_NAME}:${process.env.SERVER_USER_PASSWORD}@cluster0.rb5g6hh.mongodb.net/CleenCoo?retryWrites=true&w=majority`;


//? MongoDB connection
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});


async function run() {
     try {
          // Connect the client to the server	(optional starting in v4.7)
          await client.connect();

          //? Connect Collection
          const serviceCollection = client.db('CleenCoo').collection('services')
          const bookingCollection = client.db('CleenCoo').collection('Bookings')


          //!verfy token and grant access / middlewares (JWT)
          const gateman = (req, res, next) => {
               const { token } = req.cookies

               //if client does not send token
               if (!token) {
                    return res.status(401).send({ message: "You are not authirized" })
               }

               // verify a token symmetric
               jwt.verify(token, process.env.SALMAN_SECRET_TOKEN, function (err, decoded) {
                    if (err) {
                         return res.status(401).send({ message: "You are not authirized" })
                    }

                    //attach decoded user others can get it
                    req.user = decoded;
                    next()
               });

          }

          //* GET services data
          app.get('/api/v1/services', gateman, async (req, res) => {
               const cursor = serviceCollection.find()
               const result = await cursor.toArray()

               res.send(result)
          })

          //* POST Bookings data
          app.post('/api/v1/user/create-booking', async (req, res) => {
               const booking = req.body;
               const result = await bookingCollection.insertOne(booking)
               res.send(result)
          })

          //* GET Bookings User specific  get
          app.get('/api/v1/user/bookings', gateman, async (req, res) => {
               const uaerEmail = req.query.email;
               const tokenEmail = req.user.email;

               // match user email to check it is a valid user
               if (uaerEmail !== tokenEmail) {
                    return res.status(403).send({message:'forbidden access'})
               }
               
               let query = {}
               if (uaerEmail) {
                    query.email = uaerEmail
               }

               const result = await bookingCollection.find(query).toArray()
               res.send(result)
          })

          //*DELET 
          app.delete('/api/v1/user/cancel-booking/:bookingId', async (req, res) => {
               const id = req.params.bookingId;
               const query = { _id: new ObjectId(id) }
               const result = await bookingCollection.deleteOne(query)
               res.send(result)
          })

          //!Auth JWT ROUTE (JWT)
          app.post('/api/v1/auth/access-token', (req, res) => {
               //creating token and to client
               const user = req.body
               const token = jwt.sign(user, process.env.SALMAN_SECRET_TOKEN, { expiresIn: '1h' })
               
               res.cookie("token", token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "none"
               }).send({ success: true })
          })

          // Send a ping to confirm a successful connection
          await client.db("admin").command({ ping: 1 });
          console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
          // Ensures that the client will close when you finish/error
          // await client.close();
     }
}
run().catch(console.dir);

// * server create
app.get('/', (req, res) => {
     res.send('Hello World!')
})

app.listen(port, () => {
     console.log(`Cleen con server is port ${port}`)
})









