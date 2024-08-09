const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

function createToken(user) {
  const payload = {
    username: user.username,
    admin: user.admin || false
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
}

module.exports = createToken;
