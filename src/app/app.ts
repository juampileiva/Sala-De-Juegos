import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { supabase } from './services/supabase';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  estaLogueado = false;
  emailUsuario = '';
  menuAbierto = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.obtenerUsuario();

    this.authService.escucharCambiosSesion(async () => {
      await this.obtenerUsuario();
    });
  }

  async obtenerUsuario() {
    const { data } = await this.authService.obtenerSesion();
    const user = data.session?.user;

    if (!user) {
      this.estaLogueado = false;
      this.emailUsuario = '';
      this.menuAbierto = false;
      this.cdr.detectChanges();
      return;
    }

    this.estaLogueado = true;

    const { data: usuarioDB } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle();

    this.emailUsuario = usuarioDB?.nombre || user.email || '';

    this.cdr.detectChanges();
  }

  abrirCerrarMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }
}