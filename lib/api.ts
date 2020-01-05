import * as cdk from '@aws-cdk/core';
import * as api from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';

const SITE_NAME = 'garage.gregwiley.com';
const TARGET_ZONE = 'gregwiley.com';

export class API extends cdk.Construct {
    constructor(scope: cdk.Construct) {
        super(scope, 'api');
        const compute = new Compute(this);
        new Gateway(this, compute);
    }
}

const DUMB_NODE_CODE = `
exports.handler = function (event, context) {
	context.succeed({
        statusCode: 200,
        body: JSON.stringify(event)
    });
};
`;

const CANNED_STATUS_CODE = `
exports.handler = function (event, context) {
	context.succeed({
        statusCode: 200,
        body: JSON.stringify({position: 'Unknown', want: 'DOWN',}),
        headers: {
            "Content-Type" : "application/json",
            "Access-Control-Allow-Origin" : "*",
            "Allow" : "GET, OPTIONS",
            "Access-Control-Allow-Methods" : "GET, OPTIONS",
            "Access-Control-Allow-Headers" : "*"
        }
    });
};
`;

const CANNED_OPERATE_CODE = `
exports.handler = function (event, context) {
	context.succeed({
        statusCode: 204,
        body: "",
        headers: {
            "Content-Type" : "application/json",
            "Access-Control-Allow-Origin" : "*",
            "Allow" : "POST, OPTIONS",
            "Access-Control-Allow-Methods" : "POST, OPTIONS",
            "Access-Control-Allow-Headers" : "*"
        }
    });
};
`;

class NodeFunction extends lambda.Function {
    constructor(scope: cdk.Construct, id: string, code?: string) {
        super(scope, id, {
            runtime: lambda.Runtime.NODEJS_10_X,
            code: lambda.Code.fromInline(code || DUMB_NODE_CODE),
            handler: 'index.handler',
        });
    }
}

class Compute extends cdk.Stack {
    public readonly statusFunction;
    public readonly operateFunction;
    constructor(scope: cdk.Construct) {
        super(scope, 'compute');
        this.statusFunction = new NodeFunction(this, 'status', CANNED_STATUS_CODE);
        this.operateFunction = new NodeFunction(this, 'operate', CANNED_OPERATE_CODE);
    }
}

class Gateway extends cdk.Stack {
    constructor(scope: cdk.Construct, compute: Compute) {
        super(scope, 'gateway');

        const rest = new api.RestApi(this, 'rest', {
            defaultCorsPreflightOptions: {
                allowOrigins: api.Cors.ALL_ORIGINS,
                allowMethods: api.Cors.ALL_METHODS // this is also the default
            },
        });
        const base = new api.Resource(this, 'api', {
            parent: rest.root,
            pathPart: 'api',
        });
        const operate = new api.Resource(this, 'operate', {
            parent: base,
            pathPart: 'operate',
        });
        operate.addMethod('POST', new api.LambdaIntegration(compute.operateFunction));

        const status = new api.Resource(this, 'status', {
            parent: base,
            pathPart: 'status',
        });
        status.addMethod('GET', new api.LambdaIntegration(compute.statusFunction));

    }
}
