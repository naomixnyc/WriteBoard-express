import mongoose from 'mongoose';
import { marked } from 'marked';             // for Markdown to HTML
import slugify from 'slugify';               // for generating slugs
import createDomPurify from 'dompurify';     // for sanitizing HTML
import { JSDOM } from 'jsdom';               // DOM window for dompurify
const dompurify = createDomPurify(new JSDOM().window);

// Mongoose's timestamp (in stead of createdAt); content (raw data with markdown), sanitizedHtml added.
// add INDEX for title search (later), ADD MIDDLEWARE TO GENERATE SLUG + SANITIZED HTML!

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 3,
        // maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        maxlength: 200,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
        required: true,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
    }],
    slug: {
        type: String,
        required: false,
        unique: true,
    },
    sanitizedHtml: {
        type: String,
    }}, 
    {
        timestamps: true  // Mongoose will automatically add two fields to each document: createdAt, updatedAt - no need to manually set them
    }
);

// creates a text index on the title field for full-text search on title
articleSchema.index({ title: 'text' });


// ==== MIDDLEWARE: Generate slug and sanitized HTML ===
// runs *before* each .save() on the model

// cnonverts title to URL-safe slug
articleSchema.pre('save', function (next) { 
    if (this.isModified('title')) {
      this.slug = slugify(this.title, { lower: true, strict: true });  
    }
  
    if (this.isModified('content')) {
      const rawHtml = marked(this.content);   // convert markdown to raw HTML
      this.sanitizedHtml = dompurify.sanitize(rawHtml);  // sanitize HTML output
    }
  
    next();
  });
const Article = mongoose.model('Article', articleSchema);
export default Article;