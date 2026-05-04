import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { QuienSoy } from './pages/quien-soy/quien-soy';

import { Ahorcado } from './pages/ahorcado/ahorcado';
import { MayorMenor } from './pages/mayor-menor/mayor-menor';
import { Chat } from './pages/chat/chat';

import { Logout } from './pages/logout/logout';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'quien-soy', component: QuienSoy },

  { path: 'ahorcado', component: Ahorcado },
  { path: 'mayor-menor', component: MayorMenor },
  { path: 'chat', component: Chat },

  { path: 'logout', component: Logout },

  { path: '**', redirectTo: 'home' }
];