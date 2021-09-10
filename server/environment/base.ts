export const environment = {
  /**
   * Identify itself. Current MicroService Name and ID in Database
   */
  service: {
    _id: 'PROJECT_MANAGER',
    name: 'project-manager',
    url: '/project-manager',
    description: 'project-manager',
    serviceType: 'any',
    envStatus: 'ALPHA',
    iconClass: 'fa fa-comments'
  },
  /**
   * App running port
   */
  port: process.env.PORT || 3000,
  /**
   * App environment
   */
  production: false,
  /**
   * Logger
   */
  log: {
    format: process.env.LOG_FORMAT || 'combined',
    fileLogger: {
      level: 'debug',
      directoryPath: process.env.LOG_DIR_PATH || (process.cwd() + '/logs/'),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  /**
   * Database connection information
   */
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/isabel'
  },
  mailer: {
    host: 'localhost',
    port: '2525',
    from: '"DEV Isabel - FedoraLabs" <no-reply@testingdomain.io>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || `amqp://ai-rabbit:Ne&ZTeFeYCqqQRK3s7qF@localhost:5672`
  },
  authURI: `https://dev.aitheon.com/auth`,
  baseURI: `https://${process.env.DOMAIN || 'dev.aitheon.com'}`,
  driveURI: `https://${process.env.DOMAIN || 'dev.aitheon.com'}/drive`,
  sharedResourceSecret: 'secret1234',
};
