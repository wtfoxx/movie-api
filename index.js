const express = require('express'),
  morgan = require('morgan');

const app = express();

let movies = [
  {
    title: 'The Lord of The Rings Trilogy',
    director: 'Peter Jackson'
  },

  {
    title: 'The Wizard of Oz',
    director: 'Victor Fleming'
  },

  {
    title: 'Interstellar',
    director: 'Christopher Nolan'
  },

  {
    title: 'Oldboy',
    director: 'Park Chan-wook'
  },

  {
    title: 'Parasite',
    director: 'Bong Joon-ho'
  },

  {
    title: 'Napoleon Dynamite',
    director: 'Jared Hess'
  },

  {
    title: 'The Tale of Princess Kaguya',
    director: 'Isao Takahata'
  },

  {
    title: 'Mean Girls',
    director: 'Mark Waters'
  },

  {
    title: 'Movie 9',
    director: 'Director 9'
  },

  {
    title: 'Movie 10',
    director: 'Director 10'
  }
];

app.use(morgan('common'));

app.get('/', (req, res) => {
  res.send('Welcome to my favorite movies app!');
});

app.get('/movies', (req, res) => {
  res.json(movies);
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});