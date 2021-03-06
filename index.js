const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/flexnitDB', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const express = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  uuid = require('uuid');

const app = express();

const { check, validationResult } = require('express-validator');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://localhost.4200',
  'http://test.com',
  'https://flexnit.netlify.app',
  'https://wtfoxx.github.io',
];

const cors = require('cors');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        let message =
          "The CORS policy for this application doesn't allow access from origin" +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

app.use(morgan('common'));

app.get('/', (req, res) => {
  res.send('Welcome to my favorite movies app!');
});

// ENDPOINT FUNCTIONS START //

/**
 * Get all movies
 * @method Get
 * @param {string} endpoint apiUrl/movies
 * @returns {object} all movies
 * @requires JWT authentication
 */
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

/**
 * Get a movie by title
 * @method Get
 * @param {string} endpoint apiURL/movies/:Title
 * @requires JWT authentication
 */
app.get(
  '/movies/:Movie',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Movie })
      .then((movie) => {
        if (!movie) {
          res.status(404).send('Movie not found.');
        } else {
          res.status(200).json(movie);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

/**
 * Get all movies under a genre
 * @method Get
 * @param {string} endpoint apiUrl/movies/genres/:Genre
 * @returns {object} movies
 */
app.get('/movies/genres/:Genre', (req, res) => {
  Movies.find({ 'Genre.Name': req.params.Genre })
    .then((movies) => {
      if (!movies) {
        res.status(404).send('Genre not found.');
      } else {
        res.status(200).json(movies);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get director information
 * @method Get
 * @param {string} endpoint apiUrl/movies/directors/:Name
 * @returns {object} movie
 */
app.get('/movies/directors/:Name', (req, res) => {
  Movies.find({ 'Director.Name': req.params.Name })
    .then((movies) => {
      if (!movies) {
        res.status(404).send('Director not found.');
      } else {
        res.status(200).json(movies);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Create user
 * @method post
 * @param {string} endpoint apiUrl/users
 * @param {string} Username set by user (required)
 * @param {string} Password set by user (required)
 * @param {string} Email set by user (required)
 * @param {string} Birthday set by user (optional)
 * @returns {object} User
 * @requires public
 */
app.post(
  '/users',
  //Validation logic for request
  [
    check(
      'Username',
      'Username is required and must be at least 5 characters long.'
    ).isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ],
  (req, res) => {
    //check validation object for error
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }).then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        })
          .then((user) => {
            res.status(201).json(user);
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    });
  }
);

/**
 * Edit user
 * @method put
 * @param {string} endpoint apiUrl/users/:Username
 * @param {string} Username new or current
 * @param {string} Password new or current
 * @param {string} Email new or current
 * @param {string} Birthday new or current
 * @returns {string} success or error message
 */
app.put(
  '/users/:Username',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ],
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }, //This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * Add movie to favorites
 * @method post
 * @param {string} endpoint apiUrl/:Username/movies/:MovieID
 * @param {string} Username required
 * @param {string} MovieID required
 * @returns success or error message
 *
 */
app.post('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $push: { Favorites: req.params.MovieID },
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

/**
 * Remove movie from favorites
 * @method delete
 * @param {string} endpoint apiUrl/users/:Username/movies/:MovieID
 * @param {string} Username required
 * @param {string} MovieID required
 * @returns {string} success or error message
 */
app.delete('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $pull: { Favorites: req.params.MovieID },
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

/**
 * Delete user
 * @method delete
 * @param {string} endpoint apiUrl/users/:Username
 * @param {string} Username required
 * @returns {string} success or error message
 */
app.delete('/users/:Username', (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get user by username
 * @method Get
 * @param {string} endpoint apiUrl/users/:Username
 * @param {string} Username required
 * @returns {object} User
 */
app.get('/users/:Username', (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get all users
 * @method Get
 * @param {string} endpoint apiUrl/users
 * @returns {object} All users
 */
//Get all users
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// ENDPOINT FUNCTIONS END

app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
