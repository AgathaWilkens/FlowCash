import './style.css';
import { getCurrentUser } from './src/store.js';
import { renderAuth } from './src/views/auth.js';
import { startApp } from './src/views/app.js';

function boot() {
  const user = getCurrentUser();
  if (user) {
    if (!startApp()) renderAuth(boot);
  } else {
    renderAuth(boot);
  }
}

boot();
