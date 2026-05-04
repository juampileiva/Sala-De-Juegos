import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  usuariosRapidos = [
    { texto: 'Jugador 1', email: 'jugador1@test.com', password: '123456' },
    { texto: 'Jugador 2', email: 'jugador2@test.com', password: '123456' },
    { texto: 'Jugador 3', email: 'jugador3@test.com', password: '123456' }
  ];

  constructor(private router: Router) {}

  async ingresar() {
    this.mensaje = '';

    if (!this.email || !this.password) {
      this.mensaje = 'Debe ingresar correo y contraseña.';
      return;
    }

    this.cargando = true;

    const { error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password
    });

    this.cargando = false;

    if (error) {
      this.mensaje = 'Correo o contraseña incorrectos.';
      return;
    }

    this.router.navigate(['/home']);
  }

  cargarUsuarioRapido(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}