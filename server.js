import express from 'express';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import dotenv from 'dotenv';  dotenv.config(); // environment variables
import cors from 'cors';
import bcrypt from 'bcrypt'; // for hash password
import jwt from 'jsonwebtoken'; // for creating tokens

import Comment from './models/commentModel.js';
import Author from './models/authorModel.js';
import Article from './models/articleModel.js';
import articleRoutes from './routes/articleRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

// MongoDB Connection
mongoose.connect(process.env.ATLAS_URI)
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch(err => console.error('Could not connect to MongoDB Atlas...', err))


// Middleware
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(express.urlencoded({ extended: true })) // FIXED
app.use(methodOverride('_method'));

// Routes
app.use('/articles', articleRoutes);



// Root route - show all articles (with comments' authors populated)
app.get('/', async (req, res) => {
  try {
    // Populate author of the article and authors of the comments
    const articles = await Article.find()
      .sort({ createdAt: 'desc' })
      .populate('author')  // Article's author
      .populate({
        path: 'comments',
        populate: { path: 'author' }  // Populate comment's author
      });

    // Fetch all authors for later use in the view (if needed)
    const authors = await Author.find().sort({ name: 1 });

    // Now passing both articles and authors to the view
    res.render('articles/index', { articles: articles, authors: authors });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});


// ----------------------------------------------------------//
// for later to protect routes
// function checkAuthenticated(req, res, next) {
//   if (req.isAuthenticated && req.user) {
//       return next();
//   }
//   res.status(403).send('You must be logged in');
// }
// ------------------------ User Authentication ----------------------------//
// Register a new user (must already be an author in DB or this will create one)
app.post('/users', async (req, res) => {
  try {
      const { name, email, password, bio } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if user already exists by email
      let existingUser = await Author.findOne({ email });
      if (existingUser) {
          return res.status(409).json({ message: 'User already exists' });
      }

      const newUser = new Author({ name, email, password: hashedPassword, bio });
      await newUser.save();

      // === Generate JWT token immediately after successful registration ===
      const token = jwt.sign(
        { id: newUser._id, name: newUser.name, email: newUser.email },  // payload
        process.env.ACCESS_TOKEN_SECRET,  // secret key
        { expiresIn: '1h' }
      );

      // === Send user data AND token back to client ===
      res.status(201).json({ message: 'User registered successfully', user: { name: newUser.name, email: newUser.email }, token });  // ===

  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});



// Login user
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body; //<--- changed to emial

  try {
      const user = await Author.findOne({ email }); //<--- changed to emial

      if (!user) {
          // return res.status(400).send('Cannot find user');  // must be json frontend expects!!
          return res.status(400).json({ message: 'Cannot find user' });  

      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
      // session/token generation (for frontend UX only at this time) <---------
      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email }, // payload
        process.env.ACCESS_TOKEN_SECRET, // secret key
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Success', token: token, user: { name: user.name, email: user.email } }); // token added!!!!
      } else {
          // res.status(401).send('Not Allowed'); // must be json frontend expects!!
          res.status(401).json({ message: 'Incorrect password' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
});

// ------------------------ AUTH ----------------------------//
// ----------------------------------------------------------//




// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});