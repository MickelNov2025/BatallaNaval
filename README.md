# Batalla Naval

Juego de navegador en español, sin dependencias externas. Rival virtual o dos jugadores por turnos en el mismo dispositivo, con pantalla de privacidad al cambiar de jugador.

## Ejecutar

Requiere Python 3 para el servidor local. Desde el repositorio:

```sh
npm start
```

Abrir el puerto 8000 en el navegador. También se puede ejecutar `python3 -m http.server 8000` sin npm. Para las pruebas de lógica, usar Node.js 18 o posterior:

```sh
npm test
```

## Reglas

- Tablero de 60 × 60 celdas. Flotas automáticas sin superposiciones; antes de comenzar se puede redistribuir la propia.
- Cuatro barcos de 9 celdas de ancho y 45, 36, 27 y 18 de largo (5, 4, 3 y 2 veces el ancho).
- Cada disparo afecta un cuadrado de 3 × 3 celdas. Hay un 65 % de probabilidad de mantener el centro y un 35 % de desviarse a una de las otras 24 posiciones a hasta dos celdas por eje. En los bordes se ajusta el centro para conservar las nueve celdas.
- Un disparo por turno, incluso al acertar. Los impactos repetidos no vuelven a causar daño.
- Un barco se hunde cuando todas sus celdas han recibido impactos. Gana quien hunda los cuatro barcos enemigos. Las partidas pueden ser largas por el tamaño de los barcos.
- La computadora busca cerca de impactos conocidos; no consulta las posiciones ocultas.
- Para apuntar con teclado, enfocar el radar, usar flechas y pulsar Enter o espacio.

El modo de dos jugadores es local; no incluye juego en red ni protección frente a alguien que inspeccione el estado del navegador.
