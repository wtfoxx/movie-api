const express = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

let users =  [
  {
    username: 'lemon',
    email: 'lemoncakes@gmail.com',
    birthday: '12/09/1994',
    favorites: [
      'Bee Movie',
      'Inception',
      'Parent Trap'
    ]
  }
]
let movies = [
  {
    name: 'Bee Movie', 
    year: '2007', 
    genre: {
      name: 'Comedy',
      description: 'Comedy films are "make em laugh" films designed to elicit laughter from the audience. Comedies are light-hearted dramas, crafted to amuse, entertain, and provoke enjoyment. '
    }, 
    director: {
      name: 'Simon', 
      birth: '1968',
      death: '-',
      bio: ''
    },
    imgURL: 'https://resizing.flixster.com/4cj6h4Pepi_2UkqtYCe0rB7pgW0=/ems.ZW1zLXByZC1hc3NldHMvbW92aWVzLzA0MzljODE3LTgzMDMtNGRiOS1iOTM0LTM1ODk1ODMwNDIyOC53ZWJw',
    featured: true
  }
];

app.use(morgan('common'));

app.get('/', (req, res) => {
  res.send('Welcome to my favorite movies app!');
});

//Responds with a json with all movies in database (1)-
app.get('/movies', (req, res) => {
  res.json(movies);
});

//Responds with a json of the specific movie asked for (2)-
app.get('/movies/:name', (req, res) => {
  res.json(movies.find((movie) => {
    return movie.name === req.params.name
  }));
});

//Responds with a json of all movies within specified genre (3)-
app.get('/movies/genres/:genre', (req, res) => {
  const genre = movies.find((movie) => movie.genre.name === req.params.genre).genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(404).send('Genre not found.');
  }
});

//Responds with a json with all information about the specified director (4)-
app.get('/movies/directors/:name', (req, res) => {
  const director = movies.find((movie) => movie.director.name === req.params.name).director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(404).send('Director not found.')
  }
});

//Creates a user in the platform (5)-
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.username) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    const message = 'Missing username in request body';
    res.status(400).send(message);
  };
});

//Changes user's username (6)-
app.put('/users/:username', (req, res) => {
  const newUsername = req.body;
  let user = users.find((user) => { return user.username === req.params.username });

  if (user) {
    user.username = newUsername.username;
    res.status(201).json(user)
  } else {
    res.status(404).send('User not found.')
  };
});

//Adds a movie to user's favorites list (7)-
app.post('/users/:username/:movie', (req, res) => {
  let user = users.find((user) => { return user.username === req.params.username });

  if (user) {
    user.favorites.push(req.params.movie);
    res.status(200).send(req.params.movie + ' was added to ' + user.username + "'s favorites list.");
  } else {
    res.status(404).send('User not found.');
  };
});

//Removes a movie from user's favorites list (8)-
app.delete('/users/:username/:movie', (req,res) => {
  let user = users.find((user) => { return user.username === req.params.username });
  
  if (user) {
    user.favorites = user.favorites.filter((mov) => { return mov !== req.params.movie });
    res.status(200).send(req.params.movie + ' was removed from ' + user.username + "'s favorites list.");
  } else {
    res.status(404).send('User not found.')
  };
});

//Deletes user (9)-
app.delete('/users/:username', (req,res) => {
  let user = users.find((user) => { return user.username === req.params.username });

  if (user) {
    users = users.filter((user) => { return user.username !== req.params.username });
    res.status(201).send(req.params.username + ' was deleted.');
  } else {
    res.status(404).send('User not found.')
  }
})


app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});