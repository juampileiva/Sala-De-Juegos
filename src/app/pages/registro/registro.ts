import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { supabase } from '../../services/supabase';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  email = '';
  nombre = '';
  apellido = '';
  edad: number | null = null;
  password = '';

  mensaje = '';
  cargando = false;

  constructor(private router: Router) {}

  async registrar() {
    this.mensaje = '';

    if (!this.email || !this.nombre || !this.apellido || !this.edad || !this.password) {
      this.mensaje = 'Todos los campos son obligatorios.';
      return;
    }

    this.cargando = true;

    const { data, error } = await supabase.auth.signUp({
      email: this.email,
      password: this.password
    });

    if (error) {
      this.mensaje = 'No se pudo registrar el usuario. Verifique si ya existe.';
      this.cargando = false;
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      this.mensaje = 'No se pudo obtener el usuario registrado.';
      this.cargando = false;
      return;
    }

    const { error: errorTabla } = await supabase.from('usuarios').insert({
      id: userId,
      email: this.email,
      nombre: this.nombre,
      apellido: this.apellido,
      edad: this.edad
    });

    if (errorTabla) {
      this.mensaje = 'El usuario se creó, pero no se pudieron guardar sus datos.';
      this.cargando = false;
      return;
    }

    this.cargando = false;
    this.router.navigate(['/home']);
  }
}