import bcrypt from 'bcryptjs';
import {
  ERROR_CODES,
  type LoginInput,
  type RegisterParentInput,
  type UserDTO,
} from '@ruya/shared';
import { UserModel, type User } from '../../models/User';
import { AppError } from '../../utils/AppError';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', BCRYPT_ROUNDS);

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function toUserDTO(user: User & { _id: unknown }): UserDTO {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as UserDTO['role'],
    locale: (user.locale ?? 'ar') as UserDTO['locale'],
    ...(user.child ? { childId: String(user.child) } : {}),
  };
}

export async function assertEmailFree(email: string) {
  if (await UserModel.exists({ email })) {
    throw new AppError(409, ERROR_CODES.EMAIL_TAKEN, 'Email is already registered');
  }
}

/** US-01 */
export async function registerParent(input: RegisterParentInput): Promise<UserDTO> {
  await assertEmailFree(input.email);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    locale: input.locale,
  });
  return toUserDTO(user.toObject());
}

/** US-01 / US-03: parents and children sign in the same way; the role decides the page. */
export async function login(input: LoginInput): Promise<UserDTO> {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash').lean();
  const matches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches) {
    throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Wrong email or password');
  }
  return toUserDTO(user);
}

export async function getUser(userId: string): Promise<UserDTO> {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw AppError.unauthenticated();
  return toUserDTO(user);
}
