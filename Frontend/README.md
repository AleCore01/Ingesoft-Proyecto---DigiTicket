# DigiTicket - Login Page

Una página de inicio de sesión moderna y responsiva construida con React, TypeScript y Tailwind CSS.

## Características

- ✨ Diseño moderno con gradiente rosa-morado
- 📱 Completamente responsivo
- 🔒 Validación de formularios en tiempo real
- ♿ Accesible con ARIA labels
- 🎨 Animaciones suaves y transiciones
- 🌐 Interfaz en español

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`

3. Inicia el servidor de desarrollo:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Abre tu navegador en `http://localhost:5173`

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter
- `npm test` - Ejecuta los tests en modo watch
- `npm test -- --run` - Ejecuta los tests una sola vez
- `npm run test:ui` - Abre la interfaz gráfica de Vitest
- `npm run test:coverage` - Genera reporte de cobertura

## Estructura del Proyecto

\`\`\`
src/
├── components/          # Componentes reutilizables
├── hooks/              # Custom hooks
├── pages/              # Páginas de la aplicación
├── styles/             # Estilos globales
├── types/              # Definiciones de TypeScript
├── assets/             # Recursos estáticos
└── utils/              # Utilidades
\`\`\`

## Testing

### Configuración

El proyecto utiliza **Vitest** como framework de testing junto con **React Testing Library** para pruebas de componentes y **MSW (Mock Service Worker)** para interceptar peticiones HTTP.

### Ejecutar Tests

```bash
# Modo watch (recomendado durante desarrollo)
npm test

# Ejecutar una sola vez (ideal para CI/CD)
npm test -- --run

# Interfaz gráfica interactiva
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

### Estructura de Tests

Los tests están organizados siguiendo el patrón de colocation en carpetas `__tests__`:

```
src/services/
├── cartService.js
├── eventsService.js
├── localService.js
└── __tests__/
    ├── cartService.test.js      (31 tests)
    ├── eventsService.test.js    (33 tests)
    ├── localService.test.js     (30 tests)
    ├── orderService.test.js     (11 tests)
    ├── ticketService.test.js    (10 tests)
    ├── eventZoneService.test.js (20 tests)
    ├── eventCategoryService.test.js (14 tests)
    └── auth.service.test.ts     (19 tests)
```

**Total: 168 tests (163 passing, 5 skipped)**

### Cobertura Actual

- **cartService**: CRUD, validaciones de cantidad máxima (4 tickets), campos requeridos
- **eventsService**: CRUD, búsqueda, publicación/cancelación, validaciones
- **localService**: CRUD, búsqueda por nombre/estado/distrito, ciudades y distritos
- **orderService**: Listado, filtrado por estado, detalle de orden
- **ticketService**: Listado por evento, obtención individual, stock disponible
- **eventZoneService**: CRUD, listado por evento, disponibilidad
- **eventCategoryService**: CRUD, búsqueda por nombre
- **auth.service**: Login, registro, reset de contraseña

### Escribir Tests

Los tests utilizan MSW para mockear las respuestas del API:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { serviceToTest } from '../serviceToTest';

describe('serviceToTest', () => {
  beforeEach(() => {
    // Setup si es necesario
  });

  it('debería hacer X correctamente', async () => {
    const result = await serviceToTest.method();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('expectedProperty');
  });

  it('debería fallar cuando Y', async () => {
    await expect(
      serviceToTest.methodThatFails()
    ).rejects.toThrow('Expected error message');
  });
});
```

### CI/CD y package-lock.json

El archivo `package-lock.json` es **crítico** para CI/CD porque:

1. **Reproducibilidad**: Garantiza que todos los desarrolladores y el pipeline de CI/CD usen exactamente las mismas versiones de dependencias
2. **Velocidad**: `npm ci` es ~2x más rápido que `npm install` porque usa el lockfile directamente sin resolver dependencias
3. **Seguridad**: Previene actualizaciones inesperadas de dependencias que podrían introducir vulnerabilidades
4. **Integridad**: Incluye checksums SHA-512 de cada paquete para verificar que no han sido modificados

**GitHub Actions** (en `.github/workflows/deploy.yml`) usa:
```yaml
- name: Install dependencies
  run: npm ci  # ← Requiere package-lock.json
```

⚠️ **Importante**: Siempre commitea `package-lock.json` al repositorio. Nunca lo agregues a `.gitignore`.

### Buenas Prácticas

1. **AAA Pattern**: Arrange, Act, Assert
2. **Nombres descriptivos**: `debería [acción] cuando [condición]`
3. **Un concepto por test**: Cada test valida una sola funcionalidad
4. **Independencia**: Los tests no deben depender del orden de ejecución
5. **Fast**: Tests rápidos (~2-3 segundos para 168 tests)
6. **Mocks realistas**: MSW simula respuestas del backend real

## Tecnologías

- React 18
- TypeScript
- Tailwind CSS
- Vite
- ESLint + Prettier
- Vitest + React Testing Library + MSW
