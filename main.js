const express = require('express');
const session = require('express-session');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://danieloh05:kHIP7IAVWiyoB6R9@cluster0.lz3xtlt.mongodb.net";
const dbName = 'blog';
const collectionName = 'user';
const blogCollectionName = 'blog';
const userCollectionName = 'users';
const emailField = 'email';
const passwordField = 'password';
const bodyParser = require('body-parser');
const path = require('path');
const ObjectId = require('mongodb').ObjectId;

const client = new MongoClient(url);

// Serve static files from the public directory
app.use(express.static(__dirname, { index: 'login.html' }));

// Configure the middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '3qE59X1W7m1GKx2ZmIeC',
  resave: false,
  saveUninitialized: false
}));

const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    // If the user is authenticated, allow them to access the page
    next();
  } else {
    // If the user is not authenticated, redirect them to the login page
    req.session.message = 'You are not authenticated. Please log in to continue.';
    res.redirect('/');
  }
};

// Serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/login.html'));
});

// Handle login form submissions
app.post('/login', (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  console.log("username and password:");

  // Connect to the MongoDB database
  client.connect((err) => {
    if (err) {
      console.log(err);
      return res.status(500).send();
    }
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    collection.findOne({ [emailField]: email, [passwordField]: password }, (err, user) => {
      if (err) {
        console.log(err);
        return res.status(500).send();
      }
    
      console.log("Query result: ", user);
    
      if (!user) {
        console.log(`Could not find user with email ${email}`);
        return res.status(401).send();
      }
    
      // Set the session variable to indicate that the user is authenticated
      req.session.isAuthenticated = true;
      console.log(`Authenticated user with email ${email}`);
    
      // Redirect the user to the index page
      res.redirect('/index.html');
    });
  });
});

// Serve the create page
app.get('/create', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, './create.html'));
});

// Serve the index page only to authenticated users
app.get('/index.html', isAuthenticated, (req, res) => {
  // Connect to the MongoDB database
  client.connect((err) => {
    if (err) {
      console.log(err);
      return res.status(500).send();
    }
    
    const db = client.db(blog);
    const collection = db.collection('blog_posts');

    // Retrieve all blog posts from the database
    collection.find({}).toArray((err, posts) => {
      if (err) {
        console.log(err);
        return res.status(500).send();
      }
      
      // Render the index page with the blog posts
      res.render('index', { posts: posts });
    });
  });
});

// Handle blog post form submissions
app.post('/create', isAuthenticated, (req, res) => {
  const title = req.body.title;
  const content = req.body.content;

  // Connect to the MongoDB database
  client.connect((err) => {
    if (err) {
      console.log(err);
      return res.status(500).send();
    }
    
    const db = client.db(blog);
    const collection = db.collection('blog_posts');

    // Insert the new blog post into the database
    collection.insertOne({ title: title, content: content }, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send();
      }
      
      console.log('New blog post created: ', result.insertedId);
      res.redirect('/index.html');
    });
  });
});

  // Increment the number of likes and update the UI
function incrementLikes(blogId) {
  let count = localStorage.getItem(`likes-${blogId}`) || 0;
  count++;
   // TODO: Save the updated like count to the database
  localStorage.setItem(`likes-${blogId}`, count);
  let likeCount = document.getElementById(`like-count-${blogId}`);
  likeCount.textContent = count;
}

// Increment the number of likes and update the UI
function incrementLikes(blogId) {
  let count = localStorage.getItem(`likes-${blogId}`) || 0;
  count++;
  localStorage.setItem(`likes-${blogId}`, count);
  let likeCount = document.getElementById(`like-count-${blogId}`);
  likeCount.textContent = count;
  
  // Update the state of the like button in local storage
  localStorage.setItem(`like-state-${blogId}`, 'liked');
}

// Decrement the number of likes and update the UI
function decrementLikes(blogId) {
  let count = localStorage.getItem(`likes-${blogId}`) || 0;
  if (count > 0) {
    count--;
    localStorage.setItem(`likes-${blogId}`, count);
    let likeCount = document.getElementById(`like-count-${blogId}`);
    likeCount.textContent = count;
  }
  
  // Update the state of the like button in local storage
  localStorage.setItem(`like-state-${blogId}`, 'not-liked');
}



// Handle like button clicks
app.post('/like', isAuthenticated, (req, res) => {
  const blogPostId = req.body.id;

  // Connect to the MongoDB database
  client.connect((err) => {
    if (err) {
      console.log(err);
      return res.status(500).send();
    }
    
    const db = client.db(blog);
    const collection = db.collection(blogCollectionName);

    // Find the blog post by its ID and update the like count
    collection.findOneAndUpdate(
      { _id: new ObjectId(blogPostId) },
      { $inc: { likes: 1 } },
      { returnOriginal: false },
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).send();
        }

        // Send the updated blog post back to the client
        res.send(result.value);
      }
    );
  });
});


// Start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
