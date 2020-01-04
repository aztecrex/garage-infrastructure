import * as cdk from '@aws-cdk/core';
import { Website } from './website';

export class Infrastructure extends cdk.Construct {
    constructor(scope: cdk.Construct) {
        super(scope, 'garage');
        const website = new Website(this);
    }
}

