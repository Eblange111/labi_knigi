CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    pub_year INTEGER NOT NULL,
    description TEXT,
    image TEXT,
    genre_id INTEGER NOT NULL,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 14,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'Новая',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO genres (id, name) VALUES
(1, 'Классика'),
(2, 'Научная фантастика'),
(3, 'Программирование'),
(4, 'Антиутопия');

INSERT OR IGNORE INTO books (id, title, author, pub_year, description, image, genre_id) VALUES
(1, 'Мастер и Маргарита', 'Михаил Булгаков', 1967, 'Философский роман о добре и зле, любви и творчестве в Москве 1930-х годов.', '1.jpg', 1),
(2, 'Дюна', 'Фрэнк Герберт', 1965, 'Эпическая сага о пустынной планете Арракис, политических интригах и борьбе за выживание.', '2.jpg', 2),
(3, 'Преступление и наказание', 'Фёдор Достоевский', 1866, 'Глубокое исследование человеческой совести, морального выбора и искупления.', '3.jpg', 1),
(4, 'Чистый код', 'Роберт Мартин', 2008, 'Практическое руководство по созданию читаемого, гибкого и поддерживаемого программного кода.', '4.jpg', 3),
(5, '1984', 'Джордж Оруэлл', 1949, 'Культовый роман-предупреждение о тоталитарном контроле и свободе мысли.', '5.jpg', 4),
(6, 'Пикник на обочине', 'Аркадий и Борис Стругацкие', 1972, 'История сталкеров, рискующих жизнью ради загадочных артефактов в аномальной Зоне.', '6.jpg', 2);

INSERT OR IGNORE INTO users (id, full_name, login, email, password_hash, role) VALUES
(1, 'admin', 'admin', 'admin@mail.ru', '8f9a1b2c3d4e5f60:864759d8d59a8e746a9c6c43e7c109c445c44c772f865162f4b504698780910f3c21398e3570549b3e1d675b699e1c3f14a81d18a9c0e604b0e57f10a3b0b81c', 'ADMIN');
