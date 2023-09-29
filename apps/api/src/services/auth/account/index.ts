import { generateSignedUrl } from '@/utils/s3';
import { createUpdateAccountInfo } from './update-account-info';
import { createGetAvatarUploadLink } from './get-avatar-upload-link';
import { createDeleteAccount } from './delete-account';
import { createCreateAccount } from './create-account';

export type AccountService = ReturnType<typeof createAccountService>;

export const createAccountService = () => ({
  createAccount: createCreateAccount(),
  updateAccountInfo: createUpdateAccountInfo(),
  getAvatarUploadLink: createGetAvatarUploadLink({ generateSignedUrl: generateSignedUrl }),
  deleteAccount: createDeleteAccount(),
});
