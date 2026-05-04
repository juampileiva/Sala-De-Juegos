import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  emailUsuario = '';
  estaLogueado = false;

  async ngOnInit() {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      this.estaLogueado = true;
      this.emailUsuario = data.user.email || '';
    }
  }

  async cerrarSesion() {
    await supabase.auth.signOut();

    this.estaLogueado = false;
    this.emailUsuario = '';
  }
}