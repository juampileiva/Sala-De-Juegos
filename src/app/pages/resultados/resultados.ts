import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';

interface ResultadoJuego {
  id: number;
  nombre: string;
  email: string;
  juego: string;
  resultado: string;
  tiempo_segundos: number;
  letras_seleccionadas: number;
  errores: number;
  cartas_acertadas: number;
  cartas_jugadas: number;
  preguntas_acertadas: number;
  preguntas_totales: number;
  puntaje: number;
  casillas_elegidas: number;
  exploto: boolean;
  fecha: string;
}

@Component({
  selector: 'app-resultados',
  imports: [CommonModule, RouterLink],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css'
})
export class Resultados implements OnInit {
  cargando = true;
  mensaje = '';

  resultadosAhorcado: ResultadoJuego[] = [];
  resultadosMayorMenor: ResultadoJuego[] = [];
  resultadosPreguntados: ResultadoJuego[] = [];
  resultadosNoExplotes: ResultadoJuego[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargarResultados();
  }

  async cargarResultados() {
    this.cargando = true;
    this.mensaje = '';

    const { data, error } = await supabase
      .from('resultados_juegos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      this.mensaje = 'No se pudieron cargar los resultados.';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    const resultados = data || [];

    this.resultadosAhorcado = resultados
      .filter((item: ResultadoJuego) => item.juego === 'ahorcado')
      .sort((a: ResultadoJuego, b: ResultadoJuego) => {
        if (a.resultado !== b.resultado) {
          return a.resultado === 'ganado' ? -1 : 1;
        }

        return (a.errores || 0) - (b.errores || 0);
      });

    this.resultadosMayorMenor = resultados
      .filter((item: ResultadoJuego) => item.juego === 'mayor-menor')
      .sort((a: ResultadoJuego, b: ResultadoJuego) => {
        return (b.cartas_acertadas || 0) - (a.cartas_acertadas || 0);
      });

    this.resultadosPreguntados = resultados
      .filter((item: ResultadoJuego) => item.juego === 'preguntados')
      .sort((a: ResultadoJuego, b: ResultadoJuego) => {
        return (b.puntaje || 0) - (a.puntaje || 0);
      });

    this.resultadosNoExplotes = resultados
      .filter((item: ResultadoJuego) => item.juego === 'no-explotes')
      .sort((a: ResultadoJuego, b: ResultadoJuego) => {
        return (b.puntaje || 0) - (a.puntaje || 0);
      });

    this.cargando = false;
    this.cdr.detectChanges();
  }

  obtenerJugador(resultado: ResultadoJuego) {
    return resultado.nombre || resultado.email || 'Jugador';
  }

  formatearFecha(fecha: string) {
    if (!fecha) {
      return '-';
    }

    return new Date(fecha).toLocaleString('es-AR');
  }
}