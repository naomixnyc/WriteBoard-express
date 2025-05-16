import express from 'express';
const router = express.Router();

import Article from '../models/articleModel.js';
import Author from '../models/authorModel.js';
import Comment from '../models/commentModel.js';
import mongoose from 'mongoose';


// = = = = = = = = = = = = =
//  GET ALL ARTICLES
// = = = = = = = = = = = = =

router.get('/', async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ createdAt: -1 })
      .populate('author')
      .populate('comments')

    //res.send(articles) // <-- test without ejs
    //console.log(articles)

    const authors = await Author.find().sort({ name: 1 }); // ✅ added line


    // res.render('articles/index', { articles: articles, authors: authors }); // ✅ added authors 
    res.json(articles) 
  } catch (err) {
    console.error('GET /articles failed:', err)
    res.status(500).send('Server error')
  }
})



  // = = = = = = = = = = = = =
  //  GET ALL AUTHORS
  // = = = = = = = = = = = = =
  router.get('/authors', async (req, res) => {
    try {
      const authors = await Author.find().sort({ name: 1 })
      res.json(authors)
    } catch (err) {
      console.error('GET /articles/authors failed:', err)
      res.status(500).send('Failed to fetch authors')
    }
  })


  // = = = = = = = = = = = = =
  //  GET ALL COMMENTS
  // = = = = = = = = = = = = =
router.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find().populate('author article').sort({ createdAt: -1 })
    res.json(comments)
  } catch (err) {
    console.error('GET /comments failed:', err)
    res.status(500).send('Failed to fetch comments')
  }
})


  // = = = = = = = = = = = = =
  //  GET One Article by Slug
  // = = = = = = = = = = = = =
// router.get('/:slug', async (req, res) => {
//   try {
//     const article = await Article.findOne({ slug: req.params.slug })
//       .populate('author')
//       .populate('comments')
//     if (!article) {
//       console.log('Route hit with slug:', req.params.slug)      
//       return res.redirect('/')
//     }
//     res.render('articles/show', { article: article })
//   } catch (err) {
//     console.log(err)
//     res.redirect('/') // redirect on error
//   }
// })



// = = = = = = = = = = = = =
//  GET FORM TO CREATE
// = = = = = = = = = = = = =
router.get('/new', async (req, res) => {
  try {
    const authors = await Author.find() //<--- fetches all authors from db!
    res.render('articles/new', { article: new Article(), authors: authors }) // MUST must have mew Artcile()
  } catch (err) {
    console.error('GET /articles/new failed:', err)
    res.redirect('/articles')
  }
})

// = = = = = = = = = = = = =
//  CREATE ARTICLE (POST)
// = = = = = = = = = = = = =
router.post('/', async (req, res) => {
  const { title, description, content, author } = req.body
  const article = new Article({
    title,
    description,
    content,
    author,
    slug: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
  })

  try {
    const newArticle = await article.save()
    res.redirect(`/articles/${newArticle._id}`)
  } catch (err) {
    console.error('POST /articles failed:', err)
    const authors = await Author.find()
    res.render('articles/new', {
      article: article,
      authors: authors,
      errorMessage: 'Error creating article'
    })
  }
})


// IMPORTANT: All specific GET routes (e.g. /articles/comments, /articles/authors)
// MUST be defined BEFORE dynamic routes like /articles/:slug or /articles/:id
// because Express matches routes in the order they appear!!

// = = = = = = = = = = = = =
//  SHOW ARTICLE BY ID
// = = = = = = = = = = = = =
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author')
      .populate({
        path: 'comments',
        populate: { path: 'author' } // populate author in each comment
      })
    if (!article) return res.status(404).send('Article not found')
    //res.render('articles/show', { article: article })
    res.json(article) 
  } catch (err) {
    console.error('GET /articles/:id failed:', err)
    res.status(500).send('Server error')
    //res.redirect('/')
  }
})


// = = = = = = = = = = = = =
//  POST NEW AUTHOR
// = = = = = = = = = = = = =
router.post('/authors', async (req, res) => {
    const { name, email } = req.body
    try {
      const author = new Author({ name, email })
      await author.save()
      res.status(201).json(author)
    } catch (err) {
      console.error('POST /articles/author failed:', err)
      res.status(400).send('Failed to create author')
    }
  })
  

// = = = = = = = = = = = = =
//  POST NEW COMMENT TO ARTICLE
// = = = = = = = = = = = = =
router.post('/:id/comments', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    if (!article) return res.status(404).json({ message: 'Article not found' })

    const comment = new Comment({
      content: req.body.content,
      article: article._id,
      author: req.body.author // optional — only if provided
    })

    const savedComment = await comment.save()
    article.comments.push(savedComment._id)
    await article.save()

    const updatedArticle = await Article.findById(article._id).populate('comments')
    const populatedComment = await Comment.findById(savedComment._id).populate('author')

    res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment,
      article: updatedArticle
    })
  } catch (err) {
    console.error('POST /articles/:id/comments failed:', err)
    res.status(500).json({ message: 'Failed to add comment' })
  }
})


// = = = = = = = = = = = = =
//  PUT Edit/Update ARTICLE
// = = = = = = = = = = = = =
// <---- This updates content field but bypassing the mongoose's middlewares that fills the slug and sanitizedHtml fields because it is not using mongoose's methods, save() etc   
// router.put('/:id', async (req, res) => {
//   const { title, description, content } = req.body
//   try {
//     // const id = new mongoose.Types.ObjectId({req.params.id})
//     // const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
//     //   new: true,
//     //   runValidators: true,
//     // })
//     const article = await Article.findOneAndUpdate(
//       { _id: new mongoose.Types.ObjectId(req.params.id) },
//       { title, description, content },
//       { new: true }
//     )
//     if (!article) {
//       return res.status(404).send('Article not found')
//       return res.redirect('/') // redirect if article is not found
//     }
//     res.json(article)
//     //res.redirect(`/articles/${article.slug}`)
//   } catch (err) {
//     console.log(err) //res.status(500).send(err.message)
//     res.redirect('/') // redirect on error
//   }
// })

// <----  This save() will fill the slug and sanitizedHtml
router.put('/:id', async (req, res) => {
  const { title, description, content } = req.body
  try {
    const article = await Article.findById(req.params.id)
    if (!article) {
      return res.status(404).send('Article not found')
    }

    article.title = title
    article.description = description
    article.content = content

    await article.save()

    res.json(article) // includes author in the response
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
})


// = = = = = = = = = = = = =
//  DELETE DELETE AN ARTICLE
// = = = = = = = = = = = = =

// DELETE article
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id)
    if (!article) {
      return res.redirect('/') // redirect if article is not found
    }
    res.status(200).json({ message: 'Article deleted successfully' })
  } catch (err) {
    console.log(err)
    res.redirect('/') // redirect on error
  }
})



export default router;