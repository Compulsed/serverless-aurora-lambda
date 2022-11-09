#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ServerlessAuroraLambda } from '../lib/serverless-aurora-lambda'

const app = new cdk.App()

new ServerlessAuroraLambda(app, 'ServerlessAurora', {})
