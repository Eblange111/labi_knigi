async function initAuthNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return null;

  const res = await fetch('/api/me');
  const { user } = await res.json();

  if (!user) {
    nav.innerHTML = `
      <a href="index.html">Главная</a>
      <a href="catalog.html">Каталог книг</a>
      <a href="login.html">Вход</a>
      <a href="register.html" class="btn green-btn">Регистрация</a>
    `;
  } else if (user.role === 'ADMIN') {
    nav.innerHTML = `
      <a href="index.html">Главная</a>
      <a href="catalog.html">Каталог книг</a>
      <a href="add.html">+ Книга</a>
      <a href="admin.html" class="role-badge">Админ-панель (${user.login})</a>
      <button onclick="logout()" class="btn line-btn">Выйти</button>
    `;
  } else {
    nav.innerHTML = `
      <a href="index.html">Главная</a>
      <a href="catalog.html">Каталог книг</a>
      <a href="profile.html" class="role-badge">Мои заявки (${user.login})</a>
      <button onclick="logout()" class="btn line-btn">Выйти</button>
    `;
  }
  return user;
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = 'login.html';
}
