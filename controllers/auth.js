const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodeMailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const transporter = nodeMailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        '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',
    },
  })
);
exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Invalid email');
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            res.redirect('/');
          } else {
            req.flash('error', 'Wrong password');
            res.redirect('/login');
          }
        })
        .catch((err) => {
          console.log(err);
          req.flash('error', 'Unknow Error');
          res.redirect('/login');
        });
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
  });
};
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        req.flash('error', 'Email already exists');
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedP) => {
          const u = new User({
            email: email,
            password: hashedP,
            cart: { items: [] },
          });
          return u.save();
        })
        .then((result) => {
          transporter.sendMail({
            to: email,
            from: 'xiaerkang@icloud.com',
            subject: 'Sign up succeeded!',
            html: '<h1>You account is activated</h1>',
          });
          res.redirect('/login');
        });
    })

    .catch((err) => {
      console.log(err);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email was found');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        transporter
          .sendMail({
            to: req.body.email,
            from: 'xiaerkang@icloud.com',
            subject: 'password reset',
            html: `
            <p>You request a password reset </p>
            <p>Click this link to reset a new password <a href = "http://localhost:3000/reset/${token}"> Reset your password </a> </p>`,
          })
          .then(() => {
            res.redirect('/');
          })
          .catch((err) => {
            console.log(err);
            // handle the error appropriately, maybe redirect to an error page
          });
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let updatedUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      updatedUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedP) => {
      console.log(hashedP);
      updatedUser.password = hashedP;
      updatedUser.resetToken = undefined;
      updatedUser.resetTokenExpiration = undefined;
      return updatedUser.save();
    })
    .then((result) => {
      res.redirect('/login');
    })
    .catch((err) => {
      console.log(err);
    });
};
