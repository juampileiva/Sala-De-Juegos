import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';

interface PreguntaApi {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface PreguntaJuego {
  pregunta: string;
  respuestaCorrecta: string;
  opciones: string[];
}

@Component({
  selector: 'app-preguntados',
  imports: [CommonModule, RouterLink],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css'
})
export class Preguntados implements OnInit {
  usuarioId = '';
  emailUsuario = '';
  nombreUsuario = '';

  estaLogueado = false;
  cargando = true;
  guardando = false;

  preguntas: PreguntaJuego[] = [];
  indiceActual = 0;

  aciertos = 0;
  errores = 0;
  puntaje = 0;

  respuestaSeleccionada = '';
  mensaje = '';

  inicioTiempo = 0;
  tiempoSegundos = 0;

  finalizo = false;
  resultado = '';

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.obtenerUsuario();

    if (this.estaLogueado) {
      await this.cargarPreguntas();
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

  async cargarPreguntas() {
    this.cargando = true;
    this.mensaje = 'Cargando preguntas desde la API...';

    try {
      const respuesta = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');

      if (!respuesta.ok) {
        this.mensaje = 'No se pudieron cargar las preguntas.';
        return;
      }

      const datos = await respuesta.json();

      this.preguntas = [];

      for (let i = 0; i < datos.results.length; i++) {
        const preguntaApi: PreguntaApi = datos.results[i];

        const opciones = [
          this.limpiarTexto(preguntaApi.correct_answer),
          this.limpiarTexto(preguntaApi.incorrect_answers[0]),
          this.limpiarTexto(preguntaApi.incorrect_answers[1]),
          this.limpiarTexto(preguntaApi.incorrect_answers[2])
        ];

        this.preguntas.push({
          pregunta: this.limpiarTexto(preguntaApi.question),
          respuestaCorrecta: this.limpiarTexto(preguntaApi.correct_answer),
          opciones: this.mezclarOpciones(opciones)
        });
      }

      this.indiceActual = 0;
      this.aciertos = 0;
      this.errores = 0;
      this.puntaje = 0;
      this.respuestaSeleccionada = '';
      this.finalizo = false;
      this.resultado = '';
      this.mensaje = 'Elegí la respuesta correcta.';
      this.inicioTiempo = Date.now();
    } catch (error) {
      this.mensaje = 'Ocurrió un error al conectar con la API de preguntas.';
    } finally {
      this.cargando = false;
    }
  }

  limpiarTexto(texto: string) {
    const area = document.createElement('textarea');
    area.innerHTML = texto;
    return area.value;
  }

  mezclarOpciones(opciones: string[]) {
    const copia = [...opciones];

    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const aux = copia[i];
      copia[i] = copia[j];
      copia[j] = aux;
    }

    return copia;
  }

  obtenerPreguntaActual() {
    return this.preguntas[this.indiceActual];
  }

  async responder(opcion: string) {
    if (this.finalizo || this.respuestaSeleccionada) {
      return;
    }

    const preguntaActual = this.obtenerPreguntaActual();

    if (!preguntaActual) {
      return;
    }

    this.respuestaSeleccionada = opcion;

    if (opcion === preguntaActual.respuestaCorrecta) {
      this.aciertos++;
      this.puntaje += 10;
      this.mensaje = 'Respuesta correcta. Sumaste 10 puntos.';
    } else {
      this.errores++;
      this.mensaje = 'Respuesta incorrecta. La correcta era: ' + preguntaActual.respuestaCorrecta;
    }

    this.cdr.detectChanges();
  }

  async siguientePregunta() {
    if (!this.respuestaSeleccionada) {
      this.mensaje = 'Primero tenés que elegir una respuesta.';
      return;
    }

    if (this.indiceActual >= this.preguntas.length - 1) {
      await this.finalizarPartida();
      return;
    }

    this.indiceActual++;
    this.respuestaSeleccionada = '';
    this.mensaje = 'Elegí la respuesta correcta.';
    this.cdr.detectChanges();
  }

  obtenerClaseOpcion(opcion: string) {
    if (!this.respuestaSeleccionada) {
      return '';
    }

    const preguntaActual = this.obtenerPreguntaActual();

    if (opcion === preguntaActual.respuestaCorrecta) {
      return 'correcta';
    }

    if (opcion === this.respuestaSeleccionada) {
      return 'incorrecta';
    }

    return '';
  }

  async finalizarPartida() {
    this.finalizo = true;
    this.tiempoSegundos = Math.floor((Date.now() - this.inicioTiempo) / 1000);

    if (this.aciertos >= 6) {
      this.resultado = 'ganado';
      this.mensaje = 'Ganaste. Respondiste correctamente la mayoría de las preguntas.';
    } else {
      this.resultado = 'perdido';
      this.mensaje = 'Perdiste. Necesitabas al menos 6 respuestas correctas.';
    }

    await this.guardarResultado();
    this.cdr.detectChanges();
  }

  async guardarResultado() {
    this.guardando = true;

    const { error } = await supabase.from('resultados_juegos').insert({
      usuario_id: this.usuarioId,
      email: this.emailUsuario,
      nombre: this.nombreUsuario,
      juego: 'preguntados',
      resultado: this.resultado,
      preguntas_acertadas: this.aciertos,
      preguntas_totales: this.preguntas.length,
      puntaje: this.puntaje,
      tiempo_segundos: this.tiempoSegundos,
      detalle: {
        errores: this.errores,
        cantidad_preguntas: this.preguntas.length
      }
    });

    if (error) {
      this.mensaje = 'La partida terminó, pero no se pudo guardar el resultado.';
    }

    this.guardando = false;
  }

  async reiniciar() {
    await this.cargarPreguntas();
    this.cdr.detectChanges();
  }
}