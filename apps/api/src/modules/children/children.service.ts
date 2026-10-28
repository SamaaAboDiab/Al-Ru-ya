import { isValidObjectId } from 'mongoose';
import {
  ERROR_CODES,
  MIN_CHILD_ACCOUNT_AGE,
  ROLES,
  ageInYears,
  type ChildDTO,
  type CreateChildAccountInput,
  type CreateChildInput,
  type ParentSummary,
  type UserDTO,
} from '@ruya/shared';
import { ChildModel, type Child } from '../../models/Child';
import { UserModel } from '../../models/User';
import type { AuthUser } from '../../middlewares/auth';
import { AppError } from '../../utils/AppError';
import { assertEmailFree, hashPassword, toUserDTO } from '../auth/auth.service';

type PopulatedParent = { _id: unknown; name: string; role: string };
type ChildWithParents = Omit<Child, 'parents'> & { _id: unknown; parents: PopulatedParent[] };

const PARENT_FIELDS = 'name role';

function toChildDTO(child: ChildWithParents): ChildDTO {
  return {
    id: String(child._id),
    name: child.name,
    birthDate: child.birthDate,
    hasAccount: Boolean(child.account),
    parents: child.parents.map((p) => ({
      id: String(p._id),
      name: p.name,
      role: p.role as ParentSummary['role'],
    })),
  };
}

/**
 * US-05: the one place that decides who may see a child.
 * A parent must be linked to the child; a child account may only see itself.
 * Unrelated users get 404 so they can't learn that the child exists.
 */
export async function findAccessibleChild(user: AuthUser, childId: string) {
  if (!isValidObjectId(childId)) throw AppError.notFound('Child');
  const child = await ChildModel.findOne(accessFilter(user, childId)).lean();
  if (!child) throw AppError.notFound('Child');
  return child;
}

function accessFilter(user: AuthUser, childId: string) {
  return user.role === ROLES.CHILD ? { _id: childId, account: user.id } : { _id: childId, parents: user.id };
}

/**
 * Runs a child-scoped read in parallel with the access check, to save a database
 * round trip. The read's result is only returned once access is confirmed.
 */
export async function withAccessibleChild<T>(user: AuthUser, childId: string, read: () => Promise<T>) {
  if (!isValidObjectId(childId)) throw AppError.notFound('Child');
  const [child, result] = await Promise.all([findAccessibleChild(user, childId), read()]);
  return { child, result };
}

export async function listChildrenForParent(parentId: string): Promise<ChildDTO[]> {
  const children = await ChildModel.find({ parents: parentId })
    .sort({ createdAt: 1 })
    .limit(50)
    .populate<{ parents: PopulatedParent[] }>('parents', PARENT_FIELDS)
    .lean();
  return children.map(toChildDTO);
}

export async function getChild(user: AuthUser, childId: string): Promise<ChildDTO> {
  if (!isValidObjectId(childId)) throw AppError.notFound('Child');
  // The access filter and the populate run as one lookup instead of two.
  const child = await ChildModel.findOne(accessFilter(user, childId))
    .populate<{ parents: PopulatedParent[] }>('parents', PARENT_FIELDS)
    .lean();
  if (!child) throw AppError.notFound('Child');
  return toChildDTO(child);
}

/** A child profile managed by the parents, for any age. */
export async function createChild(parentId: string, input: CreateChildInput): Promise<ChildDTO> {
  const child = await ChildModel.create({
    name: input.name,
    birthDate: input.birthDate,
    parents: [parentId],
    createdBy: parentId,
  });
  const populated = await child.populate<{ parents: PopulatedParent[] }>('parents', PARENT_FIELDS);
  return toChildDTO(populated.toObject());
}

/** US-02: a child gets their own login only from MIN_CHILD_ACCOUNT_AGE. */
export async function createChildAccount(
  parent: AuthUser,
  childId: string,
  input: CreateChildAccountInput,
  now: Date = new Date(),
): Promise<UserDTO> {
  const child = await findAccessibleChild(parent, childId);
  if (child.account) {
    throw new AppError(409, ERROR_CODES.CHILD_ACCOUNT_EXISTS, 'This child already has an account');
  }
  if (ageInYears(child.birthDate, now) < MIN_CHILD_ACCOUNT_AGE) {
    throw new AppError(
      422,
      ERROR_CODES.CHILD_TOO_YOUNG,
      `A child account needs the child to be at least ${MIN_CHILD_ACCOUNT_AGE}`,
    );
  }
  await assertEmailFree(input.email);

  const parentUser = await UserModel.findById(parent.id).select('locale').lean();
  const account = await UserModel.create({
    name: child.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: ROLES.CHILD,
    locale: parentUser?.locale,
    child: child._id,
  });

  // Link only if no other request linked an account meanwhile; otherwise undo our insert.
  const linked = await ChildModel.updateOne(
    { _id: child._id, account: { $exists: false } },
    { $set: { account: account._id } },
  );
  if (linked.modifiedCount === 0) {
    await UserModel.deleteOne({ _id: account._id });
    throw new AppError(409, ERROR_CODES.CHILD_ACCOUNT_EXISTS, 'This child already has an account');
  }
  return toUserDTO(account.toObject());
}
