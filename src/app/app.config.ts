import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { MockRoleRepository, MockUserRepository, ROLE_API, USER_API } from './core/repositories';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: USER_API, useClass: MockUserRepository },
    { provide: ROLE_API, useClass: MockRoleRepository },
  ],
};
