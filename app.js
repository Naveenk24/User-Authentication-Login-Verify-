const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "./userData.db");

app.use(express.json());

const bcrypt = require("bcrypt");

let db = null;

const initializeTheDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at port 3000::");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeTheDbAndServer();

// User Registration API

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, password, name, gender, location } = userDetails;
  const getUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';
  `;

  const user = await db.get(getUserQuery);

  console.log(user);

  if (user !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const passwordLength = password.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRegistration = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
      `;

      await db.run(userRegistration);
      response.send("User created successfully");
    }
  }
});

// User Login API

app.post("/login", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;

  const getUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';
  `;

  const user = await db.get(getUserQuery);

  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparison = await bcrypt.compare(password, user.password);
    if (comparison) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// Change the User Password

app.put("/change-password", async (request, response) => {
  const userDetails = request.body;
  const { username, oldPassword, newPassword } = userDetails;

  const getUserDetails = `
    SELECT *
    FROM user
    WHERE username = '${username}';
  `;
  const user = await db.get(getUserDetails);
  console.log(user);
  const comparison = await bcrypt.compare(oldPassword, user.password);
  if (comparison) {
    const newPasswordLength = newPassword.length;
    if (newPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateUserPasswordQuery = `
            UPDATE user
            SET password = '${hashedPassword}'
            WHERE username = '${username}';
        `;
      await db.run(updateUserPasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
