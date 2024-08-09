
# Bugs and Fixes Documentation

## Bug #1
- **Description**: `User.authenticate` was not awaited in the login route, which could cause the token to be created before authentication completes.
- **Fix Location**: `auth.js` line 27
- **Fix**: Added `await` to `User.authenticate(username, password)`.

```javascript
router.post('/login', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    let user = await User.authenticate(username, password);  // Added await
    const token = createTokenForUser(username, user.admin);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
}); // end
```

- **Test Case**:
```javascript
describe("POST /auth/login", function() {
  test("should allow a correct username/password to log in", async function() {
    const response = await request(app)
      .post("/auth/login")
      .send({
        username: "u1",
        password: "pwd1"
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ token: expect.any(String) });

    let { username, admin } = jwt.verify(response.body.token, SECRET_KEY);
    expect(username).toBe("u1");
    expect(admin).toBe(false);
  });
});
```

## Bug #2
- **Description**: The PATCH route did not validate if the fields being updated were allowed.
- **Fix Location**: `users.js` line 43
- **Fix**: Added validation to ensure only allowed fields are updated.

```javascript
router.patch('/:username', authUser, requireLogin, requireAdmin, async function(req, res, next) {
  try {
    if (!req.curr_admin && req.curr_username !== req.params.username) {
      throw new ExpressError('Only that user or admin can edit a user.', 401);
    }

    // Allowed fields for update
    const allowedFields = ["first_name", "last_name", "phone", "email"];
    let fields = { ...req.body };
    delete fields._token;

    for (let key in fields) {
      if (!allowedFields.includes(key)) {
        throw new ExpressError(`Field ${key} is not allowed to be updated.`, 400);
      }
    }

    let user = await User.update(req.params.username, fields);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}); // end
```

- **Test Case**:
```javascript
describe("PATCH /users/[username]", function() {
  test("should disallow patching not-allowed fields", async function() {
    const response = await request(app)
      .patch("/users/u1")
      .set("Authorization", `Bearer ${tokens.u1}`)
      .send({ admin: true });
    expect(response.statusCode).toBe(400);
  });
});
```

## Bug #3
- **Description**: The DELETE route did not await the `User.delete` method.
- **Fix Location**: `users.js` line 63
- **Fix**: Added `await` to `User.delete(req.params.username)`.

```javascript
router.delete('/:username', authUser, requireAdmin, async function(req, res, next) {
  try {
    await User.delete(req.params.username);  // Added await
    return res.json({ message: 'deleted' });
  } catch (err) {
    return next(err);
  }
}); // end
```

- **Test Case**:
```javascript
describe("DELETE /users/[username]", function() {
  test("should allow if admin", async function() {
    const response = await request(app)
      .delete("/users/u1")
      .set("Authorization", `Bearer ${tokens.u3}`); // u3 is admin
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: "deleted" });
  });
});
```

## Bug #4
- **Description**: The JWT token created in `createToken` had no expiration time, which is a security risk.
- **Fix Location**: `createToken.js` line 10
- **Fix**: Added an expiration time of 24 hours to the JWT token.

```javascript
function createToken(username, admin=false) {
  let payload = {username, admin};
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" }); // Added expiration time
}
```

- **Test Case**:
```javascript
describe("POST /auth/register", function() {
  test("should allow a user to register", async function() {
    const response = await request(app)
      .post("/auth/register")
      .send({
        username: "new_user",
        password: "new_password",
        first_name: "new_first",
        last_name: "new_last",
        email: "new@newuser.com",
        phone: "1233211221"
      });
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ token: expect.any(String) });

    let { username, admin, exp } = jwt.verify(response.body.token, SECRET_KEY);
    expect(username).toBe("new_user");
    expect(admin).toBe(false);
    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
```

## Bug #5
- **Description**: Incorrect variable name used in the loop for filtering out keys starting with "_".
- **Fix Location**: `partialUpdate.js` line 18
- **Fix**: Corrected the variable name in the loop.

```javascript
for (let item in items) {  // Fixed variable name
  if (item.startsWith("_")) {
    delete items[item]
  }
}
```

- **Test Case**:
```javascript
describe("SQL For Partial Update", function() {
  test("should generate a proper SQL query for partial updates", async function() {
    const { query, values } = sqlForPartialUpdate(
      'users',
      { first_name: "new_first", last_name: "new_last" },
      'username',
      'u1'
    );
    expect(query).toBe("UPDATE users SET first_name=$1, last_name=$2 WHERE username=$3 RETURNING *");
    expect(values).toEqual(["new_first", "new_last", "u1"]);
  });
});
```

## Bug #6
- **Description**: The `getAll` method in `user.js` had unnecessary parameters which could lead to confusion.
- **Fix Location**: `user.js` line 37
- **Fix**: Removed unnecessary parameters from the `getAll` method.

```javascript
static async getAll() { // Removed unnecessary parameters
  const result = await db.query(
    `SELECT username,
              first_name,
              last_name,
              email,
              phone
          FROM users 
          ORDER BY username`
  );
  return result.rows;
}
```

- **Test Case**:
```javascript
describe("GET /users", function() {
  test("should list all users", async function() {
    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokens.u1}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.users.length).toBe(3);
  });
});
```

## Bug #7
- **Description**: The `get` method in `user.js` was missing a `throw` for the `ExpressError`.
- **Fix Location**: `user.js` line 61
- **Fix**: Added `throw` to the `ExpressError`.

```javascript
if (!user) {
  throw new ExpressError('No such user', 404); // Fixed missing throw
}
```

- **Test Case**:
```javascript
describe("GET /users/[username]", function() {
  test("should return 404 if user not found", async function() {
    const response = await request(app)
      .get("/users/not-a-user")
      .set("Authorization", `Bearer ${tokens.u1}`);
    expect(response.statusCode).toBe(404);
  });
});
```

### Bug #8
- **Description**: The `authUser` middleware function uses `jwt.decode` to decode the token without verifying its signature, which is a security risk. This does not ensure the token's authenticity. The correct approach is to use `jwt.verify` to both decode and verify the token.
- **Fix Location**: `auth.js` line 31
- **Fix**: Changed `jwt.decode` to `jwt.verify`.

```javascript
// FIXES BUG #8
function authUser(req, res, next) {
  try {
    const token = req.body._token || req.query._token || req.headers.authorization?.split(" ")[1];
    if (token) {
      let payload = jwt.verify(token, SECRET_KEY);  // Changed from jwt.decode to jwt.verify
      req.curr_username = payload.username;
      req.curr_admin = payload.admin;
    }
    return next();
  } catch (err) {
    err.status = 401;
    return next(err);
  }
} // end
