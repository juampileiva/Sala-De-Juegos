import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { supabase } from '../../services/supabase';

interface MensajeChat {
  id: number;
  usuario_id: string;
  email: string;
  nombre: string;
  mensaje: string;
  fecha: string;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy {
  usuarioId = '';
  emailUsuario = '';
  nombreUsuario = '';

  estaLogueado = false;
  cargando = true;
  enviando = false;

  mensajes: MensajeChat[] = [];
  mensajeNuevo = '';
  aviso = '';

  canal: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.obtenerUsuario();

    if (this.estaLogueado) {
      await this.cargarMensajes();
      this.suscribirseAlChat();
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.canal) {
      supabase.removeChannel(this.canal);
    }
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

  async cargarMensajes() {
    const { data, error } = await supabase
      .from('mensajes_chat')
      .select('*')
      .order('fecha', { ascending: true })
      .limit(100);

    if (error) {
      this.aviso = 'No se pudieron cargar los mensajes.';
      return;
    }

    this.mensajes = data || [];
  }

  suscribirseAlChat() {
    this.canal = supabase
      .channel('sala-chat-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_chat'
        },
        (payload) => {
          const mensaje = payload.new as MensajeChat;

          let existe = false;

          for (let i = 0; i < this.mensajes.length; i++) {
            if (this.mensajes[i].id === mensaje.id) {
              existe = true;
            }
          }

          if (!existe) {
            this.mensajes.push(mensaje);
            this.cdr.detectChanges();
          }
        }
      )
      .subscribe();
  }

  async enviarMensaje() {
    const texto = this.mensajeNuevo.trim();

    if (!texto) {
      this.aviso = 'Escribí un mensaje antes de enviar.';
      return;
    }

    this.enviando = true;
    this.aviso = '';

    const { error } = await supabase.from('mensajes_chat').insert({
      usuario_id: this.usuarioId,
      email: this.emailUsuario,
      nombre: this.nombreUsuario,
      mensaje: texto
    });

    if (error) {
      this.aviso = 'No se pudo enviar el mensaje.';
      this.enviando = false;
      this.cdr.detectChanges();
      return;
    }

    this.mensajeNuevo = '';
    this.enviando = false;
    this.cdr.detectChanges();
  }

  esMensajePropio(mensaje: MensajeChat) {
    return mensaje.usuario_id === this.usuarioId;
  }

  obtenerHora(fecha: string) {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}