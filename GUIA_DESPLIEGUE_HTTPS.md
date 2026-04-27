# 🔒 Guía de Despliegue HTTPS: Ngrok vs. Autofirmados

Esta guía explica las dos rutas posibles para habilitar **HTTPS** en tu servidor AWS EC2. Esto es obligatorio para que las funciones de **Voz e IA** funcionen correctamente en el navegador.

---

## 🚀 Opción 1: Ngrok (Túnel Seguro)
Ngrok crea un puente entre su red con certificado SSL oficial y tu contenedor Docker.

### Cómo aplicarlo:
1.  **Registro**: Crea una cuenta en [ngrok.com](https://ngrok.com) y obtén tu `Authtoken`.
2.  **Instalación en EC2**:
    ```bash
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
    ```
3.  **Configuración**: Agrega tu token: `ngrok config add-authtoken TU_TOKEN`.
4.  **Ejecución**: Lanza el túnel hacia el puerto del Frontend (4200):
    ```bash
    ngrok http 4200
    ```

### ✅ Pros:
- **Candadito verde oficial**: Sin avisos de seguridad.
- **Voz garantizada**: El navegador lo reconoce como sitio seguro de inmediato.
- **Sin configurar certificados**: Todo lo maneja Ngrok.

### ❌ Contras:
- La URL cambia si no usas un dominio estático (aunque hay uno gratis por cuenta).
- Requiere un proceso extra corriendo en el servidor.

---

## 🛠️ Opción 2: Certificados Autofirmados (Self-Signed)
Tú generas tus propias llaves de cifrado y configuras Nginx para que las use.

### Cómo aplicarlo:
1.  **Generar llaves**:
    ```bash
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout server.key -out server.crt
    ```
2.  **Configurar Docker**: Se deben montar estos archivos como volúmenes en el contenedor de Nginx.
3.  **Configurar Nginx**: Cambiar `listen 4200` por `listen 4200 ssl` y apuntar a los archivos `.crt` y `.key`.

### ✅ Pros:
- **Independencia total**: No necesitas internet para que el cifrado funcione.
- **100% Gratuito**: No dependes de cuentas externas ni límites de tráfico.
- **Permanente**: La IP de tu servidor nunca cambia.

### ❌ Contras:
- **Aviso de "Sitio no seguro"**: El usuario debe aceptar el riesgo manualmente la primera vez.
- **Configuración técnica**: Requiere tocar archivos de Nginx y Docker.

---

## 📊 Comparativa Directa

| Característica | Ngrok (Túnel) | Autofirmados (Manual) |
| :--- | :--- | :--- |
| **Facilidad** | ⭐⭐⭐⭐⭐ (Muy fácil) | ⭐⭐⭐ (Medio) |
| **Estética** | Profesional (Candado Verde) | "No seguro" (Aviso rojo) |
| **Ideal para...** | Demos, Tesis, Presentaciones | Desarrollo, Pruebas internas |
| **Dependencia** | Requiere cuenta de Ngrok | 100% Tuyo |
| **Funciona Voz?** | SÍ (Automático) | SÍ (Tras aceptar el aviso) |

---

## 💡 ¿Cuál es más fácil de aplicar?

Si lo que buscas es **velocidad y una presentación impecable** para tu profesor o cliente, **NGROK es el ganador**. No tienes que modificar casi nada de tu código actual y el micrófono funcionará a la primera sin que nadie tenga que "aceptar riesgos".

Si lo que buscas es **aprender la infraestructura real** de cómo funciona un servidor seguro y no quieres depender de que Ngrok esté encendido, ve por los **Autofirmados**.

---

### Próximo Paso Sugerido:
Dime cuál de las dos prefieres y procederé a entregarte los archivos de configuración (`docker-compose.yml` y `nginx.conf`) ajustados para esa opción específica.
