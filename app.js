const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const dbPath = path.join(__dirname, 'userData.db')
let db = null

const app = express()
app.use(express.json())

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}
initializeDBAndServer()

//API 1

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  let hashedPassword = await bcrypt.hash(password, 10)
  let getUserName = `
  SELECT * FROM user WHERE username='${username}'`
  let dbUser = await db.get(getUserName)
  if (dbUser === undefined) {
    let createUserQuery = `
    INSERT INTO user(username,name,password,gender,location)
    VALUES(
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    )
    `
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const checkUserQury = `
  SELECT * FROM user WHERE username='${username}'
  `
  const dbUser = await db.get(checkUserQury)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkUserQuery = `
  SELECT * FROM user WHERE username='${username}'
  `
  const dbUser = await db.get(checkUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
       UPDATE user 
       SET password='${encryptedPassword}';
       WHERE username ='${username}'
       `
        await db.run(updatePasswordQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
