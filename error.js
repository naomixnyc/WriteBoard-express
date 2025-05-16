import mongoose from 'mongoose';
import { marked } from 'marked';             // for Markdown to HTML
import slugify from 'slugify';               // for generating slugs
import createDomPurify from 'dompurify';     // for sanitizing HTML
import { JSDOM } from 'jsdom';               // DOM window for dompurify
const dompurify = createDomPurify(new JSDOM().window);

// mongoose's timestamp (in stead of createdAt), content (raw data wit markdown), added sanitizedHtml field.
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
        unique: true,    // to be used for clean URLs like /articles/my-article-title
    },
    sanitizedHtml: {
        type: String,
    }}, 
    {
        timestamps: true
    }
);

// Create a text index on the title field for full-text search on title
articleSchema.index({ title: 'text' });


// ===== MIDDLEWARE: Generate slug and sanitized HTML ====
// This pre-save hook runs *before* each `.save()` on the model.
// It transforms the title into a slug and the content (markdown) into safe HTML.

articleSchema.pre('save', function (next) {
    // A new slug is generated before saving if the article is new (or its title has been changed?? 
    // PUT normally "replaces the full document" but when using mongoose' save(), .isModified() will not trigger  
    if (this.isModified('title')) {
      this.slug = slugify(this.title, { lower: true, strict: true });
    }
  
    if (this.isModified('content')) {
      const rawHtml = marked(this.content);     // convert markdown to HTML
      this.sanitizedHtml = dompurify.sanitize(rawHtml); // clean the HTML to prevent XSS attacks
    }
  
    next();
  });
const Article = mongoose.model('Article', articleSchema);
export default Article;