/**
 * Punto único de configuración de marca (backlog ID 108, ADR-009 en docs/DECISIONS.md).
 *
 * El nombre comercial es PROVISIONAL y puede cambiar antes del lanzamiento.
 * Ningún otro archivo de código debe contener el string "Decidero" (ni el nombre
 * final que lo reemplace) escrito literalmente — todo lo que se muestre al usuario,
 * en SEO/metadata, en seeds de base de datos o en configuración de servicios externos
 * (AdSense, afiliados, Vercel, dominios) debe importar estos valores desde aquí.
 *
 * Para renombrar la plataforma: editar únicamente este archivo.
 */

export const brand = {
  /** Nombre comercial mostrado al usuario. PROVISIONAL — ver ADR-009. */
  name: "Decidero",

  /** Slug técnico estable, independiente del nombre comercial. No cambia con un rebranding. */
  technicalSlug: "jprs-monetization-platform",

  /** Dominio de producción. Vacío hasta que se registre (backlog ID 109). */
  domain: "",

  /** Descripción corta de fallback para metadata/SEO cuando no hay copy localizado disponible. El sitio público es multi-idioma (EN/ES/PT/HI) — el copy real por página vive en src/lib/i18n/{locale}.ts. */
  tagline: "Discovery, comparison, and decision platform",
} as const;

export type Brand = typeof brand;
