import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';

@Component({
  selector: 'app-ahorcado',
  imports: [CommonModule, RouterLink],
  templateUrl: './ahorcado.html',
  styleUrl: './ahorcado.css'
})
export class Ahorcado implements OnInit {
  usuarioId = '';
  emailUsuario = '';
  nombreUsuario = '';

  cargando = true;
  estaLogueado = false;

  palabras = [
    'ANGULAR',
    'SUPABASE',
    'PROGRAMACION',
    'COMPONENTE',
    'SERVICIO',
    'VARIABLE',
    'FUNCION',
    'NAVEGADOR',
    'JUGADOR',
    'TECLADO'
  ];

  abecedario = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q',
    'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  palabraSecreta = '';
  letrasSeleccionadas: string[] = [];
  errores = 0;
  maxErrores = 6;

  inicioTiempo = 0;
  tiempoSegundos = 0;

  finalizo = false;
  resultado = '';
  mensaje = '';

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.obtenerUsuario();

    if (this.estaLogueado) {
      this.iniciarPartida();
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  async obtenerUsuario() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      this.estaLogueado = false;
      return;
    }

    this.usuarioId = user.id;
    this.emailUsuario = user.email || '';
    this.estaLogueado = true;

    const { data: usuarioDB } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle();

    this.nombreUsuario = usuarioDB?.nombre || this.emailUsuario;
  }

  iniciarPartida() {
    const indice = Math.floor(Math.random() * this.palabras.length);

    this.palabraSecreta = this.palabras[indice];
    this.letrasSeleccionadas = [];
    this.errores = 0;
    this.tiempoSegundos = 0;
    this.finalizo = false;
    this.resultado = '';
    this.mensaje = '';
    this.inicioTiempo = Date.now();
  }

  obtenerPalabraMostrada() {
    let palabra = '';

    for (let i = 0; i < this.palabraSecreta.length; i++) {
      const letra = this.palabraSecreta[i];

      if (this.letrasSeleccionadas.includes(letra)) {
        palabra += letra + ' ';
      } else {
        palabra += '_ ';
      }
    }

    return palabra.trim();
  }

  letraYaSeleccionada(letra: string) {
    return this.letrasSeleccionadas.includes(letra);
  }

  async seleccionarLetra(letra: string) {
    if (this.finalizo || this.letraYaSeleccionada(letra)) {
      return;
    }

    this.letrasSeleccionadas.push(letra);

    if (!this.palabraSecreta.includes(letra)) {
      this.errores++;
    }

    await this.verificarEstado();
  }

  async verificarEstado() {
    let gano = true;

    for (let i = 0; i < this.palabraSecreta.length; i++) {
      const letra = this.palabraSecreta[i];

      if (!this.letrasSeleccionadas.includes(letra)) {
        gano = false;
      }
    }

    if (gano) {
      this.finalizo = true;
      this.resultado = 'ganado';
      this.mensaje = 'Ganaste. Descubriste la palabra correctamente.';
      await this.finalizarPartida();
      return;
    }

    if (this.errores >= this.maxErrores) {
      this.finalizo = true;
      this.resultado = 'perdido';
      this.mensaje = 'Perdiste. Se terminaron los intentos.';
      await this.finalizarPartida();
    }
  }

  async finalizarPartida() {
    this.tiempoSegundos = Math.floor((Date.now() - this.inicioTiempo) / 1000);

    const { error } = await supabase.from('resultados_juegos').insert({
      usuario_id: this.usuarioId,
      email: this.emailUsuario,
      nombre: this.nombreUsuario,
      juego: 'ahorcado',
      resultado: this.resultado,
      tiempo_segundos: this.tiempoSegundos,
      letras_seleccionadas: this.letrasSeleccionadas.length,
      errores: this.errores,
      detalle: {
        palabra: this.palabraSecreta,
        letras: this.letrasSeleccionadas
      }
    });

    if (error) {
      this.mensaje = 'La partida terminó, pero no se pudo guardar el resultado.';
    }

    this.cdr.detectChanges();
  }
}