# Ersunny Travel — Transfer aeropuerto Punta Cana…

Sitio de reservas para traslados privados del Aeropuerto Internacional de Punta Cana (PUJ) a hoteles en **Punta Cana**, **Bávaro** y **Macao**, más excursiones.

## Sitio en vivo

https://zukiskyrim02-arch.github.io/ersunny-travel/

## Panel admin

http://localhost:5173/admin

El acceso es con un código de un solo uso por correo (Resend), solo a las direcciones de `ADMIN_EMAILS`. Las variables están en `.env.example` (Resend, `SESSION_SECRET` y Cloudinary).

En **Medios** subes fotos y videos y los asignas a cada apartado (portada, traslados, excursiones, etc.). El catálogo se guarda en Cloudinary. Si un apartado no tiene archivo, el sitio sigue mostrando la imagen local de respaldo.
