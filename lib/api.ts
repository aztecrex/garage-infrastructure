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
        // wide open permissions on IoT core. in production, you'd want
        // to ratchet this down to bare minimum
        this.addToRolePolicy(new iam.PolicyStatement({
            actions: ['iot:*'],
            resources: ['*'],
        }));

        new cdk.CfnOutput(scope, 'LambdaFun-'+id+-'Name', {
            value: this.functionName
        });
    }
}

class Compute extends cdk.Stack {
    public readonly statusFunction: lambda.Function;
    public readonly operateFunction: lambda.Function;
    public readonly upFunction: lambda.Function;
    public readonly downFunction: lambda.Function;
    public readonly switchFunction: lambda.Function;
    constructor(scope: cdk.Construct) {
        super(scope, 'compute');
        this.statusFunction = new NodeFunction(this, 'status', CANNED_STATUS_CODE);
        this.operateFunction = new NodeFunction(this, 'operate', CANNED_OPERATE_CODE);
        this.upFunction = new NodeFunction(this, 'up', CANNED_OPERATE_CODE);
        this.downFunction = new NodeFunction(this, 'down', CANNED_OPERATE_CODE);
        this.downFunction = new NodeFunction(this, 'switch', CANNED_STATUS_CODE);
    }
}

interface MethodSpec {
    readonly method: string;
    readonly function: lambda.Function;
}


class Gateway extends cdk.Stack {

    private readonly base: api.Resource;

    constructor(scope: cdk.Construct, compute: Compute) {
        super(scope, 'gateway');

        const rest = new api.RestApi(this, 'rest', {
            defaultCorsPreflightOptions: {
                allowOrigins: api.Cors.ALL_ORIGINS,
                allowMethods: api.Cors.ALL_METHODS // this is also the default
            },
        });
        this.base = new api.Resource(this, 'api', {
            parent: rest.root,
            pathPart: 'api',
        });

        this.addResource('operate', { method: 'POST', function: compute.operateFunction });
        // const operate = new api.Resource(this, 'operate', {
        //     parent: this.base,
        //     pathPart: 'operate',
        // });
        // operate.addMethod('POST', new api.LambdaIntegration(compute.operateFunction));

        this.addResource('up', { method: 'POST', function: compute.upFunction });
        // const up = new api.Resource(this, 'up', {
        //     parent: this.base,
        //     pathPart: 'up',
        // });
        // up.addMethod('POST', new api.LambdaIntegration(compute.upFunction));

        const down = new api.Resource(this, 'down', {
            parent: this.base,
            pathPart: 'down',
        });
        down.addMethod('POST', new api.LambdaIntegration(compute.downFunction));

        this.addResource('status', {method: 'GET', function: compute.statusFunction });
        // const status = new api.Resource(this, 'status', {
        //     parent: this.base,
        //     pathPart: 'status',
        // });
        // status.addMethod('GET', new api.LambdaIntegration(compute.statusFunction));
    }

    private addResource(path: string, ...methods: MethodSpec[]) {
        const res = new api.Resource(this, path, {
            parent: this.base,
            pathPart: path,
        });
        methods.forEach(s => {
            res.addMethod(s.method, new api.LambdaIntegration(s.function));
        });
    }

}
