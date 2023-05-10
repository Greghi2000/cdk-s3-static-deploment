#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticWebsiteStack } from '../lib/cdk-s3-static-deployment-stack';

const app = new cdk.App();
new StaticWebsiteStack(app, 'StaticWebsiteStack', {
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_ACCOUNT_REGION,
  },
});
app.synth();
