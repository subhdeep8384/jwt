const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const express = require("express")
const z = require('zod')
const app = express()
const port = 3000 

async function db(){
    console.log("connecting to the database......")
    const conn = await mongoose.connect('mongodb://localhost:27017/zod-validations')
    console.log('connected to database')
}
db() ;

const userZodSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
})

const userSchema = new mongoose.Schema({
    email : String ,
    password : String,
})
const User = mongoose.model("User" , userSchema) ;

app.use(express.json())
app.use(express.urlencoded({
    extended : true
}))
app.get('/' , function(req, res ){
    return res.send('Hello World!')
})

app.post('/signin' , async function(req , res){
    console.log("aaaaaaaaaaaa", req.body)
    const parsed = userZodSchema.safeParse(req.body) ;

    if(!parsed.success){
        return res.send(parsed.error.issues[0].message)
    }
    const {email , password} = parsed.data ;
    const userExist = await User.findOne({
        email
    })
    console.log("EMIAL : " + email)
    if(userExist){
        return res.send("user already exists")
    }

    await bcrypt.hash(password , 10 , function(err , hash){
        if(err){
            return res.send("error occured")
        }
        const user = User.create({
            email ,
            password : hash
        })
        return res.send("user created")
    })
})

app.post('/signup' , async function(req , res){
    const { email , password } = req.body ;
    const user =await User.findOne({
        email ,
    })
    if(!user){
        return res.send("user does not exist")
    }
    const passwordMatch =await bcrypt.compare(password , user.password  )
    console.log("PASSWORD MATCH : " + passwordMatch)
    if(passwordMatch){
        const token = jwt.sign(user.email , "chut") ;
        res.header('token' , token)
        res.cookie('token' , token)
        return res.send("user signed up")
    }
    else{
        return res.status(401).send("password does not match")
    }
})
app.listen(port , function(){
    console.log("server is running on porttttt : " + port)
})