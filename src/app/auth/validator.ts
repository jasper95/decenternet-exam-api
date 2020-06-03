import { JSONSchema7 } from 'json-schema'
import USER_TABLE from 'schema/user'

export const LoginValidator: JSONSchema7 = {
  type: 'object',
  title: 'LoginSchema',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
}

export const SignupValidator: JSONSchema7 = {
  type: 'object',
  title: 'SignupSchema',
  ...USER_TABLE.schema,
}

export const ForgotPasswordValidator: JSONSchema7 = {
  type: 'object',
  title: 'ForgotPasswordSchema',
  required: ['username'],
  properties: {
    username: {
      type: 'string',
    },
  },
}

export const ResetPasswordValidator: JSONSchema7 = {
  type: 'object',
  title: 'ResetPasswordSchema',
  required: ['password'],
  properties: {
    password: {
      type: 'string',
    },
    token: {
      type: 'string',
    },
  },
}

export const VerifyAccountValidator: JSONSchema7 = {
  type: 'object',
  title: 'VerifyAccountSchema',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
    },
  },
}

export default {
  LoginValidator,
  SignupValidator,
  ForgotPasswordValidator,
  ResetPasswordValidator,
  VerifyAccountValidator,
}
