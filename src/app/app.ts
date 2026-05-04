import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { supabase } from './services/supabase';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  estaLogueado = false;
  emailUsuario = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.obtenerUsuario();

    supabase.auth.onAuthStateChange(async () => {
      await this.obtenerUsuario();
    });
  }

  async obtenerUsuario() {
    const { data } = await supabase.auth.getSession();
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

  async cerrarSesion() {
    await supabase.auth.signOut();

    this.estaLogueado = false;
    this.emailUsuario = '';
    this.cdr.detectChanges();

    this.router.navigateByUrl('/login');
  }
}