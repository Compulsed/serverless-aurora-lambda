import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { Client } from 'pg'

const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' })

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const secretArn = process.env.databaseSecretArn

  const command = new GetSecretValueCommand({
    SecretId: secretArn,
  })

  const secret = await secretsManagerClient.send(command)

  const secretValues = JSON.parse(secret.SecretString ?? '{}')

  const client = new Client({
    user: secretValues.username,
    host: secretValues.host,
    database: 'postgres',
    password: secretValues.password,
    port: secretValues.port,
  })

  await client.connect()

  const res = await client.query('SELECT $1::text as message', ['Hello from PG!'])

  const dbResponse = res.rows[0].message // Hello world!

  await client.end()

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `DB Response: ${dbResponse}`,
      secretArn,
    }),
  }
}
