import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  estaLogueado = false;
  emailUsuario = '';

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
}