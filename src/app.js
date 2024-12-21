const apiUrl = 'http://localhost:3000';

let editingPostId = null; // Ідентифікатор поста, який редагуємо

// Отримання списку постів
async function getPosts() {
  try {
    const response = await fetch(`${apiUrl}/posts`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

// Створення нового поста
async function createPost(title, content, imageUrl) {
  try {
    const response = await fetch(`${apiUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content, imageUrl }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

// Оновлення поста
async function updatePost(id, title, content, imageUrl) {
  try {
    const response = await fetch(`${apiUrl}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content, imageUrl }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating post:', error);
  }
}

// Видалення поста та його коментарів
async function deletePost(id) {
  try {
    // Видаляємо коментарі для цього поста
    await deleteCommentsByPostId(id);

    // Потім видаляємо сам пост
    await fetch(`${apiUrl}/posts/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}

// Видалення коментарів для конкретного поста
async function deleteCommentsByPostId(postId) {
  try {
    const commentsResponse = await fetch(`${apiUrl}/comments?postId=${postId}`);
    const comments = await commentsResponse.json();
    for (let comment of comments) {
      await fetch(`${apiUrl}/comments/${comment.id}`, {
        method: 'DELETE',
      });
    }
  } catch (error) {
    console.error('Error deleting comments:', error);
  }
}

// Додавання коментаря до поста
async function createComment(postId, comment) {
  try {
    const response = await fetch(`${apiUrl}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postId, comment }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

// Відображення всіх постів
function renderPosts(posts) {
  const postsContainer = document.getElementById('postsContainer');
  postsContainer.innerHTML = ''; // очищаємо контейнер перед рендерингом нових постів
  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `
      <h2>${post.title}</h2>
      <p>${post.content}</p>
      ${
        post.imageUrl
          ? `<img src="${post.imageUrl}" alt="Image" style="max-width: 100%; height: auto;">`
          : ''
      }
      <button class="editPostButton" data-id="${post.id}">Редагувати</button>
      <button class="deletePostButton" data-id="${post.id}">Видалити</button>
      <div class="commentsContainer" data-id="${post.id}">
        <h3>Коментарі:</h3>
        <ul id="comments-${post.id}"></ul>
        <form class="createCommentForm" data-id="${post.id}">
          <input type="text" class="commentInput" placeholder="Новий коментар" required>
          <button type="submit">Додати коментар</button>
        </form>
      </div>
    `;
    postsContainer.appendChild(postElement);
    loadComments(post.id); // Завантажуємо коментарі для кожного поста
  });
}

// Завантаження коментарів для поста
async function loadComments(postId) {
  try {
    const response = await fetch(`${apiUrl}/comments?postId=${postId}`);
    const comments = await response.json();
    const commentsList = document.getElementById(`comments-${postId}`);
    commentsList.innerHTML = ''; // очищаємо список перед додаванням нових коментарів
    comments.forEach(comment => {
      const li = document.createElement('li');
      li.textContent = comment.comment;
      commentsList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Функція пошуку
async function searchPosts(query) {
  const posts = await getPosts();
  const filteredPosts = posts.filter(
    post =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
  );
  renderPosts(filteredPosts);
}

// Обробник події для пошуку
document
  .getElementById('searchForm')
  .addEventListener('submit', async event => {
    event.preventDefault();
    const query = document.getElementById('searchInput').value;
    await searchPosts(query); // Пошук постів за ключовими словами
  });

// Обробник події для створення/редагування поста
document
  .getElementById('createPostForm')
  .addEventListener('submit', async event => {
    event.preventDefault();
    const title = document.getElementById('titleInput').value;
    const content = document.getElementById('contentInput').value;
    const imageUrl = document.getElementById('imageUrlInput').value;

    if (editingPostId) {
      // Оновлюємо пост
      await updatePost(editingPostId, title, content, imageUrl);
      editingPostId = null; // Скидаємо редагування після збереження
      document.querySelector('button[type="submit"]').textContent =
        'Створити пост'; // Відновлюємо текст кнопки
    } else {
      // Створюємо новий пост
      await createPost(title, content, imageUrl);
    }

    // Отримуємо всі пости після створення чи редагування
    const posts = await getPosts();

    // Оновлюємо відображення на сторінці
    renderPosts(posts);

    // Очищаємо форму після створення або редагування поста
    document.getElementById('createPostForm').reset();
  });

// Обробник події для редагування поста
document.addEventListener('click', async event => {
  if (event.target.classList.contains('editPostButton')) {
    const postId = event.target.getAttribute('data-id');
    const post = await getPosts().then(posts =>
      posts.find(post => post.id === postId)
    ); // Отримуємо пост за id
    if (post) {
      editPost(postId, post.title, post.content, post.imageUrl); // Викликаємо функцію редагування
    }
  }
});

// Обробник події для видалення поста
document.addEventListener('click', async event => {
  if (event.target.classList.contains('deletePostButton')) {
    const postId = event.target.getAttribute('data-id');
    await deletePost(postId); // Видаляємо пост і його коментарі
    const posts = await getPosts();
    renderPosts(posts); // Оновлюємо список постів
  }
});

// Обробник події для додавання коментаря
document.addEventListener('submit', async event => {
  if (event.target.classList.contains('createCommentForm')) {
    event.preventDefault();
    const postId = event.target.getAttribute('data-id');
    const comment = event.target.querySelector('.commentInput').value;
    await createComment(postId, comment);
    loadComments(postId);
    event.target.reset();
  }
});

// Запуск додатку
async function startApp() {
  const posts = await getPosts();
  renderPosts(posts);
}

startApp();
