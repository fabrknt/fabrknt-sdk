import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface FabrkntSuiteStackProps extends cdk.StackProps {
    environment?: string;
}

export class FabrkntSuiteStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc;
    public readonly database: rds.DatabaseInstance;
    public readonly databaseSecret: secretsmanager.Secret;
    public readonly apiGateway: apigateway.RestApi;
    public readonly userPool: cognito.UserPool;
    public readonly dynamoDbTables: { [key: string]: dynamodb.Table };
    public readonly redisCluster: elasticache.CfnCacheCluster;
    public readonly s3Buckets: { [key: string]: s3.Bucket };

    constructor(scope: Construct, id: string, props?: FabrkntSuiteStackProps) {
        super(scope, id, props);

        const environment = props?.environment || "dev";
        const isProduction = environment === "prod";

        // ============================================
        // VPC Setup
        // ============================================
        this.vpc = new ec2.Vpc(this, "FabrkntVPC", {
            maxAzs: 2,
            natGateways: isProduction ? 2 : 1, // Cost optimization for dev
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: "Public",
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: "Private",
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 24,
                    name: "Database",
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });

        // ============================================
        // Security Groups
        // ============================================
        const dbSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSG", {
            vpc: this.vpc,
            description: "Security group for RDS PostgreSQL",
            allowAllOutbound: false,
        });

        const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSG", {
            vpc: this.vpc,
            description: "Security group for Lambda functions",
            allowAllOutbound: true,
        });

        const redisSecurityGroup = new ec2.SecurityGroup(this, "RedisSG", {
            vpc: this.vpc,
            description: "Security group for ElastiCache Redis",
            allowAllOutbound: false,
        });

        // Allow Lambda to access RDS
        dbSecurityGroup.addIngressRule(
            lambdaSecurityGroup,
            ec2.Port.tcp(5432),
            "Allow Lambda to access RDS"
        );

        // Allow Lambda to access Redis
        redisSecurityGroup.addIngressRule(
            lambdaSecurityGroup,
            ec2.Port.tcp(6379),
            "Allow Lambda to access Redis"
        );

        // ============================================
        // Secrets Manager - Database Credentials
        // ============================================
        this.databaseSecret = new secretsmanager.Secret(
            this,
            "DatabaseSecret",
            {
                description: "RDS PostgreSQL credentials for Fabrknt Suite",
                generateSecretString: {
                    secretStringTemplate: JSON.stringify({ username: "admin" }),
                    generateStringKey: "password",
                    excludeCharacters: '"@/\\',
                },
            }
        );

        // ============================================
        // RDS PostgreSQL Database
        // ============================================
        const dbInstanceType = isProduction
            ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
            : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO);

        this.database = new rds.DatabaseInstance(this, "Database", {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15_4,
            }),
            instanceType: dbInstanceType,
            vpc: this.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            securityGroups: [dbSecurityGroup],
            credentials: rds.Credentials.fromSecret(this.databaseSecret),
            databaseName: "fabrknt_suite",
            multiAz: isProduction,
            allocatedStorage: isProduction ? 100 : 20,
            maxAllocatedStorage: isProduction ? 200 : 50,
            backupRetention: isProduction
                ? cdk.Duration.days(7)
                : cdk.Duration.days(3),
            deletionProtection: isProduction,
            removalPolicy: isProduction
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // ============================================
        // DynamoDB Tables
        // ============================================
        this.dynamoDbTables = {};

        // TRACE: Clicks table (high-frequency writes)
        this.dynamoDbTables.clicks = new dynamodb.Table(this, "ClicksTable", {
            tableName: `fabrknt-trace-clicks-${environment}`,
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Start with on-demand
            pointInTimeRecovery: isProduction,
            removalPolicy: isProduction
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // TRACE: Activity Metrics (time-series)
        this.dynamoDbTables.activityMetrics = new dynamodb.Table(
            this,
            "ActivityMetricsTable",
            {
                tableName: `fabrknt-trace-activity-metrics-${environment}`,
                partitionKey: {
                    name: "project_id",
                    type: dynamodb.AttributeType.STRING,
                },
                sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
                billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
                pointInTimeRecovery: isProduction,
                removalPolicy: isProduction
                    ? cdk.RemovalPolicy.RETAIN
                    : cdk.RemovalPolicy.DESTROY,
            }
        );

        // ============================================
        // ElastiCache Redis
        // ============================================
        const redisSubnetGroup = new elasticache.CfnSubnetGroup(
            this,
            "RedisSubnetGroup",
            {
                description: "Subnet group for Redis",
                subnetIds: this.vpc.privateSubnets.map(
                    (subnet) => subnet.subnetId
                ),
            }
        );

        this.redisCluster = new elasticache.CfnCacheCluster(
            this,
            "RedisCluster",
            {
                cacheNodeType: isProduction
                    ? "cache.t3.small"
                    : "cache.t3.micro",
                engine: "redis",
                numCacheNodes: 1,
                vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
                cacheSubnetGroupName: redisSubnetGroup.ref,
            }
        );

        // ============================================
        // S3 Buckets
        // ============================================
        this.s3Buckets = {};

        // Static assets bucket
        this.s3Buckets.assets = new s3.Bucket(this, "AssetsBucket", {
            bucketName: `fabrknt-assets-${environment}`,
            versioned: isProduction,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: isProduction
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // Data exports bucket
        this.s3Buckets.exports = new s3.Bucket(this, "ExportsBucket", {
            bucketName: `fabrknt-exports-${environment}`,
            versioned: false,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(90), // Auto-delete after 90 days
                },
            ],
            removalPolicy: isProduction
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // ============================================
        // Cognito User Pool
        // ============================================
        this.userPool = new cognito.UserPool(this, "UserPool", {
            userPoolName: `fabrknt-users-${environment}`,
            signInAliases: {
                email: false,
                username: true,
            },
            selfSignUpEnabled: true,
            autoVerify: {
                email: false,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
            removalPolicy: isProduction
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        const userPoolClient = this.userPool.addClient("WebClient", {
            userPoolClientName: `fabrknt-web-client-${environment}`,
            generateSecret: false,
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
        });

        // ============================================
        // API Gateway
        // ============================================
        this.apiGateway = new apigateway.RestApi(this, "ApiGateway", {
            restApiName: `fabrknt-suite-api-${environment}`,
            description: "API Gateway for Fabrknt Suite",
            defaultCorsPreflightOptions: {
                allowOrigins: [
                    "https://pulse.fabrknt.com",
                    "https://trace.fabrknt.com",
                    "https://fabric.fabrknt.com",
                    ...(environment === "dev"
                        ? [
                              "http://localhost:3000",
                              "http://localhost:3001",
                              "http://localhost:3002",
                          ]
                        : []),
                ],
                allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allowHeaders: ["Content-Type", "Authorization"],
                allowCredentials: true,
            },
            deployOptions: {
                stageName: environment,
                throttlingRateLimit: 100,
                throttlingBurstLimit: 200,
            },
        });

        // ============================================
        // Lambda Execution Role
        // ============================================
        const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        });

        // Grant permissions
        this.databaseSecret.grantRead(lambdaRole);
        this.database.grantConnect(lambdaRole);
        this.s3Buckets.assets.grantReadWrite(lambdaRole);
        this.s3Buckets.exports.grantReadWrite(lambdaRole);
        this.dynamoDbTables.clicks.grantReadWriteData(lambdaRole);
        this.dynamoDbTables.activityMetrics.grantReadWriteData(lambdaRole);

        // ============================================
        // EventBridge Rules (for scheduled tasks)
        // ============================================
        // Daily metrics aggregation (runs at 2 AM UTC)
        const dailyMetricsRule = new events.Rule(this, "DailyMetricsRule", {
            schedule: events.Schedule.cron({ minute: "0", hour: "2" }),
            description: "Daily metrics aggregation for TRACE",
        });

        // Weekly reports (runs Monday at 9 AM UTC)
        const weeklyReportsRule = new events.Rule(this, "WeeklyReportsRule", {
            schedule: events.Schedule.cron({
                minute: "0",
                hour: "9",
                weekDay: "MON",
            }),
            description: "Weekly reports for PULSE",
        });

        // ============================================
        // SQS Queues
        // ============================================
        const webhookQueue = new sqs.Queue(this, "WebhookQueue", {
            queueName: `fabrknt-webhooks-${environment}`,
            visibilityTimeout: cdk.Duration.minutes(5),
            retentionPeriod: cdk.Duration.days(14),
        });

        const deadLetterQueue = new sqs.Queue(this, "DeadLetterQueue", {
            queueName: `fabrknt-dlq-${environment}`,
            retentionPeriod: cdk.Duration.days(14),
        });

        // ============================================
        // Outputs
        // ============================================
        new cdk.CfnOutput(this, "DatabaseEndpoint", {
            value: this.database.instanceEndpoint.hostname,
            description: "RDS PostgreSQL endpoint",
            exportName: `FabrkntSuite-DatabaseEndpoint-${environment}`,
        });

        new cdk.CfnOutput(this, "ApiGatewayUrl", {
            value: this.apiGateway.url,
            description: "API Gateway URL",
            exportName: `FabrkntSuite-ApiGatewayUrl-${environment}`,
        });

        new cdk.CfnOutput(this, "UserPoolId", {
            value: this.userPool.userPoolId,
            description: "Cognito User Pool ID",
            exportName: `FabrkntSuite-UserPoolId-${environment}`,
        });

        new cdk.CfnOutput(this, "UserPoolClientId", {
            value: userPoolClient.userPoolClientId,
            description: "Cognito User Pool Client ID",
            exportName: `FabrkntSuite-UserPoolClientId-${environment}`,
        });

        new cdk.CfnOutput(this, "RedisEndpoint", {
            value: this.redisCluster.attrRedisEndpointAddress,
            description: "ElastiCache Redis endpoint",
            exportName: `FabrkntSuite-RedisEndpoint-${environment}`,
        });
    }
}
