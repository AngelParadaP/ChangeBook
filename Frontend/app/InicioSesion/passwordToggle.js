// passwordToggle.js
let showPassword = false;

const togglePassword = () => {
  showPassword = !showPassword;
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.type = showPassword ? 'text' : 'password';
  }
};

export default togglePassword;
