// @ts-nocheck
import { z } from 'zod'

const esErrorMap: z.ZodErrorMap = (issue, ctx) => {
  let message = ctx.defaultError

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      message = 'Tipo inválido o campo obligatorio'
      break
    case z.ZodIssueCode.too_small:
      message = 'Valor demasiado pequeño o texto muy corto'
      break
    case z.ZodIssueCode.too_big:
      message = 'Valor demasiado grande o texto muy largo'
      break
    case z.ZodIssueCode.custom:
      message = issue.message ?? 'Error de validación'
      break
  }

  return { message }
}

z.setErrorMap(esErrorMap)

export { esErrorMap }
