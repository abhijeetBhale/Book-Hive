import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'BookHive API',
    version: '2.0.0',
    description: 'Community-driven platform for modern readers - API Documentation',
    contact: {
      name: 'BookHive Team',
      url: 'https://github.com/abhijeetbhale/Book-Hive',
      email: 'support@bookhive.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.CLIENT_URL?.replace(':3000', ':5000') || 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: 'https://book-hive-backend.onrender.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'User ID',
          },
          name: {
            type: 'string',
            description: 'User full name',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          role: {
            type: 'string',
            enum: ['user', 'organizer', 'admin', 'superadmin'],
            description: 'User role',
          },
          avatar: {
            type: 'string',
            description: 'User avatar URL',
          },
          location: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['Point'],
              },
              coordinates: {
                type: 'array',
                items: {
                  type: 'number',
                },
                description: '[longitude, latitude]',
              },
              address: {
                type: 'string',
                description: 'Human-readable address',
              },
            },
          },
          rating: {
            type: 'object',
            properties: {
              overallRating: {
                type: 'number',
                minimum: 0,
                maximum: 5,
              },
              totalRatings: {
                type: 'number',
              },
              reviewCount: {
                type: 'number',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Book: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Book ID',
          },
          title: {
            type: 'string',
            description: 'Book title',
          },
          author: {
            type: 'string',
            description: 'Book author',
          },
          description: {
            type: 'string',
            description: 'Book description',
          },
          category: {
            type: 'string',
            description: 'Book category',
          },
          condition: {
            type: 'string',
            enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
            description: 'Book condition',
          },
          coverImage: {
            type: 'string',
            description: 'Book cover image URL',
          },
          isAvailable: {
            type: 'boolean',
            description: 'Book availability status',
          },
          owner: {
            $ref: '#/components/schemas/User',
          },
          location: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['Point'],
              },
              coordinates: {
                type: 'array',
                items: {
                  type: 'number',
                },
                description: '[longitude, latitude]',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      BorrowRequest: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Request ID',
          },
          book: {
            $ref: '#/components/schemas/Book',
          },
          requester: {
            $ref: '#/components/schemas/User',
          },
          owner: {
            $ref: '#/components/schemas/User',
          },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
            description: 'Request status',
          },
          message: {
            type: 'string',
            description: 'Request message',
          },
          borrowDate: {
            type: 'string',
            format: 'date-time',
          },
          returnDate: {
            type: 'string',
            format: 'date-time',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Role: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Role ID',
          },
          name: {
            type: 'string',
            description: 'Role name (lowercase)',
          },
          displayName: {
            type: 'string',
            description: 'Role display name',
          },
          description: {
            type: 'string',
            description: 'Role description',
          },
          permissions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Role permissions',
          },
          isActive: {
            type: 'boolean',
            description: 'Role active status',
          },
          isSystem: {
            type: 'boolean',
            description: 'System role (cannot be deleted)',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Success message',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: 'Authentication required',
              code: 'AUTH_REQUIRED',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: 'Resource not found',
              code: 'RESOURCE_NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: {
                field: 'Field is required',
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
    {
      name: 'Users',
      description: 'User management',
    },
    {
      name: 'Books',
      description: 'Book management',
    },
    {
      name: 'Borrow Requests',
      description: 'Book borrowing system',
    },
    {
      name: 'RBAC',
      description: 'Role-based access control',
    },
    {
      name: 'Jobs',
      description: 'Background job management',
    },
    {
      name: 'System',
      description: 'System health and monitoring',
    },
  ],
};

// Options for swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js',
    './middleware/*.js',
    './server.js',
  ],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2563eb }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 5px }
  `,
  customSiteTitle: 'BookHive API Documentation',
  customfavIcon: '/favicon.ico',
};

export { swaggerSpec, swaggerUi, swaggerUiOptions };