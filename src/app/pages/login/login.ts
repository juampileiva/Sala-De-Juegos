import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { supabase } from '../../services/supabase';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';

  mensaje = '';
  cargando = false;
  mostrarRapidos = false;

  usuariosRapidos = [
    { texto: 'Jugador 1', email: 'jugador1@test.com', password: '123456' },
    { texto: 'Jugador 2', email: 'jugador2@test.com', password: '123456' },
    { texto: 'Jugador 3', email: 'jugador3@test.com', password: '123456' }
  ];

  async ingresar() {
    this.mensaje = '';

    const emailLimpio = this.email.trim().toLowerCase();

    if (!emailLimpio || !this.password) {
      this.mensaje = 'Debe ingresar correo y contraseña.';
      return;
    }

    this.cargando = true;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password: this.password
    });

    this.cargando = false;

    if (error) {
      this.mensaje = 'Correo o contraseña incorrectos.';
      return;
    }

    window.location.replace('/home');
  }

  toggleRapidos() {
    this.mostrarRapidos = !this.mostrarRapidos;
  }

  cargarUsuarioRapido(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.mostrarRapidos = false;
  }
}