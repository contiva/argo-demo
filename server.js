const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
  res.render('index', { todos: rows });
});

app.post('/todos', async (req, res) => {
  const { title } = req.body;
  if (title && title.trim()) {
    await pool.query('INSERT INTO todos (title) VALUES ($1)', [title.trim()]);
  }
  res.redirect('/');
});

app.post('/todos/:id/toggle', async (req, res) => {
  await pool.query('UPDATE todos SET done = NOT done WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

app.post('/todos/:id/delete', async (req, res) => {
  await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

initDB().then(() => {
  app.listen(port, () => {
    console.log(`ToDo app listening on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
