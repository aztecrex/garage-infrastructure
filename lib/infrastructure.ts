import * as cdk from '@aws-cdk/core';
import { Website } from './website';
import { API } from './api';

export class Infrastructure extends cdk.Construct {
    constructor(scope: cdk.Construct) {
        super(scope, 'garage');
        const website = new Website(this);
        const api = new API(this);
    }
}

