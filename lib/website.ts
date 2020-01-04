import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

const SITE_NAME='garage.gregwiley.com';
const TARGET_ZONE='gregwiley.com';

export class Website extends cdk.Construct {
    constructor(scope: cdk.Construct) {
        super(scope, 'website');
        const cert = new Certificate(this);
        const service = new StaticWeb(this, cert);
    }
}

class StaticWeb extends cdk.Stack {
    constructor(scope: cdk.Construct, certificate: Certificate) {
        // this stack depends on being in a specific account, assuming
        // it is the same as the CLI will use, but probably should be made more
        // explicit so it fails with useful information. the trouble is i don't
        // think it's a good idea to store an account id in a source repository.
        super(scope, 'static-web', {
            env: {
              account: process.env.CDK_DEFAULT_ACCOUNT,
              region: 'us-east-1'
          }});

        const origin = new s3.Bucket(this, 'origin');
        const accessId = new cloudfront.OriginAccessIdentity(this, 'origin-id');
        origin.addToResourcePolicy(new iam.PolicyStatement({
            principals: [new iam.CanonicalUserPrincipal(accessId.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
            actions: ['s3:GetObject'],
            effect: iam.Effect.ALLOW,
            resources: [origin.arnForObjects('*')],
        }));

        const cdn = new cloudfront.CloudFrontWebDistribution(this, 'distribution', {
            originConfigs: [
                {
                  s3OriginSource: {
                  s3BucketSource: origin,
                  originAccessIdentity: accessId,
                  },
                  behaviors : [ {isDefaultBehavior: true}]
                }
              ],
            aliasConfiguration: {
                acmCertRef: certificate.certificateRef,
                names: [SITE_NAME],
            }

        });

        new route53.CnameRecord(this, 'domain', {
            domainName: cdn.domainName,
            zone: targetZone(this),
            recordName: SITE_NAME,
            ttl: cdk.Duration.minutes(5),
        });
    }
}

function targetZone(scope: cdk.Construct) {
    return route53.HostedZone.fromLookup(scope, 'validation-zone', {
        domainName: TARGET_ZONE,
    });
}

class Certificate extends cdk.Stack {
    public readonly certificateRef;

    constructor(scope: cdk.Construct) {
        // this stack depends on being in a specific account, assuming
        // it is the same as the CLI will use, but probably should be made more
        // explicit so it fails with useful information. the trouble is i don't
        // think it's a good idea to store an account id in a source repository.
        super(scope, 'certificate', {
            env: {
              account: process.env.CDK_DEFAULT_ACCOUNT,
              region: 'us-east-1'
          }});

        const cert = new acm.DnsValidatedCertificate(this, 'certificate', {
            domainName: SITE_NAME,
            hostedZone: targetZone(this),
        });

        this.certificateRef = cert.certificateArn;


    }
}
