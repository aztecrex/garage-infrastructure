import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

const SITE_NAME='garage.gregwiley.com';
const VALIDATION_ZONE='gregwiley.com';

export class Website extends cdk.Construct {
    constructor(scope: cdk.Construct) {
        super(scope, 'website');
        // const cert = new Certificate(this);
        const service = new StaticWeb(this);
    }
}

class StaticWeb extends cdk.Stack {
    constructor(scope: cdk.Construct) {
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

        // const cdn = new cloudfront.CloudFrontWebDistribution(this, 'distribution', {
        //     originConfigs: [
        //         {
        //           s3OriginSource: {
        //           s3BucketSource: origin,
        //           originAccessIdentity: identity,
        //           },
        //           behaviors : [ {isDefaultBehavior: true}]
        //         }
        //       ],

        // });
    }
}

// class Certificate extends cdk.Stack {
//     constructor(scope: cdk.Construct) {
//         // this stack depends on being in a specific account, assuming
//         // it is the same as the CLI will use, but probably should be made more
//         // explicit so it fails with useful information. the trouble is i don't
//         // think it's a good idea to store an account id in a source repository.
//         super(scope, 'certificate', {
//             env: {
//               account: process.env.CDK_DEFAULT_ACCOUNT,
//               region: 'us-east=1'
//           }});

//         new acm.DnsValidatedCertificate(this, 'certificate', {
//             domainName: 'garage.gregwiley.com',
//             hostedZone: route53.HostedZone.fromLookup(this, 'validation-zone', {
//                 domainName: 'gregwiley.com',
//             }),
//         });


//     }
// }
