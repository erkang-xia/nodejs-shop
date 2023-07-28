exports.getLogin = (req, res, next) => {
  isAuth = req.get('Cookie').split(';')[1].trim().split('=')[1];
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuth: isAuth,
  });
};

exports.postLogin = (req, res, next) => {
  req.session.isLoggedIn = true;
  res.redirect('/');
};
