#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { Infrastructure } from '../lib/infrastructure';

const app = new cdk.App();
new Infrastructure(app);
