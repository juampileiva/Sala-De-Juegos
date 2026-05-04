import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-quien-soy',
  imports: [CommonModule],
  templateUrl: './quien-soy.html',
  styleUrl: './quien-soy.css'
})
export class QuienSoy implements OnInit {
  usuario: any = null;
  cargando = true;
  mensaje = '';

  async ngOnInit() {
    await this.cargarDatosGithub();
  }

  async cargarDatosGithub() {
    try {
      const respuesta = await fetch('https://api.github.com/users/juampileiva');

      if (!respuesta.ok) {
        this.mensaje = 'No se pudieron cargar los datos de GitHub.';
        return;
      }

      this.usuario = await respuesta.json();
    } catch (error) {
      this.mensaje = 'Ocurrió un error al conectar con GitHub.';
    } finally {
      this.cargando = false;
    }
  }
}