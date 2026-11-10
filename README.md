# Rastrea la ruta · Caso BEC

Actividad web estática, adaptable y sin dependencias. Abre `index.html` para usarla localmente. Para GitHub Pages, publica el contenido de esta carpeta en la raíz del repositorio o configura Pages para servir esta carpeta desde la rama `main`.

## Publicar con GitHub Pages

1. Copia los archivos de esta carpeta a la raíz del repositorio de GitHub (o conserva la carpeta y selecciona su ruta como fuente si tu flujo de publicación lo permite).
2. En el repositorio, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`; luego guarda.
4. Espera a que termine el despliegue. GitHub mostrará la dirección pública en la misma sección.

No requiere compilación, paquetes, claves ni backend. El juego mantiene el estado solo durante la sesión; no recopila ni envía respuestas.

## Contenido y alcance

- Caso ficticio de compromiso de un buzón de cuentas por pagar y cambio de datos de proveedor.
- Selección de fuentes de telemetría: identidad, auditoría de buzón, ERP, correo y endpoint.
- Evaluación de cuatro transacciones; el alcance confirmado son los dos pagos pendientes al proveedor con el registro alterado.
- Comparación de un paquete de controles que reduce riesgo sin contener toda la ruta y otro que contiene el escenario simulado antes de liberar fondos.
- Correlación condicional con MITRE ATT&CK T1078.004, T1114.003 y T1657; no se atribuye un vector de acceso no confirmado.

Todo el caso, la organización, los proveedores, los importes y las señales son ficticios. La actividad es educativa y no constituye una recomendación de respuesta para un incidente real. Las técnicas y el resultado dependen de evidencia y de la ejecución efectiva de controles.

## Fuentes oficiales

- FBI, Business Email Compromise: https://www.fbi.gov/how-we-can-help-you/common-frauds-and-scams/business-email-compromise
- MITRE ATT&CK, Valid Accounts: Cloud Accounts (T1078.004): https://attack.mitre.org/techniques/T1078/004/
- MITRE ATT&CK, Email Forwarding Rule (T1114.003): https://attack.mitre.org/techniques/T1114/003/
- MITRE ATT&CK, Financial Theft (T1657): https://attack.mitre.org/techniques/T1657/
