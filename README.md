# English365

Aplicación personal de inglés B2: vocabulario, gramática y tarjetas de repaso.

## Publicar con GitHub Pages
1. Subir todos los archivos a la **raíz** del repositorio `english365`.
2. Abrir **Settings → Pages**.
3. En **Build and deployment**, seleccionar **Deploy from a branch**.
4. Seleccionar `main` y `/ (root)` y guardar.
5. Abrir la dirección publicada por GitHub Pages (normalmente `https://TU-USUARIO.github.io/english365/`).

## Datos y sincronización
No hay servidor ni cuentas. Los avances se guardan en `localStorage` del navegador, por dispositivo y por origen web. Desde Inicio, **Exportar progreso** crea una copia JSON; en otro dispositivo, **Importar progreso** reemplaza sus datos actuales. Antes de importar, exporta una copia del progreso del dispositivo de destino. No existe sincronización automática ni combinación de progresos.

## Flashcards
Algoritmo sencillo propio de repetición espaciada, **no FSRS**. Las cuatro calificaciones cambian la fecha de repaso. "Otra vez" programa un repaso en aproximadamente un minuto, pero no lo inserta de nuevo en la sesión actual. El repaso se realiza al volver a entrar. El sistema se podrá mejorar más adelante.

## Contenido
24 tarjetas de vocabulario B2, 6 lecciones de gramática y 18 preguntas gramaticales iniciales. Las preguntas de completar frases sustituyen la expresión inglesa dentro del ejemplo. Algunos ejemplos pueden ser más fáciles que B2; es una base ampliable.

## Instalación
En iPhone: abrir en Safari → Compartir → Añadir a pantalla de inicio. En Mac: abrir en navegador; Safari permite añadir a Dock en versiones compatibles. Se puede usar parcialmente sin conexión después de la primera carga, gracias al service worker.

## Privacidad
Los archivos del repositorio y el contenido de estudio son públicos en GitHub Pages. Los avances locales no se suben a GitHub. No publiques copias de seguridad de tu progreso en el repositorio.
