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
    errors.email = 'Email không được để trống.';
  } else if (!EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Vui lòng nhập email hợp lệ.';
  }

  if (isBlank(input.password)) {
    errors.password = 'Mật khẩu không được để trống.';
  } else if (input.password.length < 6) {
    errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
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
    errors.username = 'Tên đăng nhập không được để trống.';
  } else if (username.length < 3) {
    errors.username = 'Tên đăng nhập tối thiểu 3 ký tự.';
  }

  // Email - same as backend @NotBlank, @Email
  if (!email) {
    errors.email = 'Email không được để trống.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Vui lòng nhập email hợp lệ.';
  }

  // Phone - same as backend @NotBlank, @Pattern(0[35789][0-9]{8})
  if (!input.phone.trim()) {
    errors.phone = 'Số điện thoại không được để trống.';
  } else if (!VN_PHONE_REGEX.test(phone)) {
    errors.phone = 'Vui lòng nhập số điện thoại hợp lệ.';
  }

  // Address - same as backend @NotBlank
  if (!address) {
    errors.address = 'Địa chỉ không được để trống.';
  }

  // Password - same as backend @NotBlank
  if (isBlank(input.password)) {
    errors.password = 'Mật khẩu không được để trống.';
  }

  // Confirm password - same as backend @NotBlank + @PasswordValid
  if (isBlank(input.confirmPassword)) {
    errors.confirmPassword = 'Xác nhận mật khẩu không được để trống.';
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu không khớp.';
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
    errors.name = 'Vui lòng nhập tên người nhận.';
  }
  if (isBlank(input.phone)) {
    errors.phone = 'Vui lòng nhập số điện thoại người nhận.';
  }
  if (isBlank(input.address)) {
    errors.address = 'Vui lòng nhập địa chỉ giao hàng.';
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
    errors.name = 'Họ tên không được để trống.';
  } else if (input.name.trim().length < 3) {
    errors.name = 'Họ tên tối thiểu 3 ký tự.';
  }

  if (isBlank(input.phone)) {
    errors.phone = 'Số điện thoại không được để trống.';
  } else if (!US_PHONE_REGEX.test(input.phone.trim()) && !VN_PHONE_REGEX.test(normalizePhone(input.phone))) {
    errors.phone = 'Định dạng số điện thoại không hợp lệ.';
  }

  if (isBlank(input.address)) {
    errors.address = 'Địa chỉ không được để trống.';
  }

  return errors;
}
