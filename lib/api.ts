import * as cdk from '@aws-cdk/core';
import * as api from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import { STATUS_CODES } from 'http';

const SITE_NAME = 'garage.gregwiley.com';
const TARGET_ZONE = 'gregwiley.com';

export class API extends cdk.Construct {
    constructor(scope: cdk.Construct) {
        super(scope, 'api');
        new Gateway(this);
    }
}


class Gateway extends cdk.Stack {
    constructor(scope: cdk.Construct) {
        super(scope, 'gateway');

        const rest = new api.RestApi(this, 'rest');
        const base = new api.Resource(this, 'api', {
            parent: rest.root,
            pathPart: 'api',
        });
        base.addCorsPreflight({
            allowOrigins: api.Cors.ALL_ORIGINS,
        });
        const operate = new api.Resource(this, 'operate', {
            parent: base,
            pathPart: 'operate',
        });
        const postOperate = operate.addMethod('POST', new api.MockIntegration({
            passthroughBehavior: api.PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": "{\"statusCode\": 200}"
            },
            integrationResponses: [
                {
                    selectionPattern: "2\\d{2}",
                    statusCode: "210",
                    responseTemplates: {
                        "application/json": ""
                    },

                }
            ],
        }), {
            methodResponses: [{ statusCode: "210" }],
        });

        const status = new api.Resource(this, 'status', {
            parent: base,
            pathPart: 'status',
        });
        status.addMethod('GET', new api.MockIntegration({
            passthroughBehavior: api.PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": "{\"statusCode\": 200}"
            },
            integrationResponses: [
                {
                    statusCode: "200",
                    responseTemplates: {
                        "application/json": "\"Up\""
                    },

                }
            ],

        }), {
            methodResponses: [{ statusCode: "200" }],
        });

    }
}
