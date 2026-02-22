import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

function generatePassword() {
  return crypto.randomBytes(8).toString('base64').slice(0, 12)
}

export const handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405 }
  }

  const { email } = JSON.parse(event.body)

  const password = generatePassword()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    }
  }

  // TODO: email küldés ide jön

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "User created",
      password
    })
  }
}