import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { supabase } from '../../services/supabase';

@Component({
  selector: 'app-logout',
  imports: [CommonModule],
  templateUrl: './logout.html',
  styleUrl: './logout.css'
})
export class Logout implements OnInit {
  ngOnInit() {
    this.cerrarSesion();
  }

  cerrarSesion() {
    try {
      supabase.auth.signOut();
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
    }

    this.limpiarStorage();

    window.location.replace('/login');
  }

  limpiarStorage() {
    const clavesLocal: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);

      if (
        clave &&
        (
          clave.toLowerCase().includes('supabase') ||
          clave.toLowerCase().startsWith('sb-') ||
          clave.toLowerCase().includes('auth-token')
        )
      ) {
        clavesLocal.push(clave);
      }
    }

    for (let i = 0; i < clavesLocal.length; i++) {
      localStorage.removeItem(clavesLocal[i]);
    }

    const clavesSession: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const clave = sessionStorage.key(i);

      if (
        clave &&
        (
          clave.toLowerCase().includes('supabase') ||
          clave.toLowerCase().startsWith('sb-') ||
          clave.toLowerCase().includes('auth-token')
        )
      ) {
        clavesSession.push(clave);
      }
    }

    for (let i = 0; i < clavesSession.length; i++) {
      sessionStorage.removeItem(clavesSession[i]);
    }
  }
}