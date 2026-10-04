import { z } from 'zod'

/**
 * Mapa de errores de Zod en español para toda la aplicación.
 */
const esErrorMap: z.ZodErrorMap = (issue, ctx) => {
  let message: string

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        message = 'Este campo es obligatorio'
      } else if (issue.expected === 'string') {
        message = 'Debe ser un texto'
      } else if (issue.expected === 'number') {
        message = 'Debe ser un número'
      } else if (issue.expected === 'boolean') {
        message = 'Debe ser verdadero o falso'
      } else if (issue.expected === 'date') {
        message = 'Debe ser una fecha válida'
      } else if (issue.expected === 'array') {
        message = 'Debe ser una lista'
      } else if (issue.expected === 'object') {
        message = 'Debe ser un objeto'
      } else {
        message = `Tipo inválido: se esperaba ${issue.expected}`
      }
      break

    case z.ZodIssueCode.invalid_literal:
      message = `Valor inválido. Se esperaba ${JSON.stringify(issue.expected)}`
      break

    case z.ZodIssueCode.unrecognized_keys:
      message = `Claves no reconocidas: ${issue.keys.map((k: string) => `'${k}'`).join(', ')}`
      break

    case z.ZodIssueCode.invalid_union:
      message = 'Entrada no válida'
      break

    case z.ZodIssueCode.invalid_enum_value:
      message = `Opción no válida. Las opciones aceptadas son: ${issue.options.join(', ')}`
      break

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        message = 'Correo electrónico inválido'
      } else if (issue.validation === 'url') {
        message = 'URL inválida'
      } else if (issue.validation === 'uuid') {
        message = 'UUID inválido'
      } else if (issue.validation === 'regex') {
        message = 'Formato inválido'
      } else {
        message = 'Texto inválido'
      }
      break

    case z.ZodIssueCode.too_small:
      if (issue.type === 'array') {
        message = issue.minimum === 1 ? 'Se requiere al menos un elemento' : `Se requieren al menos ${issue.minimum} elementos`
      } else if (issue.type === 'string') {
        message = issue.minimum === 1 ? 'Este campo es obligatorio' : `Debe tener al menos ${issue.minimum} caracteres`
      } else if (issue.type === 'number') {
        message = issue.inclusive ? `Debe ser mayor o igual a ${issue.minimum}` : `Debe ser mayor a ${issue.minimum}`
      } else {
        message = 'Valor demasiado pequeño'
      }
      break

    case z.ZodIssueCode.too_big:
      if (issue.type === 'array') {
        message = `No puede tener más de ${issue.maximum} elementos`
      } else if (issue.type === 'string') {
        message = `No puede tener más de ${issue.maximum} caracteres`
      } else if (issue.type === 'number') {
        message = issue.inclusive ? `Debe ser menor o igual a ${issue.maximum}` : `Debe ser menor a ${issue.maximum}`
      } else {
        message = 'Valor demasiado grande'
      }
      break

    case z.ZodIssueCode.custom:
      message = issue.message ?? 'Error de validación'
      break

    case z.ZodIssueCode.invalid_intersection_types:
      message = 'Tipos de intersección incompatibles'
      break

    case z.ZodIssueCode.not_multiple_of:
      message = `Debe ser múltiplo de ${issue.multipleOf}`
      break

    case z.ZodIssueCode.not_finite:
      message = 'Debe ser un número finito'
      break

    default:
      message = ctx.defaultError
  }

  return { message }
}

// Aplicar globalmente a toda la app
z.setErrorMap(esErrorMap)

export { esErrorMap }
