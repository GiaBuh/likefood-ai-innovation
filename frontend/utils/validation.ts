export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^(0[35789][0-9]{8})$/;
const US_PHONE_REGEX = /^(\+1\s?)?(\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4})$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {};
  if (isBlank(input.email)) {
    errors.email = 'Email must not be blank.';
  } else if (!EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (isBlank(input.password)) {
    errors.password = 'Password must not be blank.';
  } else if (input.password.length < 6) {
    errors.password = 'Password at least 6 character';
  }
  return errors;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, '').trim();
}

export function validateRegister(input: {
  username: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}): FieldErrors<'username' | 'email' | 'phone' | 'address' | 'password' | 'confirmPassword'> {
  const errors: FieldErrors<'username' | 'email' | 'phone' | 'address' | 'password' | 'confirmPassword'> = {};
  const username = input.username.trim();
  const email = input.email.trim();
  const phone = normalizePhone(input.phone);
  const address = input.address.trim();

  // Username - same as backend @NotBlank, @Length(min=3)
  if (!username) {
    errors.username = 'Username must not be blank.';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long.';
  }

  // Email - same as backend @NotBlank, @Email
  if (!email) {
    errors.email = 'Email must not be blank.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  // Phone - same as backend @NotBlank, @Pattern(0[35789][0-9]{8})
  if (!input.phone.trim()) {
    errors.phone = 'Phone number must not be blank.';
  } else if (!VN_PHONE_REGEX.test(phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  // Address - same as backend @NotBlank
  if (!address) {
    errors.address = 'Address must not be blank.';
  }

  // Password - same as backend @NotBlank
  if (isBlank(input.password)) {
    errors.password = 'Password must not be blank.';
  }

  // Confirm password - same as backend @NotBlank + @PasswordValid
  if (isBlank(input.confirmPassword)) {
    errors.confirmPassword = 'Confirm password must not be blank.';
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Password not match';
  }

  return errors;
}

export function validateCheckout(input: {
  name: string;
  phone: string;
  address: string;
}): FieldErrors<'name' | 'phone' | 'address'> {
  const errors: FieldErrors<'name' | 'phone' | 'address'> = {};
  if (isBlank(input.name)) {
    errors.name = 'Receiver name is required';
  }
  if (isBlank(input.phone)) {
    errors.phone = 'Receiver phone is required';
  }
  if (isBlank(input.address)) {
    errors.address = 'Shipping address is required';
  }
  return errors;
}

export function validateProfile(input: {
  name: string;
  phone: string;
  address: string;
}): FieldErrors<'name' | 'phone' | 'address'> {
  const errors: FieldErrors<'name' | 'phone' | 'address'> = {};

  if (isBlank(input.name)) {
    errors.name = 'Username must not be blank';
  } else if (input.name.trim().length < 3) {
    errors.name = 'Length fullName at least 3 character';
  }

  if (isBlank(input.phone)) {
    errors.phone = 'Phone number must not be blank';
  } else if (!US_PHONE_REGEX.test(input.phone.trim()) && !VN_PHONE_REGEX.test(normalizePhone(input.phone))) {
    errors.phone = 'Invalid phone number format';
  }

  if (isBlank(input.address)) {
    errors.address = 'Address must not be blank';
  }

  return errors;
}
