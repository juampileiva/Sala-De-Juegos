import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-quien-soy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quien-soy.html',
  styleUrls: ['./quien-soy.css']
})
export class QuienSoy implements OnInit {

  usuario: any;

  ngOnInit() {
    fetch('https://api.github.com/users/juampileiva')
      .then(res => res.json())
      .then(data => {
        this.usuario = data;
      });
  }
}