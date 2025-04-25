/**
 * TerraFusion Core Gateway with Apollo Federation
 * 
 * This gateway orchestrates all the GraphQL subgraphs from different services
 * and provides a unified GraphQL API.
 */

import { ApolloGateway, RemoteGraphQLDataSource, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import http from 'http';

// Custom data source that forwards the authentication token
class AuthDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // If we have a token in the context, add it to the headers
    if (context.token) {
      request.http.headers.set('authorization', context.token);
    }
  }

  // Override the didReceiveError method to handle 404s and other errors
  async didReceiveError({ response, context, request }) {
    console.warn(`Error from service: ${request.http.url.toString()}, status: ${response?.status}`);
    return super.didReceiveError({ response, context, request });
  }
}

// For this demonstration, we'll create a simple schema for the gateway
// since we don't have actual subgraphs running yet
const typeDefs = `
  type Query {
    serviceInfo: ServiceInfo
    healthCheck: HealthStatus
  }
  
  type ServiceInfo {
    name: String
    version: String
    services: [Service]
  }
  
  type Service {
    name: String
    url: String
    status: String
  }
  
  type HealthStatus {
    status: String
    timestamp: String
  }
`;

const resolvers = {
  Query: {
    serviceInfo: () => ({
      name: 'TerraFusionPro Gateway',
      version: '1.0.0',
      services: apps.map(app => ({ 
        name: app.name, 
        url: app.url,
        status: 'pending' 
      }))
    }),
    healthCheck: () => ({
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  }
};

// List of all integrated apps with their GraphQL endpoints
const externalApps = [
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

// List of existing TerraFusion services with their current port configuration
const existingServices = [
  { name: 'user-service', url: 'http://localhost:5004/graphql' },
  { name: 'property-service', url: 'http://localhost:5003/graphql' },
  { name: 'form-service', url: 'http://localhost:5005/graphql' },
  { name: 'analysis-service', url: 'http://localhost:5006/graphql' },
  { name: 'report-service', url: 'http://localhost:5007/graphql' }
];

// Combine all apps
const apps = [...externalApps, ...existingServices];

// Function to check if a service is available
const checkServiceAvailability = (url) => {
  // Extract hostname and port from the URL
  const serviceUrl = new URL(url);
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: serviceUrl.hostname,
        port: serviceUrl.port,
        path: '/health',
        method: 'GET',
        timeout: 1000,
      },
      (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
};

// For now, we're using a mock schema for demonstration since our services don't have 
// actual GraphQL endpoints exposed
const generateMockSchemaForService = (serviceName) => {
  // Generate a basic schema for each service
  return `
    extend type Query {
      ${serviceName}Info: ServiceInfo
      ${serviceName}Health: HealthStatus
    }
    
    type ServiceInfo {
      name: String
      version: String
    }
    
    type HealthStatus {
      status: String
      timestamp: String
    }
  `;
};

// Start with our own schema until federation is ready
let gateway = null;
let server = null;

// Check which services are available and create the gateway
const setupGateway = async () => {
  try {
    console.log('Checking service availability...');
    const availabilityPromises = apps.map(async (app) => {
      const isAvailable = await checkServiceAvailability(app.url.replace('/graphql', ''));
      return { ...app, isAvailable };
    });
    
    const availabilityResults = await Promise.all(availabilityPromises);
    const availableServices = availabilityResults.filter(service => service.isAvailable);
    const availableCount = availableServices.length;
    
    console.log(`Found ${availableCount} available services out of ${apps.length}`);
    
    // For this demonstration, we'll use a local schema regardless of service availability
    // since our services don't have actual GraphQL endpoints yet
    console.log('Using local schema for demonstration');
    
    // Enhanced typeDefs to include information about available services
    const enhancedTypeDefs = `
      type Query {
        serviceInfo: ServiceInfo
        healthCheck: HealthStatus
        availableServices: [Service]
      }
      
      type ServiceInfo {
        name: String
        version: String
        services: [Service]
      }
      
      type Service {
        name: String
        url: String
        status: String
        available: Boolean
      }
      
      type HealthStatus {
        status: String
        timestamp: String
      }
    `;
    
    // Enhanced resolvers to provide information about available services
    const enhancedResolvers = {
      Query: {
        serviceInfo: () => ({
          name: 'TerraFusionPro Gateway',
          version: '1.0.0',
          services: apps.map(app => ({ 
            name: app.name, 
            url: app.url,
            status: 'pending' 
          }))
        }),
        healthCheck: () => ({
          status: 'healthy',
          timestamp: new Date().toISOString()
        }),
        availableServices: () => availabilityResults.map(service => ({
          name: service.name,
          url: service.url,
          status: service.isAvailable ? 'up' : 'down',
          available: service.isAvailable
        }))
      }
    };
    
    // Create standalone server with our enhanced schema
    server = new ApolloServer({
      typeDefs: enhancedTypeDefs,
      resolvers: enhancedResolvers,
      context: ({ req }) => {
        const token = req.headers.authorization || '';
        return { token };
      }
    });
    
    return server;
  } catch (error) {
    console.error('Error setting up gateway:', error);
    // Fallback to local schema on error
    return new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        const token = req.headers.authorization || '';
        return { token };
      }
    });
  }
};

// The port for the gateway
const PORT = process.env.PORT || 4000;

// Main function to start the server
const startServer = async () => {
  try {
    // Set up the gateway based on available services
    const apolloServer = await setupGateway();
    
    // Start the server
    const { url } = await apolloServer.listen({ port: PORT });
    console.log(`🚀 Apollo Gateway ready at ${url}`);
    
    // Create a simple Express server for health checks
    const healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'apollo-federation-gateway',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    healthServer.listen(4001, () => {
      console.log('Health check server running on port 4001');
    });
    
    return apolloServer;
  } catch (error) {
    console.error('Failed to start Apollo Gateway:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('Unhandled error during server startup:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Apollo Gateway...');
  if (server) {
    server.stop();
  }
  process.exit(0);
});