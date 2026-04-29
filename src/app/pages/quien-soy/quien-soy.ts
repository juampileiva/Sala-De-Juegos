import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-quien-soy',
  imports: [CommonModule],
  templateUrl: './quien-soy.html',
  styleUrl: './quien-soy.css'
})
export class QuienSoy implements OnInit {
  usuario: any;

  ngOnInit() {
    fetch('https://api.github.com/users/juampileiva')
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        this.usuario = datos;
      });
  }
}