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
- **Modo rápido (predeterminado):** elegís tres objetivos y confirmás la salva. Hundimiento al 25 % del barco (redondeado hacia arriba), máximo de 20 rondas completas. Una ronda incluye ambos turnos. Gana quien haya hundido más barcos; desempata el daño total causado como porcentaje de la flota inicial, idéntica para ambos. Si coincide, hay empate.
- **Modo clásico:** un objetivo y confirmación por turno, sin límite de rondas y hundimiento al 100 %.
- Los impactos repetidos y sobre barcos ya hundidos no suman daño.
- En ambos modos, hundir los cuatro barcos da la victoria inmediata. El clásico puede ser largo por el tamaño de los barcos.
- El panel inferior muestra ilustraciones provisorias con marcas según la ubicación de los impactos en cada barco. Los barcos rivales aparecen cuando reciben daño; no se muestran sus coordenadas. Las imágenes propias de barcos de lata están pendientes de incorporar.
- La computadora busca cerca de impactos conocidos; no consulta las posiciones ocultas.
- Para apuntar con teclado, enfocar el radar, usar flechas y pulsar Enter o espacio.

El modo de dos jugadores es local; no incluye juego en red ni protección frente a alguien que inspeccione el estado del navegador.
