import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Email is required'),
  password: yup.string().required('Password is required')
});

export const registerSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email address').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Include at least one uppercase letter')
    .matches(/[0-9]/, 'Include at least one number')
    .required('Password is required'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

export const transactionSchema = (type = 'income') => {
  const base = {
    amount: yup
      .number()
      .typeError('Enter a valid amount')
      .moreThan(0, 'Amount must be greater than zero')
      .required('Amount is required'),
    notes: yup.string().max(280, 'Keep notes under 280 characters').nullable()
  };

  if (type === 'income') {
    return yup.object({
      source: yup.string().required('Enter the income source'),
      date_received: yup.string().required('Select the received date'),
      ...base
    });
  }

  return yup.object({
    merchant: yup.string().required('Enter the merchant or payee'),
    date_spent: yup.string().required('Select the spending date'),
    category: yup
      .number()
      .transform((value) => (Number.isNaN(value) ? undefined : value))
      .typeError('Select a category')
      .required('Select a category'),
    ...base
  });
};

export const scholarshipApplicationSchema = yup.object({
  motivation: yup.string().min(50, 'Provide at least 50 characters').required('Motivation is required'),
  resume_url: yup.string().url('Enter a valid URL').nullable(),
  agree_terms: yup.bool().oneOf([true], 'You must agree before submitting')
});

export const repaymentSchema = yup.object({
  amount: yup
    .number()
    .typeError('Enter a valid amount')
    .moreThan(0, 'Amount must be greater than zero')
    .required('Amount is required'),
  paid_on: yup.string().required('Select the payment date'),
  notes: yup.string().max(280, 'Keep notes under 280 characters').nullable()
});

export const profileSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  phone: yup.string().nullable(),
  department: yup.string().nullable(),
  dob: yup.string().nullable()
});
