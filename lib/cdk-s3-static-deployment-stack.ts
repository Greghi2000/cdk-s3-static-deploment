import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Replace these values with your own
    const domainName = 'sean-gordon.com';
    const subdomain = 'www';

    // Create S3 bucket for website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index-home.html',
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
    websiteBucket.grantRead(originAccessIdentity);

    // Look up the hosted zone by domain name
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName });

    // Assuming you have the ARN or name of the certificate
    const certificateArn = 'arn:aws:acm:us-east-1:011404371827:certificate/5239b95f-c338-4a4e-b2ac-8b31a788e2eb';

    // Fetch the certificate using the ARN
    const certificate = Certificate.fromCertificateArn(this, 'WebsiteCertificate', certificateArn);

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: { origin: new cloudfrontOrigins.S3Origin(websiteBucket, {originAccessIdentity}) },
      // domainNames: [`${subdomain}.${domainName}`],
      domainNames: [`${domainName}`, `${subdomain}.${domainName}`],
      certificate: certificate,
    });

    // Create Route53 record
    new route53.ARecord(this, 'WebsiteAliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: `${subdomain}.${domainName}`,
    });

    // Create Route53 record
    new route53.ARecord(this, 'WebsiteAliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      recordName: `${domainName}`,
    });

    // Deploy website assets to S3
    new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
      sources: [s3deploy.Source.asset('./My-Portfolio')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}