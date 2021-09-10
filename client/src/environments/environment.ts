// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  service: 'PROJECT_MANAGER',
  production: false,
  baseApi: 'https://dev.aitheon.com',
  contactsURI: 'https://dev.aitheon.com/contacts',
  orchestratorURI: 'https://dev.aitheon.com/orchestrator',
  mailboxURI: 'https://dev.aitheon.com/mailbox',
  utilitiesURI: 'https://dev.aitheon.com/utilities',
  usersURI: 'https://dev.aitheon.com/users',
  driveURI: 'https://dev.aitheon.com/drive'
};

