import Joi from 'joi';

export interface ValidationResult<T> {
  value: T | null;
  errors: Record<string, string> | null;
}

export function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.validate(data, { abortEarly: false, stripUnknown: true });

  if (!result.error) {
    return { value: result.value, errors: null };
  }

  const errors: Record<string, string> = {};
  for (const detail of result.error.details) {
    const field = String(detail.path[0] ?? 'form');
    if (!errors[field]) {
      errors[field] = detail.message;
    }
  }

  return { value: null, errors };
}

const emailRule = Joi.string().trim().email({ tlds: false }).required().messages({
  'string.email': "L'adresse email n'est pas valide",
  'string.empty': "L'adresse email est requise",
  'any.required': "L'adresse email est requise",
});

export const loginSchema = Joi.object({
  email: emailRule,
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Le mot de passe est requis',
    'any.required': 'Le mot de passe est requis',
  }),
});

export const registerSchema = Joi.object({
  email: emailRule,
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'digit')
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.name': 'Le mot de passe doit contenir au moins une majuscule et un chiffre',
      'string.empty': 'Le mot de passe est requis',
      'any.required': 'Le mot de passe est requis',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Les mots de passe ne correspondent pas',
    'any.required': 'La confirmation du mot de passe est requise',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: emailRule,
});

export const searchCitySchema = Joi.object({
  city: Joi.string()
    .trim()
    .min(2)
    .max(85)
    .pattern(/^[\p{L} .'-]+$/u, 'city name characters')
    .required()
    .messages({
      'string.min': 'Le nom de ville doit contenir au moins 2 caractères',
      'string.max': 'Le nom de ville est trop long',
      'string.pattern.name': 'Le nom de ville contient des caractères non autorisés',
      'string.empty': 'Le nom de ville est requis',
      'any.required': 'Le nom de ville est requis',
    }),
});
