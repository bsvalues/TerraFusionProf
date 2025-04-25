# TerraFusionPro Deployment Guide

This document describes the deployment process for the TerraFusionPro platform.

## Prerequisites

- Kubernetes cluster with kubectl configured
- Node.js v20 or later
- PostgreSQL database
- Docker Registry access
- GitHub access with CI/CD integration

## Deployment Environments

The platform can be deployed to the following environments:

1. **Local Development** - For local development and testing
2. **Staging** - For QA and integration testing
3. **Production** - For live use

## Deployment Process

### Automated Deployment via CI/CD

The TerraFusionPro platform uses GitHub Actions for CI/CD. The pipeline is defined in `.github/workflows/ci.yml`.

When code is pushed to the `main` branch, the following happens:

1. **Build and Test**: All services are built and tested in parallel using a matrix build.
2. **Smoke Tests**: The platform's core services are started and tested to ensure they're functioning correctly.
3. **Deployment**: If the build and tests pass, the platform is automatically deployed to staging.

For production deployments, a manual approval is required in the GitHub Actions interface.

### Manual Deployment

To manually deploy the platform, use the following commands:

For staging:
```
node scripts/deploy.js staging
```

For production:
```
node scripts/deploy.js production
```

## Verification

After deployment, you can run smoke tests to verify that all services are functioning correctly:

```
bash smoke-test.sh
```

## Disaster Recovery

In case of deployment failures, the deployment script includes a rollback mechanism.

For manual rollback, use:

```
kubectl rollout undo deployment/<service-name> --namespace=<namespace>
```

## Service Health Monitoring

The platform includes health endpoints for all services, which can be monitored using:

```
bash smoke-test.sh
```

## Integrated Applications

The TerraFusionPro platform integrates with multiple applications:

1. TerraFusionSync (port 3001)
2. TerraFusionPro (port 3002)
3. TerraFlow (port 3003)
4. TerraMiner (port 3004)
5. TerraAgent (port 3005)
6. TerraF (port 3006)
7. TerraLegislativePulsePub (port 3007)
8. BCBSCostApp (port 3008)
9. BCBSGeoAssessmentPro (port 3009)
10. BCBSLevy (port 3010)
11. BCBSWebhub (port 3011)
12. BCBSDataEngine (port 3012)
13. BCBSPacsMapping (port 3013)
14. GeoAssessmentPro (port 3014)
15. BSBCMaster (port 3015)
16. BSIncomeValuation (port 3016)
17. TerraFusionMockup (port 3017)

These integrated applications are managed through the API Gateway and Apollo Federation Gateway.