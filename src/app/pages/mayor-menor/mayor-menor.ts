import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';
import { AuthService } from '../../services/auth.service';

type Eleccion = 'mayor' | 'menor';

interface Carta {
  valor: number;
  nombre: string;
  palo: string;
  simbolo: string;
}

@Component({
  selector: 'app-mayor-menor',
  imports: [CommonModule, RouterLink],
  templateUrl: './mayor-menor.html',
  styleUrl: './mayor-menor.css'
})
export class MayorMenor implements OnInit {
  usuarioId = '';
  emailUsuario = '';
  nombreUsuario = '';

  cargando = true;
  estaLogueado = false;

  palos = [
    { nombre: 'Corazones', simbolo: '♥' },
    { nombre: 'Diamantes', simbolo: '♦' },
    { nombre: 'Tréboles', simbolo: '♣' },
    { nombre: 'Picas', simbolo: '♠' }
  ];

  baraja: Carta[] = [];
  cartaActual: Carta | null = null;
  cartaAnterior: Carta | null = null;

  aciertos = 0;
  cartasJugadas = 0;
  vidas = 3;
  objetivoAciertos = 10;

  finalizo = false;
  resultado = '';
  mensaje = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.obtenerUsuario();

    if (this.estaLogueado) {
      this.iniciarPartida();
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  async obtenerUsuario() {
    const { data } = await this.authService.obtenerSesion();
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
    this.baraja = this.crearBaraja();
    this.mezclarBaraja();

    this.cartaActual = this.sacarCarta();
    this.cartaAnterior = null;

    this.aciertos = 0;
    this.cartasJugadas = 0;
    this.vidas = 3;
    this.finalizo = false;
    this.resultado = '';
    this.mensaje = 'Elegí si la próxima carta será mayor o menor.';
  }

  crearBaraja() {
    const nuevaBaraja: Carta[] = [];

    for (let i = 0; i < this.palos.length; i++) {
      const palo = this.palos[i];

      for (let valor = 1; valor <= 13; valor++) {
        nuevaBaraja.push({
          valor,
          nombre: this.obtenerNombreCarta(valor),
          palo: palo.nombre,
          simbolo: palo.simbolo
        });
      }
    }

    return nuevaBaraja;
  }

  mezclarBaraja() {
    for (let i = this.baraja.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const aux = this.baraja[i];
      this.baraja[i] = this.baraja[j];
      this.baraja[j] = aux;
    }
  }

  sacarCarta() {
    const carta = this.baraja.pop();

    if (!carta) {
      return null;
    }

    return carta;
  }

  obtenerNombreCarta(valor: number) {
    if (valor === 1) {
      return 'A';
    }

    if (valor === 11) {
      return 'J';
    }

    if (valor === 12) {
      return 'Q';
    }

    if (valor === 13) {
      return 'K';
    }

    return valor.toString();
  }

  async elegir(eleccion: Eleccion) {
    if (this.finalizo || !this.cartaActual) {
      return;
    }

    const proximaCarta = this.sacarCarta();

    if (!proximaCarta) {
      this.finalizo = true;
      this.resultado = 'ganado';
      this.mensaje = 'Ganaste porque se terminó la baraja.';
      await this.guardarResultado();
      return;
    }

    this.cartaAnterior = this.cartaActual;
    this.cartaActual = proximaCarta;
    this.cartasJugadas++;

    if (proximaCarta.valor === this.cartaAnterior.valor) {
      this.mensaje = 'Salió una carta igual. No suma acierto ni resta vida.';
      this.cdr.detectChanges();
      return;
    }

    const acertoMayor = eleccion === 'mayor' && proximaCarta.valor > this.cartaAnterior.valor;
    const acertoMenor = eleccion === 'menor' && proximaCarta.valor < this.cartaAnterior.valor;

    if (acertoMayor || acertoMenor) {
      this.aciertos++;
      this.mensaje = 'Acertaste. Seguí jugando.';

      if (this.aciertos >= this.objetivoAciertos) {
        this.finalizo = true;
        this.resultado = 'ganado';
        this.mensaje = 'Ganaste. Llegaste al objetivo de aciertos.';
        await this.guardarResultado();
      }

      this.cdr.detectChanges();
      return;
    }

    this.vidas--;
    this.mensaje = 'Fallaste. Perdiste una vida.';

    if (this.vidas <= 0) {
      this.finalizo = true;
      this.resultado = 'perdido';
      this.mensaje = 'Perdiste. Te quedaste sin vidas.';
      await this.guardarResultado();
    }

    this.cdr.detectChanges();
  }

  async guardarResultado() {
    const { error } = await supabase.from('resultados_juegos').insert({
      usuario_id: this.usuarioId,
      email: this.emailUsuario,
      nombre: this.nombreUsuario,
      juego: 'mayor-menor',
      resultado: this.resultado,
      cartas_acertadas: this.aciertos,
      cartas_jugadas: this.cartasJugadas,
      detalle: {
        vidas_restantes: this.vidas,
        objetivo_aciertos: this.objetivoAciertos,
        carta_final: this.cartaActual
      }
    });

    if (error) {
      this.mensaje = 'La partida terminó, pero no se pudo guardar el resultado.';
    }
  }
}