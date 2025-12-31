#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FabrkntSuiteStack } from "./stacks/fabrknt-suite-stack";

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext("environment") || "dev";
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";

// Stack name based on environment
const stackName = `FabrkntSuite-${environment}`;

new FabrkntSuiteStack(app, stackName, {
    env: {
        account,
        region,
    },
    description: `Fabrknt Suite Infrastructure - ${environment}`,
    tags: {
        Environment: environment,
        Project: "FabrkntSuite",
        ManagedBy: "CDK",
    },
});
