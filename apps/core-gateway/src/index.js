/**
 * TerraFusion Core Gateway with Apollo Federation
 * 
 * This gateway orchestrates all the GraphQL subgraphs from different services
 * and provides a unified GraphQL API.
 */

import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';

// Custom data source that forwards the authentication token
class AuthDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // If we have a token in the context, add it to the headers
    if (context.token) {
      request.http.headers.set('authorization', context.token);
    }
  }
}

// List of all integrated apps with their GraphQL endpoints
const apps = [
  { name: 'terrafusionsync', url: 'http://localhost:3001/graphql' },
  { name: 'terrafusionpro', url: 'http://localhost:3002/graphql' },
  { name: 'terraflow', url: 'http://localhost:3003/graphql' },
  { name: 'terraminer', url: 'http://localhost:3004/graphql' },
  { name: 'terraagent', url: 'http://localhost:3005/graphql' },
  { name: 'terraf', url: 'http://localhost:3006/graphql' },
  { name: 'terralegislativepulsepub', url: 'http://localhost:3007/graphql' },
  { name: 'bcbscostapp', url: 'http://localhost:3008/graphql' },
  { name: 'bcbsgeoassessmentpro', url: 'http://localhost:3009/graphql' },
  { name: 'bcbslevy', url: 'http://localhost:3010/graphql' },
  { name: 'bcbswebhub', url: 'http://localhost:3011/graphql' },
  { name: 'bcbsdataengine', url: 'http://localhost:3012/graphql' },
  { name: 'bcbspacsmapping', url: 'http://localhost:3013/graphql' },
  { name: 'geoassessmentpro', url: 'http://localhost:3014/graphql' },
  { name: 'bsbcmaster', url: 'http://localhost:3015/graphql' },
  { name: 'bsincomevaluation', url: 'http://localhost:3016/graphql' },
  { name: 'terrafusionmockup', url: 'http://localhost:3017/graphql' }
];

// Create the Apollo Gateway
const gateway = new ApolloGateway({
  serviceList: apps,
  buildService: ({ name, url }) => {
    console.log(`Configuring service: ${name} at ${url}`);
    return new AuthDataSource({ url });
  },
});

// Initialize the Apollo Server with the gateway
const server = new ApolloServer({
  gateway,
  subscriptions: false, // Federation doesn't support subscriptions yet
  context: ({ req }) => {
    // Get the authorization token from the headers
    const token = req.headers.authorization || '';
    return { token };
  }
});

// The port for the gateway
const PORT = process.env.PORT || 4000;

// Start the server
server.listen({ port: PORT }).then(({ url }) => {
  console.log(`🚀 Apollo Gateway ready at ${url}`);
  console.log(`🔗 Connected to ${apps.length} subgraphs`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Apollo Gateway...');
  server.stop();
  process.exit(0);
});