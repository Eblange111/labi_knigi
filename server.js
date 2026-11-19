const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'knigomir-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

function seedDefaultUsers() {
  const adminHash = hashPassword('admin1234');
  db.get('SELECT id FROM users WHERE login = ?', ['admin'], (err, row) => {
    if (!row) {
      db.run(
        'INSERT INTO users (full_name, login, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['Главный Библиотекарь', 'admin', 'admin@knigomir.ru', adminHash, 'ADMIN']
      );
    } else {
      db.run('UPDATE users SET password_hash = ?, role = ? WHERE login = ?', [adminHash, 'ADMIN', 'admin']);
    }
  });

  const readerHash = hashPassword('reader1234');
  db.get('SELECT id FROM users WHERE login = ?', ['reader'], (err, row) => {
    if (!row) {
      db.run(
        'INSERT INTO users (full_name, login, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['Иван Читатель', 'reader', 'reader@knigomir.ru', readerHash, 'USER']
      );
    } else {
      db.run('UPDATE users SET password_hash = ?, role = ? WHERE login = ?', [readerHash, 'USER', 'reader']);
    }
  });
}
setTimeout(seedDefaultUsers, 300);

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Необходимо войти в систему.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Необходимо войти в систему.' });
  }
  if (req.session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }
  next();
}

app.get('/profile.html', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get(['/admin.html', '/add.html', '/edit.html'], (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  if (req.session.user.role !== 'ADMIN') {
    return res.status(403).sendFile(path.join(__dirname, 'public', '403.html'));
  }
  next();
});


app.get(['/add.html', '/edit.html'], (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(403).send('<h1>403 — Доступ запрещен</h1><p>Управлять фондом книг может только администратор.</p><a href="/catalog.html">Вернуться в каталог</a>');
  }
  next();
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/catalog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'catalog.html')));
app.get('/profile', (req, res) => res.redirect('/profile.html'));
app.get('/admin', (req, res) => res.redirect('/admin.html'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/register', (req, res) => {
  const { full_name, login, email, password } = req.body;
  const errors = [];

  if (!full_name || full_name.trim().length < 2) errors.push('Введите ФИО.');
  if (!login || login.trim().length < 3) errors.push('Логин должен быть не короче 3 символов.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('Введите корректный Email.');
  if (!password || password.length < 8) errors.push('Пароль должен содержать минимум 8 символов.');

  if (errors.length > 0) return res.status(400).json({ errors });

  const cleanLogin = login.trim();
  const cleanEmail = email.trim().toLowerCase();

  db.get('SELECT id FROM users WHERE login = ? OR email = ?', [cleanLogin, cleanEmail], (err, existing) => {
    if (err) return res.status(500).json({ errors: ['Ошибка базы данных.'] });
    if (existing) {
      return res.status(400).json({ errors: ['Пользователь с таким логином или Email уже зарегистрирован.'] });
    }

    const passwordHash = hashPassword(password);
    db.run(
      'INSERT INTO users (full_name, login, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [full_name.trim(), cleanLogin, cleanEmail, passwordHash, 'USER'],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ errors: ['Не удалось создать пользователя.'] });
        res.json({ success: true, message: 'Регистрация прошла успешно! Теперь войдите в систему.' });
      }
    );
  });
});

app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Введите логин/email и пароль.' });
  }

  const identifier = login.trim();
  db.get('SELECT * FROM users WHERE login = ? OR email = ?', [identifier, identifier.toLowerCase()], (err, user) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера.' });
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный логин или пароль.' });
    }

    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      login: user.login,
      role: user.role
    };

    res.json({ success: true, user: req.session.user });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/genres', (req, res) => {
  db.all('SELECT * FROM genres', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Ошибка БД' });
    res.json(rows);
  });
});

app.get('/api/books', (req, res) => {
  const genre = req.query.genre || '';
  let sql = 'SELECT books.*, genres.name AS genre_name FROM books INNER JOIN genres ON books.genre_id = genres.id';
  const params = [];
  if (genre !== '') {
    sql += ' WHERE books.genre_id = ?';
    params.push(genre);
  }
  sql += ' ORDER BY books.id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Ошибка БД' });
    res.json(rows);
  });
});

app.get('/api/books/:id', (req, res) => {
  const sql = 'SELECT books.*, genres.name AS genre_name FROM books INNER JOIN genres ON books.genre_id = genres.id WHERE books.id = ?';
  db.get(sql, [req.params.id], (err, book) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    res.json(book);
  });
});

app.post('/api/books', requireAdmin, (req, res) => {
  const { title, author, pub_year, description, image, genre_id } = req.body;
  if (!title || !author || !pub_year || !genre_id) {
    return res.status(400).json({ errors: ['Заполните все обязательные поля.'] });
  }
  db.run(
    'INSERT INTO books (title, author, pub_year, description, image, genre_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title.trim(), author.trim(), Number(pub_year), description || '', image || '', Number(genre_id)],
    function (err) {
      if (err) return res.status(500).json({ errors: ['Ошибка сохранения'] });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post('/api/books/:id', requireAdmin, (req, res) => {
  const { title, author, pub_year, description, image, genre_id } = req.body;
  db.run(
    'UPDATE books SET title = ?, author = ?, pub_year = ?, description = ?, image = ?, genre_id = ? WHERE id = ?',
    [title.trim(), author.trim(), Number(pub_year), description || '', image || '', Number(genre_id), Number(req.params.id)],
    function (err) {
      if (err) return res.status(500).json({ errors: ['Ошибка обновления'] });
      res.json({ success: true });
    }
  );
});

app.post('/api/books/:id/delete', requireAdmin, (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [Number(req.params.id)], function (err) {
    if (err) return res.status(500).json({ error: 'Ошибка удаления' });
    res.json({ success: true });
  });
});

app.post('/api/requests', requireAuth, (req, res) => {
  const { book_id, days_count, comment } = req.body;
  const days = Number(days_count) || 14;

  if (!book_id || isNaN(Number(book_id))) {
    return res.status(400).json({ error: 'Не выбрана книга.' });
  }
  if (days < 1 || days > 60) {
    return res.status(400).json({ error: 'Срок чтения должен быть от 1 до 60 дней.' });
  }

  db.run(
    'INSERT INTO requests (user_id, book_id, days_count, comment, status) VALUES (?, ?, ?, ?, ?)',
    [req.session.user.id, Number(book_id), days, comment ? comment.trim() : '', 'Новая'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Не удалось создать заявку.' });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/my-requests', requireAuth, (req, res) => {
  const sql = `
    SELECT requests.*, books.title AS book_title, books.author AS book_author
    FROM requests
    INNER JOIN books ON requests.book_id = books.id
    WHERE requests.user_id = ?
    ORDER BY requests.id DESC
  `;

  db.all(sql, [req.session.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Ошибка загрузки заявок.' });
    res.json(rows);
  });
});

app.post('/api/requests/:id/edit', requireAuth, (req, res) => {
  const reqId = Number(req.params.id);
  const { days_count, comment } = req.body;

  db.get('SELECT * FROM requests WHERE id = ?', [reqId], (err, request) => {
    if (!request) return res.status(404).json({ error: 'Заявка не найдена.' });
    if (request.user_id !== req.session.user.id) {
      return res.status(403).json({ error: 'Запрещено изменять чужую заявку!' });
    }
    if (request.status !== 'Новая') {
      return res.status(400).json({ error: 'Редактировать можно только заявки со статусом «Новая».' });
    }

    db.run(
      'UPDATE requests SET days_count = ?, comment = ? WHERE id = ?',
      [Number(days_count) || 14, comment ? comment.trim() : '', reqId],
      function (updErr) {
        if (updErr) return res.status(500).json({ error: 'Ошибка обновления.' });
        res.json({ success: true });
      }
    );
  });
});

app.post('/api/requests/:id/delete', requireAuth, (req, res) => {
  const reqId = Number(req.params.id);

  db.get('SELECT * FROM requests WHERE id = ?', [reqId], (err, request) => {
    if (!request) return res.status(404).json({ error: 'Заявка не найдена.' });
    if (request.user_id !== req.session.user.id) {
      return res.status(403).json({ error: 'Запрещено удалять чужую заявку!' });
    }

    db.run('DELETE FROM requests WHERE id = ?', [reqId], function (delErr) {
      if (delErr) return res.status(500).json({ error: 'Ошибка удаления.' });
      res.json({ success: true });
    });
  });
});

app.get('/api/admin/requests', requireAdmin, (req, res) => {
  const sql = `
    SELECT requests.*, books.title AS book_title, books.author AS book_author,
           users.full_name AS user_name, users.login AS user_login, users.email AS user_email
    FROM requests
    INNER JOIN books ON requests.book_id = books.id
    INNER JOIN users ON requests.user_id = users.id
    ORDER BY requests.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Ошибка загрузки всех заявок.' });
    res.json(rows);
  });
});

app.post('/api/admin/requests/:id/status', requireAdmin, (req, res) => {
  const allowedStatuses = ['Новая', 'Одобрена', 'Выдана', 'Возвращена', 'Отклонена'];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус заявки.' });
  }

  db.run('UPDATE requests SET status = ? WHERE id = ?', [status, Number(req.params.id)], function (err) {
    if (err) return res.status(500).json({ error: 'Ошибка смены статуса.' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
