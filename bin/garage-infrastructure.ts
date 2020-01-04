#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { GarageInfrastructureStack } from '../lib/garage-infrastructure-stack';

const app = new cdk.App();
new GarageInfrastructureStack(app, 'GarageInfrastructureStack');
