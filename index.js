const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors({
  origin:[
   
    'https://vigorous-feet.surge.sh',
    'https://hotel-booking-auth-7e7bf.firebaseapp.com',
    'https://hotel-booking-auth-7e7bf.web.app'
  ],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.7auoehb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const bookingCollection=client.db("HotelBooking").collection("Bookings")
    const addbookingCollection=client.db("HotelBooking").collection("books")
    const reviewbookingCollection=client.db("HotelBooking").collection("review")
    const offerbookingCollection=client.db("OfferBooking").collection("offer")
    // await client.connect();
    

    // jwt related 

    app.post('/jwt',async(req,res)=>{
      const user=req.body;
      console.log(user)
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:true,
        sameSite:'none'
      })
      
      .send({success:true})
    })

    // bookings collection
    // app.get('/Bookings',async(req,res)=>{
    //   const cursor=bookingCollection.find();
    //   const result=await cursor.toArray()
    //   res.send(result)
     
    // })

    app.get('/Bookings', async (req, res) => {
      const cursor = bookingCollection.find();
    
     
      const sortParam = req.query.sort || 'asc'; 
    
      try {
        const result = await cursor.toArray();
    
        // Sort the result based on the "price" field
        if (sortParam === 'asc') {
          result.sort((a, b) => a.price - b.price);
        } else if (sortParam === 'desc') {
          result.sort((a, b) => b.price - a.price);
        }
    
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    
    app.get('/offer',async(req,res)=>{
      const cursor=offerbookingCollection.find();
      const result=await cursor.toArray()
      res.send(result)
     
    })

    app.get('/Bookings/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const options = {
      
        projection: {roomDescription: 1,date:1, price: 1,roomSize:1,availability:1,roomImages:1,specialOffers:1 },
     
      };
      
      const result=await bookingCollection.findOne(query)
      res.send(result)
     
  })
  

  // books section

  app.get('/books/:id',async(req,res)=>{

    const id=req.params.id;
    const query={_id:new ObjectId(id)}
    console.log(id)
    const result=await addbookingCollection.findOne(query)
    res.send(result)
  })
 

const logger = async (req, res, next) => {
  console.log('called:', req.hostname, req.originalUrl); 
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('value of token in middleware', token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized' }); 
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error(err); // Change console.log to console.error for error messages
      return res.status(401).send({ message: 'unauthorized' });
    }
    console.log('value in the token', decoded);
    req.user = decoded;
    next();
  });
};

app.post('/logout',async(req,res)=>{
  const user=req.body;
 res.clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
 .send({ success: true })
})

app.get('/books',verifyToken, logger,async(req,res)=>{
  const cursor=addbookingCollection.find();
  console.log('tok tok ',req.cookies.token)
  const result=await cursor.toArray()
  res.send(result)
})

app.post('/books', async (req, res) => {
  const booking = req.body;
  console.log(booking);
  const result = await addbookingCollection.insertOne(booking);
  res.send(result); // You might want to send a more informative response here
});


app.delete('/books/:id',async(req,res)=>{
  const id=req.params.id;
  console.log(id)
  const query={_id:new ObjectId (id)}
  const result=await addbookingCollection.deleteOne(query)
  res.send(result)
})

app.put('/books/:id',async(req,res)=>{
  const id=req.params.id;
  console.log(id)
  const filter={_id:new ObjectId(id)}
  const options = { upsert: true };
  const upDateBooks=req.body;
  const updateDate = {
    $set: {
      // description:upDateBooks.description,
      // Roomsize:upDateBooks.Roomsize,
      //  price:upDateBooks.price,
      //  availability:upDateBooks.availability,
      //  specialOffers:upDateBooks.specialOffers,
      //  roomImages:upDateBooks.roomImages,
       date:upDateBooks.date

    },
  
  };
  const result = await addbookingCollection.updateOne(filter, updateDate, options);
  res.send(result)
})

app.put('/Bookings/:id',async(req,res)=>{
  const id=req.params.id;
  console.log(id)
  const filter={_id:new ObjectId(id)}
  const options = { upsert: true };
  const upDateBooks=req.body;
  const updateDate = {
    $set: {
      description:upDateBooks.description,
      roomSize:upDateBooks.roomSize,
       price:upDateBooks.price,
       availability:upDateBooks.availability,
       specialOffers:upDateBooks.specialOffers,
       roomImages:upDateBooks.roomImages,
       

    },
  
  };
  const result = await bookingCollection.updateOne(filter, updateDate, options);
  res.send(result)
})

// review booking 
app.get('/review',async(req,res)=>{
  const cursor=reviewbookingCollection.find();
  const result=await cursor.toArray()
  res.send(result)
 
})

app.post('/review',async(req,res)=>{
  const booking=req.body;
 console.log(booking)
 const result=await reviewbookingCollection.insertOne(booking)
 res.send(result)
})

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

