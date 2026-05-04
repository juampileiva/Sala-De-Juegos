import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';

interface Casilla {
  id: number;
  elegida: boolean;
  bomba: boolean;
  puntos: number;
}

@Component({
  selector: 'app-no-explotes',
  imports: [CommonModule, RouterLink],
  templateUrl: './no-explotes.html',
  styleUrl: './no-explotes.css'
})
export class NoExplotes implements OnInit {
  usuarioId = '';
  emailUsuario = '';
  nombreUsuario = '';

  estaLogueado = false;
  cargando = true;
  guardando = false;

  casillas: Casilla[] = [];

  puntaje = 0;
  casillasElegidas = 0;
  bombasCantidad = 5;

  inicioTiempo = 0;
  tiempoSegundos = 0;

  finalizo = false;
  exploto = false;
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
    this.casillas = [];

    for (let i = 1; i <= 20; i++) {
      this.casillas.push({
        id: i,
        elegida: false,
        bomba: false,
        puntos: this.obtenerPuntosAleatorios()
      });
    }

    this.colocarBombas();

    this.puntaje = 0;
    this.casillasElegidas = 0;
    this.tiempoSegundos = 0;
    this.finalizo = false;
    this.exploto = false;
    this.resultado = '';
    this.mensaje = 'Elegí una casilla para sumar puntos. Podés plantarte cuando quieras.';
    this.inicioTiempo = Date.now();
  }

  obtenerPuntosAleatorios() {
    const valores = [5, 10, 15, 20, 25];
    const indice = Math.floor(Math.random() * valores.length);
    return valores[indice];
  }

  colocarBombas() {
    let bombasPuestas = 0;

    while (bombasPuestas < this.bombasCantidad) {
      const indice = Math.floor(Math.random() * this.casillas.length);

      if (!this.casillas[indice].bomba) {
        this.casillas[indice].bomba = true;
        bombasPuestas++;
      }
    }
  }

  async elegirCasilla(casilla: Casilla) {
    if (this.finalizo || casilla.elegida) {
      return;
    }

    casilla.elegida = true;
    this.casillasElegidas++;

    if (casilla.bomba) {
      this.exploto = true;
      this.puntaje = 0;
      this.resultado = 'perdido';
      this.mensaje = 'Explotaste. Perdiste todos los puntos.';
      await this.finalizarPartida();
      return;
    }

    this.puntaje += casilla.puntos;
    this.mensaje = 'Sumaste ' + casilla.puntos + ' puntos. Podés seguir o plantarte.';

    if (this.casillasElegidas === this.casillas.length - this.bombasCantidad) {
      this.resultado = 'ganado';
      this.mensaje = 'Ganaste. Elegiste todas las casillas seguras.';
      await this.finalizarPartida();
      return;
    }

    this.cdr.detectChanges();
  }

  async plantarse() {
    if (this.finalizo || this.casillasElegidas === 0) {
      this.mensaje = 'Tenés que elegir al menos una casilla antes de plantarte.';
      return;
    }

    this.resultado = 'ganado';
    this.exploto = false;
    this.mensaje = 'Te plantaste a tiempo y conservaste tus puntos.';
    await this.finalizarPartida();
  }

  async finalizarPartida() {
    this.finalizo = true;
    this.tiempoSegundos = Math.floor((Date.now() - this.inicioTiempo) / 1000);

    await this.guardarResultado();
    this.cdr.detectChanges();
  }

  async guardarResultado() {
    this.guardando = true;

    const { error } = await supabase.from('resultados_juegos').insert({
      usuario_id: this.usuarioId,
      email: this.emailUsuario,
      nombre: this.nombreUsuario,
      juego: 'no-explotes',
      resultado: this.resultado,
      puntaje: this.puntaje,
      casillas_elegidas: this.casillasElegidas,
      exploto: this.exploto,
      tiempo_segundos: this.tiempoSegundos,
      detalle: {
        bombas: this.bombasCantidad,
        total_casillas: this.casillas.length
      }
    });

    if (error) {
      this.mensaje = 'La partida terminó, pero no se pudo guardar el resultado.';
    }

    this.guardando = false;
  }
}