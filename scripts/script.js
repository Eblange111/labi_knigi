document.addEventListener('DOMContentLoaded', () => {
  // 1. Интерактив: Кнопка "Показать / Скрыть" пароль
  const toggleButtons = document.querySelectorAll('.toggle-pwd');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Скрыть';
      } else {
        input.type = 'password';
        btn.textContent = 'Показать';
      }
    });
  });

  // 2. Интерактив в каталоге: Поиск и фильтрация по жанрам
  const searchInput = document.getElementById('searchInput');
  const genreFilter = document.getElementById('genreFilter');
  const bookCards = document.querySelectorAll('.book-card');
  const emptyMessage = document.getElementById('emptyMessage');

  function filterBooks() {
    if (!searchInput || !genreFilter) return;

    const query = searchInput.value.toLowerCase().trim();
    const selectedGenre = genreFilter.value;
    let visibleCount = 0;

    bookCards.forEach((card) => {
      const title = card.querySelector('.book-card__title').textContent.toLowerCase();
      const author = card.querySelector('.book-card__author').textContent.toLowerCase();
      const genre = card.getAttribute('data-genre');

      const matchesSearch = title.includes(query) || author.includes(query);
      const matchesGenre = selectedGenre === 'all' || genre === selectedGenre;

      if (matchesSearch && matchesGenre) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyMessage) {
      emptyMessage.classList.toggle('hidden', visibleCount > 0);
    }
  }

  if (searchInput && genreFilter) {
    searchInput.addEventListener('input', filterBooks);
    genreFilter.addEventListener('change', filterBooks);
  }

  // Интерактив на кнопках "Читать фрагмент"
  const readButtons = document.querySelectorAll('.read-btn');
  readButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const bookTitle = btn.closest('.book-card').querySelector('.book-card__title').textContent;
      alert(`Открыт ознакомительный фрагмент книги «${bookTitle}». Для чтения полной версии войдите в аккаунт.`);
    });
  });

  // 3. Вспомогательные функции для отображения ошибок форм
  function setError(input, errorElement, message) {
    input.classList.add('input-error');
    errorElement.textContent = message;
  }

  function clearError(input, errorElement) {
    input.classList.remove('input-error');
    errorElement.textContent = '';
  }

  // 4. Клиентская валидация формы регистрации
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Отмена стандартной отправки формы

      const fullName = document.getElementById('fullName');
      const email = document.getElementById('email');
      const login = document.getElementById('login');
      const password = document.getElementById('password');
      const confirmPassword = document.getElementById('confirmPassword');
      const formSuccess = document.getElementById('formSuccess');

      let isValid = true;
      formSuccess.classList.add('hidden');

      // Проверка ФИО
      if (fullName.value.trim() === '') {
        setError(fullName, document.getElementById('fullNameError'), 'Введите ваше ФИО');
        isValid = false;
      } else {
        clearError(fullName, document.getElementById('fullNameError'));
      }

      // Проверка Email
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.value.trim() === '') {
        setError(email, document.getElementById('emailError'), 'Введите адрес электронной почты');
        isValid = false;
      } else if (!emailPattern.test(email.value.trim())) {
        setError(email, document.getElementById('emailError'), 'Некорректный формат Email (например: user@mail.ru)');
        isValid = false;
      } else {
        clearError(email, document.getElementById('emailError'));
      }

      // Проверка Логина
      if (login.value.trim() === '') {
        setError(login, document.getElementById('loginError'), 'Придумайте логин');
        isValid = false;
      } else {
        clearError(login, document.getElementById('loginError'));
      }

      // Проверка Пароля (минимум 8 символов)
      if (password.value.length < 8) {
        setError(password, document.getElementById('passwordError'), 'Пароль должен содержать не менее 8 символов');
        isValid = false;
      } else {
        clearError(password, document.getElementById('passwordError'));
      }

      // Проверка совпадения паролей
      if (confirmPassword.value === '') {
        setError(confirmPassword, document.getElementById('confirmPasswordError'), 'Повторите пароль');
        isValid = false;
      } else if (password.value !== confirmPassword.value) {
        setError(confirmPassword, document.getElementById('confirmPasswordError'), 'Пароли не совпадают');
        isValid = false;
      } else {
        clearError(confirmPassword, document.getElementById('confirmPasswordError'));
      }

      // Если ошибок нет
      if (isValid) {
        formSuccess.classList.remove('hidden');
        registerForm.reset();
      }
    });
  }

  // 5. Базовая проверка формы авторизации
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const username = document.getElementById('loginUsername');
      const password = document.getElementById('loginPassword');
      const loginSuccess = document.getElementById('loginSuccess');
      let isValid = true;

      loginSuccess.classList.add('hidden');

      if (username.value.trim() === '') {
        setError(username, document.getElementById('loginUsernameError'), 'Введите логин или email');
        isValid = false;
      } else {
        clearError(username, document.getElementById('loginUsernameError'));
      }

      if (password.value.trim() === '') {
        setError(password, document.getElementById('loginPasswordError'), 'Введите пароль');
        isValid = false;
      } else {
        clearError(password, document.getElementById('loginPasswordError'));
      }

      if (isValid) {
        loginSuccess.classList.remove('hidden');
        loginForm.reset();
      }
    });
  }
});
