# Serverless Aurora Lambda Starter

This project is intended to help set up a very simple CDK Serverless Aurora project with AWS lambda / Api Gateway.

To run this project:

```
npm install
npx cdk deploy
```

**Access**

To get access to your database with an SQL client, extract the database credentials out of secrets manager

**Security considerations:**

This project sets up a Serverless Aurora with a public URL and an open security group. The permissive database networking rule is to eliminate the need for Lambda to be in a VPC. If lambda is in a VPC, the function will not have access to the public internet without a NATGateway OR a NatInstance (expensive).

When running this in a production environment the recommendation to move the RDS cluster into a private subnet, and to have the lambda function exist within a VPC.
