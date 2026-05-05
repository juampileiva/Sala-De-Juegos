import { Injectable } from '@angular/core';
import { supabase } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async registrar(correo: string, password: string) {
    return await supabase.auth.signUp({
      email: correo,
      password: password
    });
  }

  async iniciarSesion(correo: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });
  }

  async cerrarSesion() {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      console.log('Error en AuthService cerrarSesion:', error);
      return { error };
    }
  }

  async obtenerSesion() {
    try {
      return await supabase.auth.getSession();
    } catch (error) {
      console.log('Error en AuthService obtenerSesion:', error);

      return {
        data: {
          session: null
        },
        error
      };
    }
  }

  async obtenerUsuario() {
    try {
      return await supabase.auth.getUser();
    } catch (error) {
      console.log('Error en AuthService obtenerUsuario:', error);

      return {
        data: {
          user: null
        },
        error
      };
    }
  }

  escucharCambiosSesion(callback: any) {
    return supabase.auth.onAuthStateChange(callback);
  }
}