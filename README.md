# Kyboo 📚

🌐 **Ruta oficial de la aplicación:** [kybooo.vercel.app](https://kybooo.vercel.app)

Kyboo es una plataforma moderna centrada en promover una comunidad lectora dentro de la UDG (Universidad de Guadalajara). El objetivo principal de la aplicación es conectar a estudiantes a través de la lectura, permitiendo publicar libros para intercambiar con otros usuarios, además de crear comunidades que se centren en géneros literarios específicos. La plataforma cuenta con chat para comunicación y ofrece recomendaciones altamente personalizadas gracias al análisis de tus interacciones dentro de la app.

## 🚀 Tecnologías Utilizadas

- <img src="https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=white" alt="Neon" /> **Neon (PostgreSQL)**
- <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" /> **Next.js 14**
- <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" /> **Vercel**
- <img src="https://img.shields.io/badge/Uploadthing-black?style=flat-square" alt="Uploadthing" /> **Uploadthing**
- <img src="https://img.shields.io/badge/NextAuth-000000?style=flat-square&logo=next.js&logoColor=white" alt="NextAuth.js" /> **NextAuth.js**
- <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /> **Tailwind CSS**
- <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /> **TypeScript**
- <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white" alt="GitHub Actions" /> **GitHub Actions**
- <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" /> **Python**

### ¿Cómo funciona la aplicación con estas tecnologías?

- **Frontend & Backend Integrado**: Toda la aplicación y servidor corren sobre **Next.js** desplegado y alojado en la infraestructura de punta de **Vercel**. Esto permite una experiencia rápida y fluida, conectándose de manera segura con el motor PostgreSQL a través del uso de Drizzle ORM. Todo mantenido bajo el tipado seguro de **TypeScript** y estilos construidos con agilidad gracias a **Tailwind CSS**.
- **Autenticación Segura**: **NextAuth.js** provee un flujo de inicio de sesión y registro protegido para manejar las sesiones de los estudiantes de manera eficiente, resguardando su información.
- **Gestión de Archivos**: Al publicar la portada de un libro, cambiar un avatar o agregar una imagen a una comunidad, entra en juego **Uploadthing**, gestionando los archivos multimedia subidos y devolviendo URLs optimizadas que se guardan en la base de datos.
- **Base de Datos Dinámica**: **Neon** provee una base de datos relacional (PostgreSQL) robusta sin servidor que almacena de manera centralizada los usuarios, libros, comunidades, mensajes de chat y preferencias. Además, su soporte a diversas extensiones permite habilitar la lógica vectorial necesaria para la aplicación sin fricciones.
- **Sistema de Recomendaciones (SVD)**: Aquí convergen **Python** y **GitHub Actions**. Diariamente (a las 00:00 hrs de MX), mediante el uso de flujos y funciones programadas con GitHub Actions, se ejecuta un script en Python que procesa masivamente las interacciones de los usuarios en la plataforma. Utilizando la técnica de reducción de dimensionalidad **Singular Value Decomposition (SVD)** (un pilar para métodos de filtrado colaborativo o Matrix Factorization), el sistema perfila las afinidades subyacentes de los usuarios comparándolos entre sí, calculando y guardando de vuelta **vectores de afinidad** en la base de datos de Neon. La plataforma (con **Next.js**) luego utiliza y consulta esos vectores en conjunto un algoritmo basado en **similitud de cosenos**, generando interacciones cruzadas en tiempo real para recomendarte afinidades extremadamente precisas de nuevos libros y comunidades personalizadas.

## 🛠️ Instrucciones de Instalación y Configuración

Sigue estos pasos para poner a correr la aplicación de forma local:

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <https://github.com/AngelParadaP/ChangeBook.git>
cd ChangeBook
pnpm install
```

### 2. Base de Datos (Neon)

1. Crea un nuevo proyecto en la página oficial de [Neon](https://neon.tech/).
2. Copia la URL de tu base de datos de la plataforma y asegúrate **muy importante** de que tenga agregada en el string de conexión los siguientes 3 parámetros. Debe de quedar similar a este formato:
   `postgresql://usuario:contraseña@neon-host.com/dbname?sslmode=require&channel_binding=require&uselibpqcompat=true`
3. Antes de siquiera correr las migraciones, ve a la sección de **SQL Editor** dentro del proyecto en Neon y ejecuta el siguiente comando explícito para habilitar el uso de arreglos vectoriales dentro para nuestra base de datos.
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### 3. Almacenamiento (Uploadthing)

1. Ve hacia [Uploadthing](https://uploadthing.com/) e inicia sesión. Crea allí un bucket o aplicación nueva.
2. Extrae las claves provistas por la plataforma en su panel principal; necesitarás tanto el `secret` como la `key` o (App ID).

### 4. Variables de Entorno

Una vez tengamos lo anterior, crea un archivo `.env.local` en el nivel base del repositorio de proyecto para alojarlas:

```env
# Base de Datos
DATABASE_URL="pegada-de-neon-con-parametros"

# NextAuth
# Para originar un código nextauth_secret de alta seguridad para cifrar las contraseñas, corre el comando en tu terminal: openssl rand -base64 32
NEXTAUTH_SECRET="el-hash-generado-por-ti"

# Y en nextauth_url será tu URI local, o bien, si planeas enviarlo a produccion, pega el link raíz final del despliegue en Vercel
NEXTAUTH_URL="http://localhost:3000"

# Uploadthing 
UPLOADTHING_SECRET="tu-secreto-uploadthing"
UPLOADTHING_APP_ID="tu-llave-uploadthing"
```

> **⚠️ IMPORTANTE para las Recomendaciones (GitHub Actions):** 
> Para que el script de Python que genera las recomendaciones pueda ejecutarse correctamente y conectarse a la base de datos de Neon de forma automatizada, es **indispensable** que agregues el mismo valor de tu `DATABASE_URL` como un **Secret del repositorio en GitHub** (en *Settings > Secrets and variables > Actions > New repository secret* con el nombre `DATABASE_URL`).

### 5. Empuje de Migración al Schema de Datos

Ahora estamos listos para alinear nuestra base de datos remota en la nube a la que creaste localmente, tomando la configuración original sin romper nada:

```bash
pnpm exec drizzle-kit migrate
```
(*El comando aplicará la última estructura faltante a tu base de datos, incluyendo desde las tablas nativas hasta las columnas vectoriales implementadas de los exchanges.*)

### 6. Ejecución del Servidor

Por final, pon a lanzar el host local para usar la app mediante el último script:

```bash
pnpm run dev
```

Abre o navega directamente dentro de tu navegador buscando **[http://localhost:3000](http://localhost:3000)**. 🚀

## 🧠 Sistema de Inteligencia Artificial (Machine Learning)

El proyecto cumple con requerimientos técnicos avanzados de Inteligencia Artificial enfocados en un motor de recomendaciones altamente personalizado. Esto se logra implementando **Factorización de Matrices (Matrix Factorization)** orientado a un modelo de **Filtrado Colaborativo Implícito**.

- **Uso de Singular Value Decomposition (SVD):** A través de un script dedicado en Python (`recommendations.py`), el sistema forma y construye una enorme matriz de interacciones cruzadas. Esta es una matriz dispersa llena de *"calificaciones implícitas"* (las cuales son derivadas al evaluar distintas acciones con pesos ponderados, como: agregar a favoritos, el estatus de avance en intercambios y la afinidad natural por géneros). Posteriormente, el script descompone matemáticamente esta gráfica con la función `np.linalg.svd`. Esta descomposición extrae relaciones matemáticas ocultas o *características latentes* entre los nodos.
- **Atributos Latentes y Reducción de Dimensionalidad:** Al sintetizar el número de factores durante la factorización de las matrices, se fuerza a la IA a aprender generalizaciones por sí sola. Si varios usuarios con gustos anónimos demuestran un consumo recurrente en patrones idénticos en la plataforma, la reducción dimensiona las correlaciones que definiremos como un "Vector de Perfilamiento Múltiple".
- **Similitud de Coseno Integrada (Backend):** Tras reducirse, los tensores (*embeddings*) generados en Python se inyectan a la estructura vectorial de nuestra base de datos **Neon**. Posteriormente, el backend de Next.js evalúa rápidamente su volumen usando el teorema de **Similitud de Coseno** comparando métricas contra los vectores de los libros/comunidades a renderizar. Todo esto ocurre al vuelo (en tiempo real) para el cliente que solicita resultados refrescados en su dashboard.

## 👥 Autores

- **Angel Parada Perez**
- **Cesar Balam Espinosa Nuñez**
- **Brenda Zamarripa Ramirez**