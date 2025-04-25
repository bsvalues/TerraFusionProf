# Contributing to TerraFusionPro

Thank you for your interest in contributing to TerraFusionPro! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Development Process

We use GitHub to host code, track issues and feature requests, and accept pull requests.

### Pull Requests

1. Fork the repository and create your branch from `develop`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Coding Style

- We use Prettier for code formatting
- We follow ESLint rules defined in the repository
- TypeScript is our primary language

## Development Setup

Please refer to the [README.md](./README.md) for development environment setup instructions.

## Project Structure

The TerraFusionPro repository is organized as a monorepo using Lerna. Here's an overview of the main directories:

- `packages/`: Contains client-facing applications and shared utilities
  - `api/`: API Gateway implementation
  - `field-app/`: Mobile field collection app (React Native)
  - `web-client/`: Web client application (React)
  - `shared/`: Shared code and utilities
  - `agents/`: AI agent implementations

- `services/`: Backend microservices
  - `property-service/`: Property data management
  - `analysis-service/`: Valuation and analysis
  - `user-service/`: User management and auth
  - `form-service/`: Form definition and processing
  - `report-service/`: Report generation

- `infrastructure/`: DevOps and infrastructure configurations
  - `kubernetes/`: K8s deployment configurations
  - `terraform/`: IaC for cloud resources
  - `docker/`: Docker configurations
  - `ci-cd/`: CI/CD pipeline configurations

- `docs/`: Project documentation
  - `architecture/`: Architecture diagrams and docs
  - `api/`: API documentation
  - `development/`: Development guidelines
  - `user-guides/`: End-user documentation

- `scripts/`: Utility scripts for development and deployment
- `tests/`: Integration and end-to-end tests
- `assets/`: Static assets for the project

## Commit Message Guidelines

We follow the Conventional Commits specification for our commit messages:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## License

By contributing to TerraFusionPro, you agree that your contributions will be licensed under the project's proprietary license.
