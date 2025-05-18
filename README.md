# Backend for Article Sharing Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application that allows users to share and explore articles on any topic.

Users can register, log in, create, edit, and delete their own articles, as well as comment on any article. The application uses `bcrypt` to securely hash passwords and `jsonwebtoken` for secure user authentication via JSON Web Tokens (JWT).


> ⚠️ **Note:** This backend is part of a full-stack project.  
> For the full technology stack, UI/UX considerations, and complete project documentation, please visit the [frontend repository](https://github.com/naomixnyc/Writeboard-react).


  ## API Endpoints

- **POST** `/articles/login`  
  Log in a user with email and password.

  **Request Body:**
  ```json
  {
    "email": "Author's email",
    "password": "password"
  }
  ```

- **POST** `/articles/user`  
  Sign up a new user.

  **Request Body:**
  ```json
  {
    "name": "Author Name"
    "email": "Author's email",
    "password": "password"
  }
  ```

- **GET** `/articles`  
  Display all articles, sorted by most recent ({ createdAt: -1 }).  
  Each article includes its author and associated comments. 

- ~~**GET** `/`~~  
  ~~Displays article previews via a form. The "Read More" button is functional.~~

- **GET** `/articles/authors`  
  Display all authors (= users) currently registered.   

- **GET** `/articles/comments`  
  Display all comments submitted.  


- ~~**GET** `/articles/:slug`~~  
  ~~View a single article by its slug, including its author and comments.~~ 

- **GET** `/articles/:id`  
  View a single article by its MongoDB _id (ObjectId), including its author and comments. 

- **POST** `/articles`  
  Creates a new article. The author must already be registered and referenced by their _id.

  **Request Body:**
  ```json
  {
    "title": "Article Title",
    "description": "Article Description",
    "content": "Full article content",
    "author": "Author's ObjectId" //"6826756d90584c7acd0a260d"  
  }
  ```

- ~~**GET** `/articles/new`~~  
  ~~Display the form to create a new article.~~


- **POST** `/articles/authors`  
  Add a new author (= user).  

  **Request Body:**  
  ```json
  {
    "name": "Author Name",
    "email": "Author's email"
  }
  ```

- **POST** `/articles/:id/comments`  
  Adds a comment to the specified article. The author field is referenced by their _id)

  **Request Body:**
  ```json
  {
    "content": "Comment content",
    "author": "Author's ObjectId" //6811045c50b8186c1d7e5a6e 
  }
  ```


- **PUT** `/articles/:id`  
  Update an existing article by its _id.
  
  **Request Body:**
  ```json
  {
    "title": "Updated Title",
    "description": "Updated Description",
    "content": "Updated content"
  }
  ```

- **DELETE** `/articles/:id`  
  Deletes an article by its _id. 
