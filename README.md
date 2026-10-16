# English365 v2.4

## Cambios
- «Otra vez» reintroduce la tarjeta en la misma sesión después de 1 minuto. Si no quedan otras, muestra una espera automática.
- Cada botón muestra el intervalo previsto según el historial.
- Repaso prioriza tarjetas vencidas (hasta 20 por sesión) y ofrece por separado aprender hasta 10 nuevas.
- Se conserva `english365_progress_v1`, los IDs de tarjetas, la gramática y las categorías de v2.3.

## Actualización
1. Exporta el progreso JSON antes de actualizar.
2. Sustituye `app.js` y `sw.js` en la raíz de GitHub.
3. Espera la publicación de GitHub Pages y recarga English365.

La repetición espaciada sigue siendo un algoritmo sencillo propio, no FSRS/Anki. Los intervalos se calculan en el momento de contestar.
