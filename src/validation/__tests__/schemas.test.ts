import { validate, loginSchema, registerSchema, searchCitySchema, forgotPasswordSchema } from '../schemas';

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    const { value, errors } = validate(loginSchema, { email: 'user@example.com', password: 'secret' });
    expect(errors).toBeNull();
    expect(value).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  it('rejects an invalid email', () => {
    const { value, errors } = validate(loginSchema, { email: 'not-an-email', password: 'secret' });
    expect(value).toBeNull();
    expect(errors?.email).toBe("L'adresse email n'est pas valide");
  });

  it('rejects an empty password', () => {
    const { errors } = validate(loginSchema, { email: 'user@example.com', password: '' });
    expect(errors?.password).toBe('Le mot de passe est requis');
  });
});

describe('registerSchema', () => {
  it('accepts a strong password with a matching confirmation', () => {
    const { value, errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'Secret123',
      confirmPassword: 'Secret123',
    });
    expect(errors).toBeNull();
    expect(value?.password).toBe('Secret123');
  });

  it('rejects a password without an uppercase letter or digit', () => {
    const { errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'secretsecret',
      confirmPassword: 'secretsecret',
    });
    expect(errors?.password).toBe('Le mot de passe doit contenir au moins une majuscule et un chiffre');
  });

  it('rejects a password shorter than 8 characters', () => {
    const { errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'Ab1',
      confirmPassword: 'Ab1',
    });
    expect(errors?.password).toBe('Le mot de passe doit contenir au moins 8 caractères');
  });

  it('rejects a mismatched confirmation', () => {
    const { errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'Secret123',
      confirmPassword: 'Different123',
    });
    expect(errors?.confirmPassword).toBe('Les mots de passe ne correspondent pas');
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const { value, errors } = validate(forgotPasswordSchema, { email: 'user@example.com' });
    expect(errors).toBeNull();
    expect(value).toEqual({ email: 'user@example.com' });
  });

  it('rejects an invalid email', () => {
    const { errors } = validate(forgotPasswordSchema, { email: 'not-an-email' });
    expect(errors?.email).toBe("L'adresse email n'est pas valide");
  });
});

describe('searchCitySchema', () => {
  it('accepts a plain city name', () => {
    const { value, errors } = validate(searchCitySchema, { city: 'Paris' });
    expect(errors).toBeNull();
    expect(value).toEqual({ city: 'Paris' });
  });

  it('rejects an empty city', () => {
    const { errors } = validate(searchCitySchema, { city: '' });
    expect(errors?.city).toBe('Le nom de ville est requis');
  });

  it('rejects a city name with digits', () => {
    const { errors } = validate(searchCitySchema, { city: 'Paris123' });
    expect(errors?.city).toBe('Le nom de ville contient des caractères non autorisés');
  });
});
