import { Construct } from 'constructs'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import * as rds from 'aws-cdk-lib/aws-rds'
import { InstanceType, SecurityGroup, SubnetType, Vpc, Peer, Port } from 'aws-cdk-lib/aws-ec2'
import { Aspects, Duration } from 'aws-cdk-lib'
import { CfnDBCluster } from 'aws-cdk-lib/aws-rds'

export class HelloWorld extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const vpc = new Vpc(this, 'vpc', {
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        { name: 'egress', subnetType: SubnetType.PUBLIC },
        { name: 'isolated', subnetType: SubnetType.PRIVATE_ISOLATED }, // TODO: Remove, we're only using public
      ],
      natGateways: 0,
    })

    const dbSecurityGroup = new SecurityGroup(this, 'DbSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
    })

    dbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5432), 'allow database access from anywhere')

    // Full spec https://github.com/aws/aws-cdk/issues/20197#issuecomment-1117555047
    const dbCluster = new rds.DatabaseCluster(this, 'DbCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_6,
      }),
      instances: 1,
      instanceProps: {
        vpc: vpc,
        instanceType: new InstanceType('serverless'),
        autoMinorVersionUpgrade: true,
        publiclyAccessible: true,
        securityGroups: [dbSecurityGroup],
        vpcSubnets: vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }),
      },
      port: 5432,
    })

    Aspects.of(dbCluster).add({
      visit(node) {
        if (node instanceof CfnDBCluster) {
          node.serverlessV2ScalingConfiguration = {
            minCapacity: 0.5,
            maxCapacity: 1,
          }
        }
      },
    })

    const helloFunction = new NodejsFunction(this, 'function', {
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(30),
      environment: {
        databaseSecretArn: dbCluster.secret?.secretFullArn ?? '',
      },
      bundling: {
        externalModules: ['pg-native'],
      },
    })

    dbCluster.secret?.grantRead(helloFunction)

    new LambdaRestApi(this, 'apigw', {
      handler: helloFunction,
    })
  }
}