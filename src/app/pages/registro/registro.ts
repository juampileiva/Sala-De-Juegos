import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { supabase } from '../../services/supabase';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  async registrar() {
    this.mensaje = '';

    const emailLimpio = this.email.trim().toLowerCase();
    const nombreLimpio = this.nombre.trim();
    const apellidoLimpio = this.apellido.trim();

    if (!emailLimpio || !nombreLimpio || !apellidoLimpio || !this.edad || !this.password) {
      this.mensaje = 'Todos los campos son obligatorios.';
      return;
    }

    if (this.password.length < 6) {
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    try {
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', emailLimpio)
        .maybeSingle();

      if (usuarioExistente) {
        this.mensaje = 'Ya existe un usuario registrado con ese correo.';
        return;
      }

      const { data, error } = await this.authService.registrar(
        emailLimpio,
        this.password
      );

      if (error) {
        this.mensaje = 'Ya existe un usuario registrado con ese correo.';
        return;
      }

      const usuarioAuth = data.user;

      if (!usuarioAuth) {
        this.mensaje = 'No se pudo crear el usuario.';
        return;
      }

      if (usuarioAuth.identities && usuarioAuth.identities.length === 0) {
        this.mensaje = 'Ya existe un usuario registrado con ese correo.';
        return;
      }

      const { error: errorInsert } = await supabase.from('usuarios').insert({
        id: usuarioAuth.id,
        email: emailLimpio,
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        edad: this.edad
      });

      if (errorInsert) {
        this.mensaje = 'No se pudieron guardar los datos del usuario.';
        return;
      }

      window.location.href = '/login';

    } catch (error) {
      console.log('Error en registro:', error);
      this.mensaje = 'No se pudo completar el registro.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }
}