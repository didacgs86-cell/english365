# English365 v2.6

Partimos del ZIP de GitHub facilitado por el usuario (v2.5).

## Cambios
- Cada tarjeta dispone en memoria de dos atributos independientes: `wordType` y `theme`, con correspondencias explícitas para las tarjetas heredadas. Los identificadores no cambian.
- Los errores y aciertos de tipo test, completar frases, traducción y recuerdo activo se incorporan al registro `practice` (sin alterar los intervalos de flashcards).
- En las respuestas escritas se ignoran diferencias de mayúsculas, espacios y puntuación final, y se admite opcionalmente `to` en infinitivos. No se aceptan sinónimos arbitrarios que podrían ser incorrectos en contexto.
- El resultado de recuerdo activo diferencia primera ronda y segunda oportunidad.
- La importación JSON conserva ahora el historial `practice` si existe.

## Actualización
Exporta el progreso desde la aplicación y conserva el JSON antes de actualizar. Sube `app.js` y `sw.js` a la raíz de GitHub, reemplazando los anteriores. Recarga la web; el service worker puede requerir una segunda recarga.

El algoritmo de flashcards sigue siendo una aproximación sencilla, no FSRS/Anki. El código ha pasado comprobación de sintaxis, pero debe probarse en el navegador.


## v2.9 — Speaking365
Nueva sección con ocho conversaciones contextualizadas: cafetería, restaurante, aeropuerto, hotel, charla informal, compras, trabajo y salud. Cada escena incluye cuatro intercambios con traducción opcional, lectura en voz alta del navegador, práctica guiada y respuesta escrita libre. El progreso de speaking se guarda en `english365_speaking_v1`, separado del vocabulario; la exportación JSON existente sigue exportando únicamente el progreso original de vocabulario y gramática. No hay reconocimiento de voz ni evaluación automática de pronunciación.
